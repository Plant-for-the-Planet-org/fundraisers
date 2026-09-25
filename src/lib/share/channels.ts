import type { ShareFormatId } from './formats';

// The generic share sheet comes first: it is the default and works with any app.
export const SHARE_PLATFORMS = [
  'other',
  'instagram',
  'whatsapp',
  'tiktok',
  'youtube',
  'linkedin',
  'facebook',
  'x',
] as const;

export type SharePlatformId = (typeof SHARE_PLATFORMS)[number];

export type ShareKind = 'video' | 'image';

/** One way to share on a platform: which file to make and how to tag the link. Labels and tips are translated by `id`. */
export interface ShareChannel {
  id: string;
  platform: SharePlatformId;
  format: ShareFormatId;
  /** The first kind is the default. */
  kinds: readonly ShareKind[];
  utm: { source: string; medium: string };
  /** A chat builds its own preview from the link, so only text is shared. */
  linkOnly?: boolean;
  /** The tip only says to put the link in the post text, which the copied caption already holds, so it shows only when the copy failed. */
  tipOnlyIfCopyFails?: boolean;
}

const social = (source: string) => ({ source, medium: 'social' });

export const SHARE_CHANNELS = [
  {
    id: 'instagramStory',
    platform: 'instagram',
    format: 'story',
    kinds: ['video', 'image'],
    utm: social('instagram'),
  },
  {
    id: 'instagramPost',
    platform: 'instagram',
    format: 'post',
    kinds: ['image', 'video'],
    utm: social('instagram'),
  },
  {
    id: 'whatsappStatus',
    platform: 'whatsapp',
    format: 'story',
    kinds: ['video', 'image'],
    utm: { source: 'whatsapp', medium: 'messaging' },
  },
  {
    id: 'whatsappMessage',
    platform: 'whatsapp',
    format: 'banner',
    kinds: ['image'],
    utm: { source: 'whatsapp', medium: 'messaging' },
    linkOnly: true,
  },
  {
    id: 'tiktokVideo',
    platform: 'tiktok',
    format: 'tiktok',
    kinds: ['video', 'image'],
    utm: social('tiktok'),
  },
  {
    id: 'youtubeShort',
    platform: 'youtube',
    format: 'shorts',
    kinds: ['video'],
    utm: social('youtube'),
  },
  {
    id: 'linkedinPost',
    platform: 'linkedin',
    format: 'post',
    kinds: ['image'],
    utm: social('linkedin'),
    tipOnlyIfCopyFails: true,
  },
  {
    id: 'linkedinWide',
    platform: 'linkedin',
    format: 'banner',
    kinds: ['image', 'video'],
    utm: social('linkedin'),
    tipOnlyIfCopyFails: true,
  },
  {
    id: 'facebookPost',
    platform: 'facebook',
    format: 'post',
    kinds: ['image', 'video'],
    utm: social('facebook'),
    tipOnlyIfCopyFails: true,
  },
  {
    id: 'facebookStory',
    platform: 'facebook',
    format: 'story',
    kinds: ['video', 'image'],
    utm: social('facebook'),
  },
  {
    id: 'xPost',
    platform: 'x',
    format: 'wide',
    kinds: ['image', 'video'],
    utm: social('x'),
    tipOnlyIfCopyFails: true,
  },
  {
    id: 'xTallPost',
    platform: 'x',
    format: 'post',
    kinds: ['image'],
    utm: social('x'),
    tipOnlyIfCopyFails: true,
  },
  {
    id: 'anyStory',
    platform: 'other',
    format: 'story',
    kinds: ['video', 'image'],
    utm: social('share_sheet'),
  },
  {
    id: 'anyPost',
    platform: 'other',
    format: 'post',
    kinds: ['image'],
    utm: social('share_sheet'),
    tipOnlyIfCopyFails: true,
  },
  {
    id: 'newsletter',
    platform: 'other',
    format: 'banner',
    kinds: ['image'],
    // The same tags as the link picker's Newsletter chip, so both land in one Insights row.
    utm: { source: 'newsletter', medium: 'email' },
  },
] as const satisfies readonly ShareChannel[];

export type ShareChannelId = (typeof SHARE_CHANNELS)[number]['id'];

export function channelsFor(platform: SharePlatformId): ShareChannel[] {
  return SHARE_CHANNELS.filter(channel => channel.platform === platform);
}

export function getChannel(id: ShareChannelId): ShareChannel {
  return SHARE_CHANNELS.find(channel => channel.id === id)!;
}
