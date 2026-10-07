import { describe, expect, it } from 'vitest';
import { crc32, createZipParts } from './zip';

describe('crc32', () => {
  it('matches the standard check value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
});

describe('createZipParts', () => {
  it('writes one stored entry per file, with a directory at the end', async () => {
    const files = [
      { name: 'story.png', data: new Uint8Array([1, 2, 3]) },
      { name: 'captions.txt', data: new TextEncoder().encode('Join me') },
    ];
    const blob = new Blob(createZipParts(files) as BlobPart[]);
    const zip = new Uint8Array(await blob.arrayBuffer());
    const view = new DataView(zip.buffer);

    expect(view.getUint32(0, true)).toBe(0x04034b50);
    const end = zip.length - 22;
    expect(view.getUint32(end, true)).toBe(0x06054b50);
    expect(view.getUint16(end + 10, true)).toBe(2);

    const centralStart = view.getUint32(end + 16, true);
    expect(view.getUint32(centralStart, true)).toBe(0x02014b50);
    expect(view.getUint32(centralStart + 16, true)).toBe(crc32(files[0].data));
  });
});
