# Image Selector Parity Plan for `fundraiser` Create Flow

## Summary

Implement full legacy-equivalent image selection for `/fundraisers/create` using `ImageSelector` as the entry component, with all non-component image logic in `src/lib`, and keep create-submit wiring out of scope for this slice.

Chosen decisions:

1. Scope: UI + Unsplash flow now (default image, upload, category browse, search, selection metadata), defer final submit pipeline.
2. State shape: Store selected image in RHF form context as one typed `image` object field.

## Implementation Blueprint

### 1. Dependencies and environment

1. Update [package.json](/Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/package.json) and [package-lock.json](/Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/package-lock.json) to add `unsplash-js`.
2. Use server env var `UNSPLASH_ACCESS_KEY` for the server proxy service.
3. Support optional `DISABLE_UNSPLASH_CACHE=true` to disable response caching (same behavior as legacy).

### 2. Add image domain types in `lib`

1. Create [image-selection.ts](/Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/src/lib/types/image-selection.ts).
2. Export `SelectedImageSource`, `ImageUploadStatus`, `UnsplashAttribution`, `SelectedImage`, `ImageUploadError`, `ImageValidationResult`, and `ImageCategory`.
3. Keep `SelectedImage` as the single contract shared by form context, selector component, overlay, and future submit logic.
4. Include `downloadLocation` in `SelectedImage` for future Unsplash compliance tracking.

### 3. Add image category constants in `lib`

1. Create [image-categories.ts](/Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/src/lib/constants/image-categories.ts).
2. Port legacy category ids and search queries, including seasonal visibility windows.
3. Export `getVisibleImageCategories(date?: Date)` and a static fallback list helper.
4. Keep labels out of constants; labels come from i18n keys by category id.

### 4. Add image utility helpers in `lib`

1. Create [image-selection.ts](/Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/src/lib/utils/image-selection.ts).
2. Implement helpers for:
3. `validateImageFile(file)` with allowed mime types + max size.
4. `createUploadedSelectedImage(file)` using `URL.createObjectURL`.
5. `createUnsplashSelectedImage(photo)` mapping API payload to `SelectedImage`.
6. `pickRandomPhoto(photos)` for default-image behavior.
7. `revokeSelectedImageObjectUrl(image)` to avoid object URL leaks on replacement/unmount.
8. Keep this file pure/non-UI and reusable.

### 5. Add Unsplash server service in `lib/api`

1. Create [unsplash-service.ts](/Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/src/lib/api/unsplash-service.ts).
2. Implement `UnsplashService` class with:
3. `searchPhotos(query, page, perPage)`.
4. `getCategoryImages(categoryId, count)`.
5. `trackDownload(downloadLocation)`.
6. `isAvailable()`.
7. Normalize SDK responses into project-owned response shapes before returning.
8. Add safe error class/messages for missing key, auth, rate limit, and generic failures.

### 6. Add Unsplash client wrapper in `lib/api`

1. Create [unsplash-client.ts](/Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/src/lib/api/unsplash-client.ts).
2. Implement client-side methods calling `/api/images/unsplash`:
3. `searchPhotos`.
4. `getCategoryImages`.
5. `trackDownload`.
6. Keep this as the only UI-facing API for image browsing.

### 7. Add secure API proxy route

1. Create [route.ts](/Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/src/app/api/images/unsplash/route.ts).
2. Implement `GET` actions:
3. `action=category` with `category`, `count`.
4. `action=search` with `query`, `page`, `count`.
5. Implement `POST` for `downloadLocation` tracking.
6. Enforce param bounds (max count/page), handle unavailable service, and return clear 4xx/5xx JSON errors.
7. Set cache headers (`max-age` + `s-maxage` + `stale-while-revalidate`) unless disabled by env.

### 8. Expand RHF form contract for image field

1. Update [fundraiser-form-schema.ts](/Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/src/components/fundraisers/fundraiser-form-schema.ts).
2. Extend `FundraiserFormValues` with `image: SelectedImage | null`.
3. Add schema validation for `image` shape (nullable, optional nested attribution metadata).
4. Set default value `image: null`.
5. Keep existing `title` validation behavior unchanged in this slice.

### 9. Implement selector UI entry component

1. Update [image-selector.tsx](/Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/src/components/fundraisers/image-selector.tsx) as a client component.
2. Use RHF context (`watch`, `setValue`) to read/write `image`.
3. On mount, if `image` is null, load default category images (`nature`) and set one random image.
4. Keep preview behavior parity:
5. Show preview image when selected/default loaded.
6. Show loading state while default image loads.
7. Show error + retry if default image fetch fails.
8. Keep floating “change image” button to open overlay.
9. Revoke object URLs when replacing/removing uploaded images.

### 10. Add overlay component for browsing/uploading

1. Create [image-selection-overlay.tsx](/Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/src/components/fundraisers/image-selection-overlay.tsx).
2. Implement parity behaviors:
3. Modal via `createPortal(document.body)` with spotlight card layout.
4. Escape-to-close and body scroll lock while open.
5. Drag/drop and click-to-upload area.
6. Category list using `getVisibleImageCategories`.
7. Debounced search (`300ms`) with empty-search fallback to selected category fetch.
8. Loading, error (retry), and empty states.
9. Grid of selectable images with hover attribution overlay.
10. On select/upload: return `SelectedImage`, close modal.
11. Keep styling close to legacy visual rhythm while fitting current `fundraiser` utility style.

### 11. Localize all user-facing strings

1. Update [fundraisers.json (en)](/Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/locales/en/fundraisers.json).
2. Update [fundraisers.json (de)](/Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/locales/de/fundraisers.json).
3. Add `Fundraisers.create.image.*` namespace for preview, overlay, upload prompts, states, actions, aria labels, and attribution text.
4. Add `Fundraisers.create.image.categories.<id>` keys for category labels.
5. Remove hardcoded strings from selector and overlay components.

### 12. Keep create page composition stable

1. Keep [page.tsx](</Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/src/app/(standard)/fundraisers/create/page.tsx>) structure unchanged.
2. Keep `ImageSelector` placement in sidebar unchanged.
3. No route architecture changes beyond adding API route handler.

### 13. Update docs for structure change

1. Update [structure.md](/Volumes/WDSN5000/Plant-for-the-Planet/f/fundraiser/docs/structure.md) to include:
2. `src/app/api/images/unsplash/route.ts`.
3. New `src/lib/api/unsplash-*` files.
4. New `src/lib/types/image-selection.ts`.
5. New `src/lib/constants/image-categories.ts`.
6. New `src/lib/utils/image-selection.ts`.
7. New `src/components/fundraisers/image-selection-overlay.tsx`.
8. No legacy docs updates.

## Public APIs / Interfaces / Types

1. New `SelectedImage` domain contract in `src/lib/types/image-selection.ts`.
2. New `FundraiserFormValues.image: SelectedImage | null`.
3. New internal API layer:
4. `unsplashService` (server).
5. `unsplashClient` (client).
6. New route contract: `GET /api/images/unsplash` (`search`/`category`) and `POST /api/images/unsplash` (download tracking).

## Test Cases and Scenarios

1. Initial create page load shows loading placeholder, then a default image appears.
2. If default fetch fails, selector shows error state and `Retry` works.
3. “Change image” opens overlay; Escape and close button dismiss correctly.
4. Category click loads that category’s images.
5. Search input debounces; empty search returns to category images.
6. Selecting an Unsplash image updates preview and closes overlay.
7. Upload via file picker updates preview and closes overlay.
8. Upload via drag/drop updates preview and closes overlay.
9. Invalid file type/oversize file shows validation error and does not change selection.
10. Category labels and UI strings render localized in both `en` and `de`.
11. `FundraiserFormValues.image` updates in RHF without runtime errors.
12. Object URL cleanup occurs when replacing uploaded images or unmounting.
13. Lint and type-check pass.

## Verification

1. Run `npm install` in `fundraiser`.
2. Run `npm run type-check` in `fundraiser`.
3. Run `npm run lint` in `fundraiser`.
4. Manual smoke test on `/fundraisers/create` for all scenarios above.
5. Confirm no file changes under `/Volumes/WDSN5000/Plant-for-the-Planet/f/gofundnature`.

## Assumptions and Defaults

1. This slice does not wire final create-submit payload/image processing yet.
2. Unsplash browsing and upload coexist in the same overlay (legacy parity).
3. Selected image is stored as a single RHF object (`image`) to support future submit integration.
4. API proxy route is introduced now for security and parity (no direct Unsplash calls from browser).
5. Image selection is optional at schema level but auto-populated by default load when available.
