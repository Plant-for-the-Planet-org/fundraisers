# Refactor Fundraiser Image UI (Base Component + CDN URL Resolution)

## Summary

Create a reusable `image-component-base` that encapsulates the shared cover-image container UI from `image-selector` and `fundraiser-view`, and ensure fundraiser images are resolved via the CDN URL logic (matching gofundnature’s `NEXT_PUBLIC_CDN_URL` pattern). Reuse the base in both places, keeping selector behaviors intact.

## Key Changes

- **Add `image-component-base` (fundraisers domain)**  
  Create `src/components/fundraisers/image-component-base.tsx` to render the shared image container UI:
  - Props for `imageUrl`, `alt`, `fallback`, `className`, optional `children` for overlays.
  - Default container styles match the existing `image-selector` box (rounded, h-80, bg, overflow).
  - Fallback supports `Target` icon or custom JSX (error/loading content).
- **Resolve fundraiser image URLs via CDN (legacy parity)**  
  Implement a helper (either in `lib/utils/images.ts` or within `fundraiser-view`) that:
  - Returns the original URL if it’s already absolute (`http/https`).
  - Otherwise uses `getImageUrl('fundraiser', 'large', filename)` to build via `NEXT_PUBLIC_CDN_URL`.
    This mirrors gofundnature’s pattern.
- **Use base component in two places**
  - `src/components/fundraisers/image-selector.tsx`: replace the container markup with `ImageComponentBase`, passing `imageUrl` and the current error/loading fallback JSX, plus the “change image” button as an overlay child.
  - `src/components/fundraisers/fundraiser-view.tsx`: replace the existing image block with `ImageComponentBase`, using the resolved CDN URL and the Target placeholder fallback.

## Test Plan

- Manual: `/fundraisers/create` image selector still shows loading/error states and overlays correctly.
- Manual: `/fundraisers/[slug]` renders cover image from CDN when `fundraiser.image` is a filename, and uses the placeholder when missing.

## Assumptions

- The cover image size for detail view should use `large` (closest parity with legacy usage in gofundnature).
- `image-component-base` will live in `components/fundraisers/` (domain-specific reuse).
- No additional doc update required unless you want this file listed under `docs/structure.md`.
