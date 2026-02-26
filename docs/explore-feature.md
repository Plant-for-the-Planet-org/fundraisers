# Explore Feature

**Status:** Complete (initial version)
**Last Updated:** February 26, 2026

---

## Overview

The Explore feature is the main discovery surface of the app. It allows users to browse featured fundraisers and navigate into cause-specific fundraiser lists.

**Routes:**

```
/explore                    ← Featured fundraisers tabbed list + category grid
/explore/[category]         ← Category-specific fundraiser tabbed list
```

---

## File Structure

```
src/
  app/
    (standard)/
      layout.tsx                        ← Shared layout (header + footer)
      explore/
        page.tsx                        ← Explore home page
        [category]/
          page.tsx                      ← Category page
          not-found.tsx                 ← 404 for unknown categories

  components/
    explore/
      page-header.tsx                   ← Explore page title/description
      featured-fundraisers.tsx          ← Featured fundraiser grid (client, sort tabs)
      featured-fundraisers-loader.tsx   ← Async data fetcher (server component)
      featured-fundraisers-skeleton.tsx ← Skeleton state
      fundraiser-card.tsx               ← Individual fundraiser card
      fundraiser-card-image.tsx         ← Optimized card image
      fundraiser-card-skeleton.tsx      ← Card skeleton state
      fundraiser-categories.tsx         ← Category card grid + skeleton
      fundraiser-cities.tsx             ← City filter (implemented; pending API type fix)
      location-category-map.tsx         ← Map of location → category
      category-page-header.tsx          ← Category page title + fundraiser count
      category-fundraisers.tsx          ← Category fundraiser list (client, sort tabs)
      category-page-loader.tsx          ← Async data fetcher + notFound guard
      category-page-skeleton.tsx        ← Skeleton for category page
      category-icon.tsx                 ← Icon per category

  lib/
    api/
      categories-service.ts             ← Fetches categories + fundraisers (with retry)
    types/
      category.ts                       ← Category interface
      fundraiser.ts                     ← Fundraiser interface (with nested types)
    utils/
      fundraiser.ts                     ← Fundraiser URL generation
      images.ts                         ← CDN image URL helpers
      currency.ts                       ← Currency formatting (25 currencies)
      formatting.ts                     ← Localized abbreviated counts
```

---

## Data Flow

### Explore home page (`/explore`)

```
ExplorePage (server)
  ├── FundraiserCategories (async server component)
  │     └── categoriesService.getCategoriesWithRetry('cause')
  │           → filters: category === 'cause' && metadata.featured === true
  │           → slices to max 8, maps displayCount
  │           → renders a grid of category link cards
  │
  ├── FeaturedFundraisersLoader (async server component)
  │     → fetches popular + gross in parallel (Promise.all)
  │     → both datasets passed as props to FeaturedFundraisers (client)
  │           → client switches between them via useState (no refetch, no URL change)
  │
  └── FundraiserCities (async server component)
        → categoriesService.getCategoriesWithRetry('cause')  ← TODO: change to 'location'
        → filters: metadata.featured === true, slices to max 8
        → renders a city grid with circular images and fundraiser counts
        → returns null if empty or on error (section is hidden)
```

### Category page (`/explore/[category]`)

```
ExploreCategoryPage (async server, reads params + searchParams)
  → validates sort param with isFundraiserSortOption(); defaults to 'popular'
  └── CategoryPageLoader (async server component)
        → categoriesService.getCategoryFundraisersWithRetry(slug, { sort_by })
        → on error: calls notFound() → Next.js 404
        ├── CategoryPageHeader (category name + fundraiser count)
        └── CategoryFundraisers (client component)
              → sort tabs update URL (?sort=) via router.push inside startTransition
              → useOptimistic reflects new sort immediately while navigation is pending
              → shows skeleton grid while isPending
```

Each async component is wrapped in a `Suspense` boundary by its `*-loader.tsx` or the page itself, showing a skeleton while data loads.

**API service** (`src/lib/api/categories-service.ts`):

- Singleton `CategoriesService` class, exported as `categoriesService`
- Two endpoints: `getCategories(type?)` and `getCategoryFundraisers(slug, options?)`
- `*WithRetry` variants: up to 3 attempts (maxRetries = 2) with exponential backoff (1s, 2s)
- `normalizeFundraiser` coerces the API's empty-array `workspace` field to `null` for type safety
- Valid sort options: `'popular' | 'recent' | 'gross'`; guarded by `isFundraiserSortOption()`

---

## Key Components

### `FundraiserCategories`

- Async server component; fetches `cause` categories with retry
- Filters to `metadata.featured === true`, caps at 8 categories
- Renders a responsive grid of clickable card links (`/explore/[slug]`)
- Each card shows a `CategoryIcon`, category name, and localized fundraiser count
- Exports `CategoriesSkeleton` (also async — needs translations) for the `Suspense` fallback

### `FeaturedFundraisers` / `FeaturedFundraisersLoader`

- `FeaturedFundraisersLoader` (async server): fetches `popular` and `gross` fundraisers in parallel; passes both to the client component
- `FeaturedFundraisers` (client): uses `useState` to toggle between the two pre-fetched lists — no network request on tab switch
- Sort options: **Popular** and **Top earners** (gross); capped at `limit={6}`

### `CategoryFundraisers`

- Client component; receives the server-fetched fundraiser list and the current sort as props
- Sort options: **Popular**, **Recent**, **Top earners** (gross)
- Sorting changes the URL (`?sort=<value>`) via `router.push` wrapped in `startTransition`, causing a server re-fetch with the new sort
- `useOptimistic` + `useTransition` make the active tab switch instantly while the navigation is in flight; a skeleton grid is shown during the transition

### `FundraiserCard`

Displays a single fundraiser:

- CDN-optimized thumbnail image (`fundraiser-card-image.tsx`)
- Title, amount raised (formatted currency), donation count (abbreviated + localized), host name(s)
- External link via `getFundraiserUrl()`

### `CategoryPageLoader`

- Fetches category + fundraisers from the API
- Calls Next.js `notFound()` on any error, so invalid or unknown slugs render the `not-found.tsx` page rather than an error screen

---

## Routing Notes

- `[category]` is a dynamic segment; valid slugs come from the API — unknown or failed slugs render `not-found.tsx` (via `notFound()` in `CategoryPageLoader`)
- The `(standard)` route group applies the shared header/footer layout without adding a URL segment
- Sort state on the category page lives in the URL (`?sort=`) so it is shareable and survives page refresh

---

## Future Work

- [ ] Update API call to fetch `fundraiser-cities` before release - pass `type=location` instead of `type=cause`
- [ ] Page metadata (`<title>`, `<meta description>`) for both `/explore` and `/explore/[category]`
- [ ] Location/city filter (`fundraiser-cities.tsx` is scaffolded)
- [ ] Pagination — not currently planned; can be revisited if list sizes become a concern
- [ ] Map view for geo-based browsing (`location-category-map.tsx` is scaffolded)
