import 'server-only';

// About 40 megapixels: bigger is not a photo worth decoding for a 2400px image.
const MAX_PIXELS = 40_000_000;
const MAX_SIDE = 16_384;

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

export interface ImageSize {
  width: number;
  height: number;
}

function pngSize(b: Buffer): ImageSize | null {
  if (b.length < 24 || !b.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  if (b.toString('latin1', 12, 16) !== 'IHDR') return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function jpegSize(b: Buffer): ImageSize | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 <= b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      i += 2;
      continue;
    }
    // End of image, or a scan before any frame header.
    if (marker === 0xd9 || marker === 0xda) return null;
    const length = b.readUInt16BE(i + 2);
    if (length < 2) return null;
    const isFrameHeader =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isFrameHeader)
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    i += 2 + length;
  }
  return null;
}

/** Skips a run of GIF sub-blocks, returning the offset after the terminator, or -1 when the file ends first. */
function skipGifSubBlocks(b: Buffer, start: number): number {
  let i = start;
  while (i < b.length) {
    const size = b[i];
    if (size === 0) return i + 1;
    i += 1 + size;
  }
  return -1;
}

// A frame may reach past the screen size in the header, and decoders may grow the canvas to fit it, so every frame counts.
function gifSize(b: Buffer): ImageSize | null {
  if (b.length < 13 || !/^GIF8[79]a$/.test(b.toString('latin1', 0, 6)))
    return null;
  let width = b.readUInt16LE(6);
  let height = b.readUInt16LE(8);
  const screenFlags = b[10];
  let i = 13 + (screenFlags & 0x80 ? 3 * 2 ** ((screenFlags & 7) + 1) : 0);
  while (i < b.length) {
    const block = b[i];
    if (block === 0x3b) return { width, height };
    if (block === 0x21) {
      i = skipGifSubBlocks(b, i + 2);
    } else if (block === 0x2c) {
      if (i + 10 > b.length) return null;
      width = Math.max(width, b.readUInt16LE(i + 1) + b.readUInt16LE(i + 5));
      height = Math.max(height, b.readUInt16LE(i + 3) + b.readUInt16LE(i + 7));
      const flags = b[i + 9];
      i += 10 + (flags & 0x80 ? 3 * 2 ** ((flags & 7) + 1) : 0);
      // The LZW code size byte, then the image data.
      i = skipGifSubBlocks(b, i + 1);
    } else {
      return null;
    }
    if (i < 0) return null;
  }
  return null;
}

function webpSize(b: Buffer): ImageSize | null {
  if (b.length < 30) return null;
  if (
    b.toString('latin1', 0, 4) !== 'RIFF' ||
    b.toString('latin1', 8, 12) !== 'WEBP'
  )
    return null;
  switch (b.toString('latin1', 12, 16)) {
    case 'VP8 ':
      if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
      return {
        width: b.readUInt16LE(26) & 0x3fff,
        height: b.readUInt16LE(28) & 0x3fff,
      };
    case 'VP8L': {
      if (b[20] !== 0x2f) return null;
      const bits = b.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
      };
    }
    case 'VP8X':
      return {
        width: b.readUIntLE(24, 3) + 1,
        height: b.readUIntLE(27, 3) + 1,
      };
    default:
      return null;
  }
}

/**
 * Width and height from a PNG, JPEG, GIF or WebP header, without decoding the image.
 * Null for any other format, SVG and AVIF included, and for a header it cannot read.
 */
export function readImageSize(bytes: Buffer): ImageSize | null {
  return pngSize(bytes) ?? jpegSize(bytes) ?? gifSize(bytes) ?? webpSize(bytes);
}

/**
 * Whether these bytes may be decoded on the server.
 * The decoder allocates the full size up front, so a file of a few bytes can claim gigabytes: check this before decoding anything from another server.
 */
export function fitsDecodeBudget(bytes: Buffer): boolean {
  const size = readImageSize(bytes);
  return (
    !!size &&
    size.width > 0 &&
    size.height > 0 &&
    size.width <= MAX_SIDE &&
    size.height <= MAX_SIDE &&
    size.width * size.height <= MAX_PIXELS
  );
}
