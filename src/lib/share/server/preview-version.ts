import type { BgSettings } from '@/lib/theme/types';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';

import { createHash } from 'node:crypto';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { buildTheme } from '@/lib/theme/build-theme';
import {
  convertTotalRaisedToSingleCurrency,
  hasFundraiserConcluded,
} from '@/lib/utils/fundraiser';
import { displayUrl } from '../links';
import { SHARE_IMAGE_DESIGN_VERSION } from '../render/design-version';
import { getShareHostName, pickShareDonors, showsGoal } from '../share-data';

import 'server-only';

// Every background setting, so a new one cannot be left out: the type requires each key.
function backgroundFields(bg: BgSettings): Array<[string, unknown]> {
  const fields: { [K in keyof Required<BgSettings>]: unknown } = {
    gradient: bg.gradient,
    background_color: bg.background_color,
    custom_gradient: bg.custom_gradient && [
      bg.custom_gradient.angle,
      bg.custom_gradient.stops.map(stop => [stop.color, stop.position]),
    ],
    background_opacity: bg.background_opacity,
    decoration: bg.decoration,
    pattern_id: bg.pattern_id,
    image_url: bg.image_url,
    image_mode: bg.image_mode,
    logo_id: bg.logo_id,
    opacity: bg.opacity,
    animation: bg.animation,
    image_tint: bg.image_tint,
    image_color: bg.image_color,
    pattern_tint: bg.pattern_tint,
    pattern_color: bg.pattern_color,
  };
  return Object.entries(fields);
}

/**
 * A short hash of what the link preview banner draws, so the image URL changes only when the image would.
 * It hashes a fixed list of values, never the whole API object, so it is the same on every server, after restarts and releases.
 * `origin` is the share origin the image prints (`getShareOrigin`). The locale is not included: it has its own `l` parameter.
 * `leaderboard` is the one the image is drawn from (`loadShareLeaderboard`).
 */
export function shareImageVersion(
  fundraiser: Fundraiser,
  origin: string,
  leaderboard: LeaderboardApiResponse | null
): string {
  const theme = buildTheme(fundraiser.settings?.theme);
  const board = fundraiser.settings?.modules?.leaderboard;
  const donors = pickShareDonors(fundraiser, leaderboard);
  const fields: Array<[string, unknown]> = [
    ['design', SHARE_IMAGE_DESIGN_VERSION],
    ['title', fundraiser.title],
    ['host', getShareHostName(fundraiser)],
    ['photo', fundraiser.image],
    ['currency', fundraiser.currency],
    ['goal', showsGoal(fundraiser) ? fundraiser.goalAmount : null],
    // The converted total the image prints, so new exchange rates change the version too.
    [
      'raised',
      convertTotalRaisedToSingleCurrency(
        fundraiser.totalRaised,
        fundraiser.currency
      ),
    ],
    // The donor row as the image prints it, so a donor who renames, removes a photo or turns anonymous changes it too.
    [
      'donors',
      donors && [
        donors.names,
        donors.people.map(person => [person.seed, person.avatarFile]),
        donors.count,
      ],
    ],
    // Worked out, not read: an active fundraiser also ends when its end date passes. It is the only date the banner depends on, since the server always draws the plain style.
    ['concluded', hasFundraiserConcluded(fundraiser)],
    ['accent', getAccentColor(theme.accent)],
    ['mode', theme.mode],
    ['titleFont', theme.titleFont],
    ['bodyFont', theme.bodyFont],
    ['background', backgroundFields(theme.bg)],
    [
      'leaderboard',
      [
        Boolean(board?.enabled),
        Boolean(board?.show_recent_list),
        Boolean(board?.show_top_list),
        Boolean(board?.anonymize),
        // Grouping the top list per donor changes which names come first.
        Boolean(board?.aggregate_top_by_donor ?? true),
      ],
    ],
    ['url', displayUrl(origin, fundraiser.slug)],
  ];
  return createHash('sha256')
    .update(JSON.stringify(fields))
    .digest('hex')
    .slice(0, 12);
}
