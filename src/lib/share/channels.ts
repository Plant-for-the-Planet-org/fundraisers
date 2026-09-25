import type { ShareFormatId } from './formats';

export const SHARE_PLATFORMS = [
  'instagram',
  'whatsapp',
  'tiktok',
  'youtube',
  'linkedin',
  'facebook',
  'x',
  'other',
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
  },
  {
    id: 'linkedinWide',
    platform: 'linkedin',
    format: 'banner',
    kinds: ['image'],
    utm: social('linkedin'),
  },
  {
    id: 'facebookPost',
    platform: 'facebook',
    format: 'post',
    kinds: ['image', 'video'],
    utm: social('facebook'),
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
  },
  {
    id: 'xTallPost',
    platform: 'x',
    format: 'post',
    kinds: ['image'],
    utm: social('x'),
  },
  {
    id: 'email',
    platform: 'other',
    format: 'banner',
    kinds: ['image'],
    utm: { source: 'email', medium: 'email' },
  },
  {
    id: 'anyStory',
    platform: 'other',
    format: 'story',
    kinds: ['video', 'image'],
    utm: social('share'),
  },
  {
    id: 'anyPost',
    platform: 'other',
    format: 'post',
    kinds: ['image'],
    utm: social('share'),
  },
] as const satisfies readonly ShareChannel[];

export type ShareChannelId = (typeof SHARE_CHANNELS)[number]['id'];

export function channelsFor(platform: SharePlatformId): ShareChannel[] {
  return SHARE_CHANNELS.filter(channel => channel.platform === platform);
}

export function getChannel(id: ShareChannelId): ShareChannel {
  return SHARE_CHANNELS.find(channel => channel.id === id)!;
}
