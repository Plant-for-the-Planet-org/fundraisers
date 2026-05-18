export function pickByHash<T>(items: readonly T[], seed: string): T {
  // Empty seeds would all collapse to index 0; substitute a placeholder.
  const s = seed || 'unknown';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return items[Math.abs(h) % items.length]!;
}
