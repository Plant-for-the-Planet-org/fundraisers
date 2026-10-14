import type { Fundraiser } from '@/lib/types/fundraiser';

import { hasFundraiserConcluded } from './fundraiser';

/** A story shorter than this reads as a placeholder rather than a reason to give. */
export const STORY_MIN_LENGTH = 200;

/** With a picture or video doing part of the telling, fewer words are enough. */
export const STORY_MIN_LENGTH_WITH_MEDIA = 100;

// The rich text editor stores media as <image-embed> and <video-embed> markers; <img> covers pasted or older content.
const MEDIA_TAG = /<(image-embed|video-embed|img)\b/i;

export type ChecklistItemId =
  | 'coverImage'
  | 'story'
  | 'goal'
  | 'published'
  | 'coHost'
  /** The first share: tell the people who know you. */
  | 'share'
  | 'firstDonation'
  /** Opens once a few people have given, and stays open until the fundraiser ends. */
  | 'keepSharing';

export interface ChecklistItem {
  id: ChecklistItemId;
  done: boolean;
  /** Shown, but not yet open: it unlocks later. */
  locked?: boolean;
}

/** How many donors unlock "Keep sharing". The same number lets a story name its donors. */
export const KEEP_SHARING_MIN_DONORS = 3;

export type ModuleId = 'leaderboard' | 'thankYouNote' | 'stage';

export interface ModuleState {
  id: ModuleId;
  enabled: boolean;
}

function plainTextLength(html: string | null): number {
  if (!html) return 0;
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

/** Enough words to say why it matters, or fewer words with a picture or video. */
function hasStory(description: string | null): boolean {
  const length = plainTextLength(description);
  if (length >= STORY_MIN_LENGTH) return true;
  return (
    length >= STORY_MIN_LENGTH_WITH_MEDIA &&
    !!description &&
    MEDIA_TAG.test(description)
  );
}

/**
 * The steps that most often decide whether a fundraiser gets going, in the order a host would do them.
 * `donorCount` is everyone who has given, or null while it is not known yet; "Keep sharing" stays locked until it reaches `KEEP_SHARING_MIN_DONORS`.
 */
export function getFundraiserChecklist(
  fundraiser: Fundraiser,
  donorCount: number | null = null
): ChecklistItem[] {
  const concluded = hasFundraiserConcluded(fundraiser);
  return [
    { id: 'coverImage', done: Boolean(fundraiser.image) },
    { id: 'story', done: hasStory(fundraiser.description) },
    { id: 'goal', done: fundraiser.goalAmount > 0 },
    { id: 'published', done: fundraiser.status !== 'draft' },
    {
      id: 'coHost',
      done:
        fundraiser.hosts.filter(host => host.status === 'active').length > 1,
    },
    // Nothing records that a host has shared, so a first gift is the proof that the link reached someone.
    { id: 'share', done: fundraiser.donationCount > 0 },
    { id: 'firstDonation', done: fundraiser.donationCount > 0 },
    // Sharing is never finished while people can still give, so once unlocked it stays open until the fundraiser ends, and always comes last.
    {
      id: 'keepSharing',
      done: concluded,
      locked: !concluded && (donorCount ?? 0) < KEEP_SHARING_MIN_DONORS,
    },
  ];
}

export function getFundraiserModuleStates(
  fundraiser: Fundraiser
): ModuleState[] {
  const modules = fundraiser.settings?.modules;
  return [
    { id: 'leaderboard', enabled: modules?.leaderboard?.enabled === true },
    {
      id: 'thankYouNote',
      enabled:
        modules?.thankYouNote?.enabled === true &&
        Boolean(modules.thankYouNote.message?.trim()),
    },
    { id: 'stage', enabled: modules?.stage?.enabled === true },
  ];
}
