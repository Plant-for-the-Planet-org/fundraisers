# Fundraisers Project Setup Plan

**Project Name:** Fundraisers  
**Framework:** Next.js 16 with App Router  
**Project Path:** `/fundraisers`  
**Date Created:** February 10, 2026

---

## Project Overview

A SaaS web application for managing fundraisers with the following tech stack:

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + clsx + tailwind-merge
- **Authentication:** Auth0 (planned)
- **Internationalization:** next-intl with cookie-based locale management (en, de)
- **State Management:** Zustand
- **Schema Validation:** Zod
- **UI Primitives:** Radix UI
- **Icons:** Lucide React
- **Error Monitoring:** Sentry (planned)
- **Testing:** Vitest + React Testing Library + Playwright (planned)
- **Code Quality:** ESLint (flat config) + Prettier + cspell

---

## Setup Progress

### ✅ Phase 1: Initial Project Setup (COMPLETED)

- [x] Created Next.js project with `create-next-app`
- [x] Selected TypeScript
- [x] Selected ESLint
- [x] Selected Tailwind CSS
- [x] Selected `src/` directory structure
- [x] Selected App Router
- [x] Turbopack enabled (default)
- [x] Import alias `@/*` configured

**Initial Configuration:**

```
Project: fundraisers
TypeScript: ✅
ESLint: ✅
Tailwind CSS: ✅
src/ directory: ✅
App Router: ✅
Turbopack: ✅ (default)
Import alias: @/* ✅
```

---

### ✅ Phase 2: Git Repository Setup (COMPLETED)

- [x] Initialize git repository
- [x] Create initial commit
- [x] Connect to remote repository
- [x] Push to remote

---

### ✅ Phase 3: Code Quality Tools (COMPLETED)

#### 3.1 Prettier Setup

- [x] Install Prettier and related packages
- [x] Create `.prettierrc.json`
- [x] Create `.prettierignore`
- [x] Update `eslint.config.mjs`
- [x] Add format scripts to `package.json`
- [x] Run initial format
- [x] Commit changes

**Installation:**

```bash
npm install -D prettier eslint-config-prettier eslint-plugin-prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

**Files to Create:**

- `.prettierrc.json`
- `.prettierignore`
- Update `eslint.config.mjs`

---

### ✅ Phase 4: Internationalization (i18n) (COMPLETED)

#### 4.1 Cookie-Based Locale Management with Zustand

- [x] Install next-intl and zustand
- [x] Create root-level `/locales` folder structure
- [x] Create translation files with nested namespaces (en, de)
- [x] Create `src/i18n/routing.ts` (locale configuration)
- [x] Create `src/i18n/request.ts` (reads locale from cookie)
- [x] Create `src/stores/localeStore.ts` (Zustand store)
- [x] Create `src/components/LocaleInitializer.tsx` (syncs server/client)
- [x] Update `src/components/footer/language-selector.tsx` (use Zustand)
- [x] Update `next.config.ts` with next-intl plugin
- [x] Flatten app directory (remove `[locale]` folder)
- [x] Update root layout with LocaleInitializer
- [x] Test locale switching and persistence
- [x] Commit changes

**Installation:**

```bash
npm install next-intl zustand
```

**Folder Structure Created:**

```
locales/                      ← Root level (for Lingohub)
  en/
    common.json
  de/
    common.json

src/
  app/
    layout.tsx                ← Root layout with LocaleInitializer
    page.tsx                  ← Home page
    (standard)/               ← Route group (optional)
      layout.tsx
      explore/
        page.tsx
  components/
    locale-initializer.tsx    ← Syncs server/client locale
    footer/
      language-selector.tsx   ← Language switcher (Zustand-based)
  i18n/
    routing.ts                ← Locale configuration
    request.ts                ← Reads locale from cookie
    types.ts                  ← TypeScript type augmentation for next-intl
  stores/
    localeStore.ts            ← Zustand store for locale state
```

**Usage in Components:**

**Server Components:**

```typescript
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('Common');
  return <h1>{t('greeting')}</h1>;
}
```

**Client Component:**

```typescript
'use client';

import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';

export function WelcomeMessage() {
  const locale = useLocale();
  const t = useTranslations('Common');

  return (
    <div>
      <p>{t('welcome')}</p>
      <p className="text-sm text-gray-500">
        Current language: {locale === 'en' ? 'English' : 'Deutsch'}
      </p>
    </div>
  );
}
```

**Note:** You only need `useLocaleStore` when you want to _change_ the locale (via `setLocale()`). For just _reading_ the current locale, use next-intl's `useLocale()` hook.

**Key Architectural Decisions:**

1. **Cookie + localStorage for Locale**
   - localStorage: Persists preference across sessions
   - Cookie: Allows server to read locale on initial render
   - No URL-based routing (`/en`, `/de` removed)
   - Clean URLs: `/explore` instead of `/en/explore`

2. **Zustand for State Management**
   - More performant than Context API (selective re-renders)
   - Built-in persistence middleware
   - Simpler API than Context
   - Easy to scale (can add more global state later)

3. **Proxy Instead of Middleware**
   - Locale handled entirely by cookie + localStorage
   - `src/proxy.ts` used (not `middleware.ts`) — sets `x-pathname` header for theme routing
   - No locale-based middleware needed

4. **Flat App Structure**
   - No `[locale]` folder in app directory
   - Pages at root level (e.g., `src/app/page.tsx`)
   - Route groups optional (e.g., `(standard)` for layout grouping)

5. **Locales at Root Level**
   - `/locales` not `/src/i18n/locales`
   - Better for Lingohub integration
   - Clear separation of content from code
   - Easier for non-developers to find and manage

6. **TypeScript Type Safety for Translations**
   - `src/i18n/types.ts` augments `next-intl`'s `AppConfig.Messages` with the actual message types
   - Provides autocomplete for translation keys in `useTranslations()` / `getTranslations()`
   - `createMessagesDeclaration` in `next.config.ts` generates `.d.json.ts` files at dev/build time for ICU message argument checking (e.g. missing `{ count }` in a plural message)
   - The list is built dynamically in `next.config.utils.ts` by reading `locales/en/` at startup — no static array to keep in sync when new locale files are added. `cookie.json` is excluded as it is not loaded via `request.ts`.
   - Generated `.d.json.ts` files are gitignored — run `next dev` once on a fresh clone to generate them
   - Trade-off: in namespaces with ICU placeholders (e.g. Fundraisers, Explore), invalid key errors show as `Expected 2-3 arguments, but got 1` rather than a "key not found" message — this is a TypeScript overload resolution limitation, not a bug. Namespaces with only plain strings (e.g. Common) are unaffected and give clear errors.

7. **Single Domain (Current Implementation)**
   - Currently: One domain with locale in cookie/localStorage
   - Future: Can add multiple domains with different defaults
   - Easy migration path when needed

**URL Structure:**

```
✅ http://localhost:3000/           (locale from cookie)
✅ http://localhost:3000/explore    (clean URLs, no locale prefix)
❌ http://localhost:3000/en         (not used)
❌ http://localhost:3000/de/explore (not used)
```

**Locale Persistence Flow:**

1. User visits site → Server reads `ui-locale` cookie → Loads messages
2. User clicks language → Updates localStorage + cookie → Reloads page
3. User returns → localStorage synced to cookie → Previous choice remembered

---

### ✅ Phase 5: Theme System (COMPLETED)

See [docs/theme-system.md](./theme-system.md) for full documentation.

- [x] Define theme types (accent colors, font stacks, animations) — `src/lib/theme/types.ts`
- [x] Create 15 predefined themes (spring, clean, dashboard, birthday, etc.) — `src/lib/theme/themes.ts`
- [x] Build route-to-theme mapping — `src/lib/theme/route-themes.ts`
- [x] Implement theme builder with validation — `src/lib/theme/build-theme.ts`
- [x] Create accent color utilities (CSS classes + hex values) — `src/lib/theme/accent-utils.ts`
- [x] Create font stack utilities — `src/lib/theme/font-utils.ts`
- [x] Create `ThemeProvider` client component — `src/components/theme/theme-provider.tsx`
- [x] Use `proxy.ts` to pass `x-pathname` header for server-side theme resolution

**Folder Structure:**

```
src/
  lib/
    theme/
      types.ts            ← Theme type definitions
      themes.ts           ← 15 predefined themes
      route-themes.ts     ← Route → theme mapping
      build-theme.ts      ← Theme builder + validation
      accent-utils.ts     ← Accent color CSS/hex helpers
      font-utils.ts       ← Font stack management
  components/
    theme/
      theme-provider.tsx  ← Client component, applies CSS vars
  proxy.ts                ← Sets x-pathname header on all routes
```

---

### ⏳ Phase 6: Core Library & Utilities (IN PROGRESS)

Only utilities needed so far have been created. This phase continues as the app grows.

- [x] Create shared utility functions — `src/lib/utils/`
  - `cn.ts` — clsx + tailwind-merge helper
  - `currency.ts` — 25-currency formatting + exchange rate conversion
  - `formatting.ts` — Localized abbreviated number counts
  - `fundraiser.ts` — Fundraiser URL generation
  - `images.ts` — CDN image URL generation
- [x] Define shared TypeScript types — `src/lib/types/`
  - `category.ts`, `fundraiser.ts`, `utility.ts`
- [x] Create app config with Zod validation — `src/lib/constants/app-config.ts`
- [x] Create API service layer — `src/lib/api/categories-service.ts`
- [ ] Create `src/lib/api.ts` fetch wrapper with shared error handling
- [ ] Write tests for utilities and API client

---

> **Features built:** The Explore feature (explore page, category pages, fundraiser cards) was implemented alongside Phase 6. See [docs/explore-feature.md](./explore-feature.md) for details.

---

### ⏳ Phase 7: Authentication

#### 7.1 Auth0 Setup

- [ ] Install Auth0 SDK
- [ ] Set up Auth0 application (in Auth0 dashboard)
- [ ] Create `.env.local` with Auth0 credentials
- [ ] Create `.env.example` template
- [ ] Create Auth0 API route
- [ ] Update root layout with UserProvider
- [ ] Update middleware for protected routes
- [ ] Create example profile component
- [ ] Test login/logout flow
- [ ] Commit changes

**Installation:**

```bash
npm install @auth0/nextjs-auth0
```

**Files to Create:**

- `.env.local` (not committed)
- `.env.example` (committed)
- `src/app/api/auth/[auth0]/route.ts`

**Environment Variables Needed:**

```env
AUTH0_SECRET=
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
```

---

### ⏳ Phase 8: Error Monitoring

#### 8.1 Sentry Setup

- [ ] Run Sentry wizard
- [ ] Configure Sentry organization and project
- [ ] Add Sentry DSN to `.env.local`
- [ ] Verify Sentry configuration files created
- [ ] Test error reporting
- [ ] Create error boundary component (optional)
- [ ] Commit changes

**Installation:**

```bash
npx @sentry/wizard@latest -i nextjs
```

**Files Created Automatically:**

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Updated `next.config.js`

**Environment Variables Needed:**

```env
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

---

### ⏳ Phase 9: Testing Infrastructure

#### 9.1 Unit & Integration Testing (Vitest)

- [ ] Install Vitest and testing libraries
- [ ] Create `vitest.config.ts`
- [ ] Create `vitest.setup.ts`
- [ ] Set up MSW for API mocking
- [ ] Create test folder structure
- [ ] Add test scripts to `package.json`
- [ ] Write example component test
- [ ] Run tests to verify setup
- [ ] Commit changes

**Installation:**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D msw@latest
```

**Folder Structure to Create:**

```
src/
  __tests__/
    api/
  components/
    Button/
      Button.tsx
      Button.test.tsx
  lib/
    utils/
      formatters.ts
      formatters.test.ts

tests/
  mocks/
    handlers.ts
    server.ts
```

**Files to Create:**

- `vitest.config.ts`
- `vitest.setup.ts`
- `tests/mocks/handlers.ts`
- `tests/mocks/server.ts`

#### 9.2 End-to-End Testing (Playwright)

- [ ] Install Playwright
- [ ] Run Playwright install for browsers
- [ ] Create `playwright.config.ts`
- [ ] Create e2e test folder structure
- [ ] Write example auth flow test
- [ ] Run e2e tests to verify setup
- [ ] Commit changes

**Installation:**

```bash
npm install -D @playwright/test
npx playwright install
```

**Folder Structure to Create:**

```
tests/
  e2e/
    auth.spec.ts
    dashboard.spec.ts
```

**Files to Create:**

- `playwright.config.ts`

---

### ⏳ Phase 10: API Client Setup

#### 10.1 Fetch Wrapper

> Note: `src/lib/api/categories-service.ts` was created as part of Phase 6 with retry logic. A shared base fetch wrapper is still needed.

- [ ] Create `src/lib/api.ts` shared fetch wrapper with error handling
- [ ] Refactor `categories-service.ts` to use the shared wrapper
- [ ] Create example usage documentation
- [ ] Write tests for API client
- [ ] Commit changes

**Files to Create:**

- `src/lib/api.ts`
- `src/lib/api.test.ts`

---

### ⏳ Phase 11: Component Library Foundation

#### 11.1 Base Components

> Note: Some UI primitives already exist in `src/components/ui/` — `skeleton.tsx`, `tabs.tsx`, `main-content.tsx`, `page-container.tsx`.

- [x] Create skeleton loading component
- [x] Create tabs component (Radix UI wrapper)
- [x] Create main-content and page-container layout components
- [ ] Create Button component with tests
- [ ] Create Input component with tests
- [ ] Create Card component with tests
- [ ] Create Modal component with tests
- [ ] Commit changes

**Folder Structure:**

```
src/components/
  ui/
    skeleton.tsx        ← ✅ exists
    tabs.tsx            ← ✅ exists
    main-content.tsx    ← ✅ exists
    page-container.tsx  ← ✅ exists
    button.tsx          ← planned
    input.tsx           ← planned
    card.tsx            ← planned
    modal.tsx           ← planned
```

---

### ⏳ Phase 12: Documentation

- [ ] Create `README.md` with project overview
- [ ] Document environment setup
- [ ] Document development workflow
- [ ] Document testing strategy
- [ ] Document deployment process
- [ ] Create `CONTRIBUTING.md`
- [ ] Commit changes

---

## Package.json Scripts

### Current Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "find-typos": "cspell --words-only --unique . | sort --ignore-case > project-words.txt"
  }
}
```

**Note:** Next.js 16 removed `next lint` command — use `eslint .` directly.

### Planned Scripts (after Phase 9)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## Environment Variables Checklist

### `.env.local` (Not committed - add to `.gitignore`)

```env
# Auth0
AUTH0_SECRET='generate-with: openssl rand -hex 32'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://YOUR_DOMAIN.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your-dsn-here
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token

# API (optional)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### `.env.example` (Committed - template for team)

```env
# Auth0
AUTH0_SECRET=
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Git Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Hotfix branches

### Commit Message Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

### Pre-commit Checklist

- [ ] Code formatted (`npm run format`)
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] Type checking passes (`npm run type-check`)

---

## Development Workflow

### Starting Development

```bash
npm run dev
# Visit http://localhost:3000
```

### Before Committing

```bash
npm run format
npm run lint
npm test
npm run type-check
git add .
git commit -m "feat: your message"
```

### Running All Checks

```bash
npm run format && npm run lint && npm test && npm run type-check
```

---

## Deployment Checklist

### Pre-deployment

- [ ] All tests passing
- [ ] Environment variables configured in hosting platform
- [ ] Build succeeds locally (`npm run build`)
- [ ] Performance audit completed
- [ ] Security audit completed
- [ ] Documentation updated

### Hosting Platforms (Choose One)

- Vercel (Recommended for Next.js)
- Netlify
- AWS Amplify
- Custom server

---

## Next Steps After Setup

1. **Database Integration**
   - Choose database (PostgreSQL, MongoDB, etc.)
   - Set up Prisma or another ORM
   - Create database schema
   - Set up migrations

2. **Additional Features**
   - Email service (SendGrid, Resend)
   - File storage (AWS S3, Cloudinary)
   - Payment processing (Stripe)
   - Analytics (PostHog, Mixpanel)

3. **Performance Optimization**
   - Image optimization
   - Code splitting
   - Caching strategy
   - CDN setup

4. **Security Hardening**
   - CSRF protection
   - Rate limiting
   - Input validation
   - Security headers

---

## Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [next-intl Docs](https://next-intl-docs.vercel.app/)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [Auth0 Docs](https://auth0.com/docs)
- [Sentry Docs](https://docs.sentry.io/)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)

### Community

- [Next.js GitHub](https://github.com/vercel/next.js)
- [Next.js Discord](https://discord.gg/nextjs)

---

## Future: Multiple Domains

When ready to scale, plan to add multiple domains with domain-specific defaults:

**Example Future Configuration:**

```typescript
// src/i18n/routing.ts
domains: [
  {
    domain: 'fundraisers.de',
    defaultLocale: 'de',
    locales: ['en', 'de'],
  },
  {
    domain: 'fundraisers.com',
    defaultLocale: 'en',
    locales: ['en', 'de'],
  },
];
```

**Migration Steps:**

- DNS setup for subdomains
- Update routing.ts with domains config
- Test with .localhost in development
- No changes needed to locale switching logic
- Add 301 redirects from old structure

---

## Notes

- This is a living document - update as the project evolves
- Mark items as complete with `[x]` as you finish them
- Add new phases or tasks as needed
- Keep track of any deviations from the plan
- Document any issues encountered and their solutions

---

**Last Updated:** February 26, 2026
**Status:** Phases 1–5 Complete, Phase 6 In Progress, Phases 7–12 Pending
