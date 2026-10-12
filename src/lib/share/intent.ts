import type { ShareChannel } from './channels';

/**
 * The platform's own share page, for platforms that take a link from a computer.
 * None of them take a file: the card image comes from the link's preview, so only the link, and for X the text, travel.
 * Returns null where the web offers nothing (Instagram, TikTok, YouTube, a Story or a Status).
 */
export function shareIntentUrl(
  channel: ShareChannel,
  { link, text }: { link: string; text: string }
): string | null {
  const q = encodeURIComponent;
  switch (channel.platform) {
    case 'facebook':
      return channel.format === 'story'
        ? null
        : `https://www.facebook.com/sharer/sharer.php?u=${q(link)}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${q(link)}`;
    case 'x':
      return `https://twitter.com/intent/tweet?text=${q(text)}&url=${q(link)}`;
    case 'whatsapp':
      // A Status cannot be posted from the web. A message can, with its text and link.
      return channel.linkOnly
        ? `https://wa.me/?text=${q(`${text}\n${link}`)}`
        : null;
    default:
      return null;
  }
}
