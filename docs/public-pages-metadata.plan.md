# Plan: Localized Public Page Metadata Parity

## Summary

Implement localized metadata for the three public routes in `fundraisers`, using `gofundnature` as the behavior reference while keeping the change tightly scoped to page metadata and required translation keys.

Files in scope:

- `fundraisers/src/app/(standard)/explore/page.tsx`
- `fundraisers/src/app/(standard)/explore/[category]/page.tsx`
- `fundraisers/src/app/(fundraiser)/fundraisers/[slug]/page.tsx`
- `fundraisers/locales/en/explore.json`
- `fundraisers/locales/de/explore.json`
- `fundraisers/locales/en/fundraisers.json`
- `fundraisers/locales/de/fundraisers.json`

## Implementation Changes

- Add route metadata for `/explore` and source its strings from the existing `next-intl` messages instead of hardcoding:
  - use the localized equivalents of `Explore.title` and `Explore.description`
  - include matching `openGraph` and `twitter` metadata in the active locale
  - keep page rendering unchanged

- Add localized `generateMetadata` to `/explore/[category]`:
  - use `next-intl/server` in metadata generation so the title/description are locale-aware
  - derive a human-readable category name from the slug without adding a new API dependency
  - add new translation keys for the category metadata pattern in both English and German
  - generate localized:
    - title pattern: `"{categoryName} Fundraisers"` / German equivalent
    - description pattern matching the reference intent in both locales
  - include matching localized `openGraph` and `twitter` metadata
  - keep the category page loader/render path unchanged

- Update `/fundraisers/[slug]` metadata to follow the reference behavior and preserve locale support where it exists:
  - continue fetching the fundraiser with `getCachedFundraiser(slug, locale)`
  - for public fundraisers (`visibility === "public"`):
    - keep title from the fundraiser response
    - keep description from the fundraiser response when present
    - add `openGraph` title/description/type/image
    - add `twitter` card/title/description/image
  - for non-public fundraisers (`visibility !== "public"`):
    - return only the fundraiser title
    - add `robots: "noindex, nofollow"`
    - omit description, Open Graph, and Twitter metadata
  - keep page rendering, auth retry, payment loading, and layout behavior unchanged
  - localize only any fallback metadata strings that remain necessary in this route

## Public APIs / Types

- No API contract changes
- No type changes
- No route changes
- No root layout metadata changes
- No canonical/base-URL convention introduced in this pass
- Translation additions only:
  - new localized metadata keys required for category-page metadata
  - localized fallback metadata strings only if the fundraiser route still needs them

## Test Plan

- Run `npm run type-check`
- Verify `/explore` metadata resolves from English and German messages
- Verify `/explore/[category]` metadata is localized in both languages and humanizes the slug correctly
- Verify a public fundraiser returns title/description/image-based metadata without changing page behavior
- Verify a non-public fundraiser returns only title plus `noindex, nofollow`
- Verify no unrelated translation keys or route behavior are changed

## Assumptions

- The app’s existing locale mechanism (`next-intl` with `en`/`de` and cookie-based locale selection) is the intended source for public-page metadata localization
- Your “visibility false” rule maps to the fundraiser API’s non-public state in `fundraisers`, currently `visibility !== "public"`
- To keep the feature narrow, this pass does not add canonical URLs, `metadataBase`, new env vars, or broader SEO conventions
- Fundraiser titles/descriptions from the API remain content-driven and are not translated by the app; only static metadata phrases and fallbacks are localized
