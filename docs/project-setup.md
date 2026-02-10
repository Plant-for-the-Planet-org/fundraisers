# Fundraisers Project Setup Plan

**Project Name:** Fundraisers  
**Framework:** Next.js 15+ with App Router  
**Project Path:** `/fundraisers`  
**Date Created:** February 10, 2026

---

## Project Overview

A SaaS web application for managing fundraisers with the following tech stack:

- **Framework:** Next.js 15+ (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** Auth0
- **Internationalization:** next-intl (multi-file approach)
- **Error Monitoring:** Sentry
- **Testing:** Vitest + React Testing Library + Playwright
- **Code Quality:** ESLint + Prettier

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

### 🔄 Phase 2: Git Repository Setup (COMPLETED)

- [x] Initialize git repository
- [x] Create initial commit
- [x] Connect to remote repository
- [x] Push to remote

### ⏳ Phase 3: Code Quality Tools

#### 3.1 Prettier Setup

- [x] Install Prettier and related packages
- [x] Create `.prettierrc.json`
- [x] Create `.prettierignore`
- [x] Update `.eslint.config.mjs`
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
- Update `.eslintrc.config.js`

---

### ⏳ Phase 4: Internationalization (i18n)

#### 4.1 next-intl Setup

- [ ] Install next-intl
- [ ] Create folder structure for locales
- [ ] Create translation files (en, es, fr)
- [ ] Create `src/i18n/request.ts`
- [ ] Update `next.config.js`
- [ ] Create `src/middleware.ts`
- [ ] Restructure app directory for `[locale]`
- [ ] Create locale layouts
- [ ] Test locale switching
- [ ] Commit changes

**Installation:**

```bash
npm install next-intl
```

**Folder Structure to Create:**

```
src/
  i18n/
    locales/
      en/
        common.json
        auth.json
        dashboard.json
      es/
        common.json
        auth.json
        dashboard.json
      fr/
        common.json
        auth.json
        dashboard.json
    request.ts
```

**App Structure Changes:**

```
src/app/
  [locale]/
    layout.tsx
    page.tsx
    dashboard/
      page.tsx
  layout.tsx (root layout)
```

---

### ⏳ Phase 5: Authentication

#### 5.1 Auth0 Setup

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

### ⏳ Phase 6: Error Monitoring

#### 6.1 Sentry Setup

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

### ⏳ Phase 7: Testing Infrastructure

#### 7.1 Unit & Integration Testing (Vitest)

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

#### 7.2 End-to-End Testing (Playwright)

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

### ⏳ Phase 8: API Client Setup

#### 8.1 Fetch Wrapper

- [ ] Create `src/lib/api.ts`
- [ ] Implement API client with error handling
- [ ] Create example usage documentation
- [ ] Write tests for API client
- [ ] Commit changes

**Files to Create:**

- `src/lib/api.ts`
- `src/lib/api.test.ts`

---

### ⏳ Phase 9: Component Library Foundation

#### 9.1 Base Components

- [ ] Create components folder structure
- [ ] Create Button component with tests
- [ ] Create Input component with tests
- [ ] Create Card component with tests
- [ ] Create Modal component with tests
- [ ] Commit changes

**Folder Structure:**

```
src/components/
  ui/
    Button/
      Button.tsx
      Button.test.tsx
    Input/
    Card/
    Modal/
```

---

### ⏳ Phase 10: Documentation

- [ ] Create `README.md` with project overview
- [ ] Document environment setup
- [ ] Document development workflow
- [ ] Document testing strategy
- [ ] Document deployment process
- [ ] Create `CONTRIBUTING.md`
- [ ] Commit changes

---

## Package.json Scripts (Final)

After all setups, your `package.json` should include:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css,md}\"",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "type-check": "tsc --noEmit"
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
- [Auth0 Docs](https://auth0.com/docs)
- [Sentry Docs](https://docs.sentry.io/)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)

### Community

- [Next.js GitHub](https://github.com/vercel/next.js)
- [Next.js Discord](https://discord.gg/nextjs)

---

## Notes

- This is a living document - update as the project evolves
- Mark items as complete with `[x]` as you finish them
- Add new phases or tasks as needed
- Keep track of any deviations from the plan
- Document any issues encountered and their solutions

---

**Last Updated:** February 10, 2026  
**Status:** Phase 1 Complete, Phase 2 In Progress
