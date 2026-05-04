function parseUTCDate(timestamp: string | Date): Date {
  if (timestamp instanceof Date) return timestamp;
  // API returns ISO format without timezone — append Z to treat as UTC
  return timestamp.includes('Z') ||
    timestamp.includes('+') ||
    timestamp.includes('-', 19)
    ? new Date(timestamp)
    : new Date(timestamp + 'Z');
}

export function formatTimeAgo(timestamp: string | Date): string {
  const diffInSeconds = Math.floor(
    (Date.now() - parseUTCDate(timestamp).getTime()) / 1000
  );

  if (diffInSeconds < 60) return 'just now';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;

  return `${Math.floor(diffInMonths / 12)}y ago`;
}
