import type { SeasonId } from './render/seasons';

/** Who shares: a host, a donor right after giving, or anyone else from the fundraiser page. */
export type ShareSharer = 'host' | 'donor' | 'supporter';

/**
 * The key under `Share.captions` for a caption without a gift.
 * Only a donor who just gave says so. A host gets the season's caption, and any other visitor a plain ask, since they may not have given.
 */
export function captionKey({
  sharer,
  season,
  concluded,
}: {
  sharer: ShareSharer;
  season: SeasonId;
  concluded: boolean;
}): 'concluded' | SeasonId | Exclude<ShareSharer, 'host'> {
  if (concluded) return 'concluded';
  return sharer === 'host' ? season : sharer;
}
