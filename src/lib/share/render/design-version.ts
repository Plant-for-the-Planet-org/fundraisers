/**
 * The link preview banner's design. Bump it whenever the banner would look different for the same fundraiser: layout, colours, fonts, or its wording in any locale.
 * It is part of every preview's URL (`shareImageVersion`), so a bump makes crawlers fetch the new look.
 * Each URL is cached as immutable. Without a bump, a fundraiser keeps its old preview until something on it changes, and an ended one keeps it for good.
 * `share-banner.test.ts` fails until it is bumped and `design-fingerprints.json` has its entry. It draws the sample banners listed there and prints every label in English and German. A drawing change that none of those samples reach, or a new locale, is not caught.
 */
export const SHARE_IMAGE_DESIGN_VERSION = 1;
