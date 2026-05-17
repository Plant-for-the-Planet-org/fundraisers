const FALLBACK_COLORS = [
  'bg-amber-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-lime-500',
  'bg-cyan-500',
  'bg-rose-500',
];

export function getAvatarColor(id: string): string {
  const hash = id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length] ?? 'bg-gray-500';
}
