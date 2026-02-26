# Project Structure

> This is a living document. Update it when the directory structure or conventions change.

```
fundraisers/
├── src/
│   ├── app/                        # Next.js App Router routes
│   │   ├── layout.tsx              # Root layout — font loading, theme mode
│   │   ├── globals.css             # Global styles, Tailwind theme config (@theme)
│   │   ├── page.tsx                # Root — redirects to /explore
│   │   └── (standard)/            # Route group: shared header/footer layout
│   │       └── explore/
│   │           ├── page.tsx
│   │           └── [category]/
│   │               ├── page.tsx
│   │               └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                     # Reusable UI primitives (no business logic)
│   │   ├── theme/                  # Theme context provider
│   │   ├── header/                 # Header component and sub-components
│   │   ├── footer/                 # Footer component and sub-components
│   │   └── explore/                # Explore feature components
│   │
│   ├── lib/
│   │   ├── api/                    # API service classes
│   │   ├── constants/              # App-wide constants (validated with Zod)
│   │   ├── theme/                  # Theme types, registry, and utilities
│   │   ├── types/                  # Shared TypeScript interfaces
│   │   └── utils/                  # Pure utility functions
│   │
│   ├── stores/                     # Zustand state stores
│   ├── i18n/                       # next-intl routing and request config
│   └── proxy.ts                    # Sets x-pathname header for server components
│
├── locales/                        # Translation files
│   ├── en/common.json
│   └── de/common.json
│
├── docs/                           # Project documentation
├── public/                         # Static assets
└── [config files]                  # next.config.ts, tsconfig.json, eslint.config.mjs, etc.
```

## Key Conventions

**`src/app/`** — Routes only. Keep pages thin: they compose server components and pass data down. Business logic belongs in `lib/`, not in page files.

**`src/components/`** — Organised by feature. Each feature folder owns its components, skeletons, and loaders. The `ui/` subfolder is for generic, reusable primitives with no domain knowledge.

**`src/lib/`** — Framework-agnostic logic: API calls, data transforms, type definitions, utilities, and constants. Nothing in here should import from `components/` or `app/`.

**`src/stores/`** — Zustand stores for client-side state that needs to persist or be shared across the tree (e.g. locale).

**`locales/`** — Translation files at the root level, outside `src/`. Add new keys to both `en/common.json` and `de/common.json` together.

## Component Co-location

Group components that belong to a feature in one folder:

```
components/explore/
├── featured-fundraisers.tsx        # Client component (tabs/sorting)
├── featured-fundraisers-loader.tsx # Async server component (data fetching)
├── featured-fundraisers-skeleton.tsx
├── fundraiser-card.tsx
└── fundraiser-card-skeleton.tsx
```

Keep server components (data fetching, async) and client components (`'use client'`) in the same folder — the file name and directive make the distinction clear without needing a naming suffix.
