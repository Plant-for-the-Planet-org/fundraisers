import { describe, expect, it, vi } from 'vitest';
import { createCanvas } from '@napi-rs/canvas';
import { fitsDecodeBudget, readImageSize } from './image-size';

vi.mock('server-only', () => ({}));

function pngHeader(width: number, height: number): Buffer {
  const b = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write('IHDR', 12, 'latin1');
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
}

function jpegHeader(width: number, height: number): Buffer {
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x04, 0x00, 0x00]);
  const sof = Buffer.alloc(11);
  sof.set([0xff, 0xc0, 0x00, 0x0b, 0x08]);
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof]);
}

/** A GIF with no colour tables and one frame at (left, top), with empty image data. */
function gif(
  screen: [number, number],
  frame: [number, number, number, number]
): Buffer {
  const head = Buffer.alloc(13);
  head.write('GIF89a', 0, 'latin1');
  head.writeUInt16LE(screen[0], 6);
  head.writeUInt16LE(screen[1], 8);
  const descriptor = Buffer.alloc(10);
  descriptor[0] = 0x2c;
  frame.forEach((value, index) =>
    descriptor.writeUInt16LE(value, 1 + 2 * index)
  );
  const extension = Buffer.from([0x21, 0xf9, 0x04, 0, 0, 0, 0, 0x00]);
  const data = Buffer.from([0x02, 0x01, 0x00, 0x00]);
  return Buffer.concat([
    head,
    extension,
    descriptor,
    data,
    Buffer.from([0x3b]),
  ]);
}

function webpVp8x(width: number, height: number): Buffer {
  const b = Buffer.alloc(30);
  b.write('RIFF', 0, 'latin1');
  b.write('WEBP', 8, 'latin1');
  b.write('VP8X', 12, 'latin1');
  b.writeUIntLE(width - 1, 24, 3);
  b.writeUIntLE(height - 1, 27, 3);
  return b;
}

function webpVp8(width: number, height: number): Buffer {
  const b = Buffer.alloc(30);
  b.write('RIFF', 0, 'latin1');
  b.write('WEBP', 8, 'latin1');
  b.write('VP8 ', 12, 'latin1');
  b.set([0x9d, 0x01, 0x2a], 23);
  b.writeUInt16LE(width, 26);
  b.writeUInt16LE(height, 28);
  return b;
}

function webpVp8l(width: number, height: number): Buffer {
  const b = Buffer.alloc(30);
  b.write('RIFF', 0, 'latin1');
  b.write('WEBP', 8, 'latin1');
  b.write('VP8L', 12, 'latin1');
  b[20] = 0x2f;
  b.writeUInt32LE(((width - 1) | ((height - 1) << 14)) >>> 0, 21);
  return b;
}

async function encoded(type: 'png' | 'jpeg' | 'webp' | 'avif') {
  const canvas = createCanvas(37, 23);
  const g = canvas.getContext('2d');
  g.fillStyle = '#2f8f4e';
  g.fillRect(0, 0, 37, 23);
  return canvas.encode(type as 'png');
}

describe('readImageSize', () => {
  it.each(['png', 'jpeg', 'webp'] as const)(
    'reads a real %s file without decoding it',
    async type => {
      expect(readImageSize(await encoded(type))).toEqual({
        width: 37,
        height: 23,
      });
    }
  );

  it('reads crafted headers', () => {
    expect(readImageSize(pngHeader(30_000, 30_000))).toEqual({
      width: 30_000,
      height: 30_000,
    });
    expect(readImageSize(jpegHeader(640, 480))).toEqual({
      width: 640,
      height: 480,
    });
    expect(readImageSize(webpVp8x(20_000, 10))).toEqual({
      width: 20_000,
      height: 10,
    });
    expect(readImageSize(webpVp8(1000, 16_000))).toEqual({
      width: 1000,
      height: 16_000,
    });
    expect(readImageSize(webpVp8l(300, 200))).toEqual({
      width: 300,
      height: 200,
    });
  });

  it('counts a GIF frame that reaches past the screen size', () => {
    expect(readImageSize(gif([3, 2], [0, 0, 3, 2]))).toEqual({
      width: 3,
      height: 2,
    });
    expect(readImageSize(gif([1, 1], [100, 0, 60_000, 60_000]))).toEqual({
      width: 60_100,
      height: 60_000,
    });
  });

  it('reads nothing from SVG, AVIF, unknown or cut-off files', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="40000" height="40000"/>'
    );
    expect(readImageSize(svg)).toBeNull();
    expect(readImageSize(await encoded('avif'))).toBeNull();
    expect(readImageSize(Buffer.from('not an image at all'))).toBeNull();
    expect(readImageSize(pngHeader(10, 10).subarray(0, 20))).toBeNull();
    expect(readImageSize(jpegHeader(10, 10).subarray(0, 12))).toBeNull();
    expect(readImageSize(gif([3, 2], [0, 0, 3, 2]).subarray(0, 30))).toBeNull();
    expect(readImageSize(Buffer.alloc(0))).toBeNull();
  });
});

describe('fitsDecodeBudget', () => {
  it('allows up to about 40 megapixels', () => {
    expect(fitsDecodeBudget(pngHeader(8000, 5000))).toBe(true);
    expect(fitsDecodeBudget(pngHeader(8000, 5001))).toBe(false);
    expect(fitsDecodeBudget(pngHeader(30_000, 30_000))).toBe(false);
    expect(fitsDecodeBudget(webpVp8x(20_000, 20_000))).toBe(false);
    expect(fitsDecodeBudget(gif([1, 1], [0, 0, 60_000, 60_000]))).toBe(false);
  });

  it('refuses a very long side, and an empty one', () => {
    expect(fitsDecodeBudget(pngHeader(16_384, 100))).toBe(true);
    expect(fitsDecodeBudget(pngHeader(16_385, 100))).toBe(false);
    expect(fitsDecodeBudget(jpegHeader(640, 0))).toBe(false);
  });

  it('refuses what it cannot measure', async () => {
    expect(fitsDecodeBudget(Buffer.from('<svg/>'))).toBe(false);
    expect(fitsDecodeBudget(await encoded('avif'))).toBe(false);
  });
});
