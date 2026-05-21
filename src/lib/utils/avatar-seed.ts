// Returns just the index — no component creation involved
export function getHashIndex(length: number, seed: string): number {
  const s = seed || 'unknown';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % length;
}
