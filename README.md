# Fundraisers

The Plant-for-the-Planet fundraisers frontend. Built with Next.js App Router and server components, it currently covers the Explore page (featured fundraisers + category pages), a dynamic theming system, and i18n support for English and German.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS v4 · next-intl · Zustand · Zod · Radix UI

---

## Getting Started

**Prerequisites:** Node.js 22 · npm (only — do not use yarn, pnpm, or bun to avoid conflicts)

```bash
git clone <repo-url>
cd fundraisers
npm ci
```

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Then start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the root redirects to `/explore`.

---

## Dependency Management

Always use `npm ci` to install dependencies unless you are deliberately adding or upgrading a package. `npm ci` installs exactly what is in `package-lock.json` and never modifies it.

| Situation              | Command                           |
| ---------------------- | --------------------------------- |
| Day-to-day development | `npm ci`                          |
| Adding a new package   | `npm install <package>`           |
| Upgrading a package    | `npm install <package>@<version>` |

When adding or upgrading a package, review the `package-lock.json` diff carefully before committing — it should only change in ways you expect.

---

## Available Scripts

**Develop**

| Script          | Description                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| `dev`           | Start the development server. Picks webpack or Turbopack by installed RAM — see [`scripts/dev.mjs`](scripts/dev.mjs) |
| `dev:webpack`   | Force webpack, ignoring the RAM heuristic                                                                            |
| `dev:turbopack` | Force Turbopack, ignoring the RAM heuristic                                                                          |
| `dev-https`     | Same as `dev`, over HTTPS with an experimental local certificate                                                     |
| `setup:env`     | Copy `.env.local` into a fresh git worktree                                                                          |

**Build**

| Script          | Description                                           |
| --------------- | ----------------------------------------------------- |
| `build`         | Production build. Runs `check:locales` first          |
| `start`         | Start the production server                           |
| `clean`         | Delete the `.next` build cache                        |
| `check:locales` | Check the translation files for missing or extra keys |

**Check**

| Script         | Description                                 |
| -------------- | ------------------------------------------- |
| `type-check`   | TypeScript type check (no emit)             |
| `lint`         | Run ESLint                                  |
| `lint:fix`     | Run ESLint and auto-fix                     |
| `format`       | Format all source files with Prettier       |
| `format:check` | Check formatting without writing            |
| `imports:sort` | Sort imports project-wide (or pass a path)  |
| `find-typos`   | Output unique unrecognised words via cspell |
| `test`         | Run the unit tests once (Vitest)            |
| `test:watch`   | Run the unit tests in watch mode            |

**Assets**

| Script            | Description                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `optimize:images` | Re-encode an image added under `public/` before committing it. Takes a file or folder: `npm run optimize:images -- public/theme-backgrounds/photo.jpg` |

---

## Code Style & Conventions

**Formatting** — Prettier is configured in `.prettierrc.json` and enforced as an ESLint rule. Run `npm run format` to fix the whole codebase, or configure your editor to format on save.

**Linting** — ESLint 9 flat config. Key rules:

- Clean up `console.log` before merging; `console.warn` and `console.error` are allowed
- Unused variables must be prefixed with `_` to suppress the warning

**Import order** — Imports are enforced in two groups: type imports first, then value imports, with CSS/side-effect imports last. Each group is separated by a blank line. Within each group, `next`/`next-intl` imports come first, followed by other external packages, then internal `@/` paths, then relative imports.

- `npm run imports:sort` — fix the whole project
- `npm run imports:sort src/some/file.ts` — fix a specific file or folder
- Saving a file in VSCode auto-fixes import order (requires the ESLint extension)

**Spell checking** — cspell is configured in `cspell.json`. Run `npm run find-typos` to surface unrecognized words. If a word is a false positive (technical term, proper noun, abbreviation), add it to the `words` array in `cspell.json`.

**TypeScript** — Strict mode is on. Avoid `any`; prefer `interface` for object shapes and `type` for unions and aliases.

**React components** — Default to Server Components. Only add `'use client'` when the component genuinely needs it (event handlers, React hooks, browser-only APIs).

**Naming** — `kebab-case` files, `PascalCase` components, `camelCase` functions, `SCREAMING_SNAKE_CASE` constants. Named exports only — no default exports. See [`docs/naming.md`](docs/naming.md) for the full reference including component naming anti-patterns, props interfaces, boolean prefixes, and import ordering.

**Images** — Use plain `<img>` elements. Do not use Next.js `<Image>` (`next/image`).

---

## Project Structure

Source code lives in `src/`: routes in `app/`, UI in `components/` (organized by feature), framework-agnostic logic in `lib/`, Zustand stores in `stores/`. Translation files live in `locales/` at the root.

See [`docs/structure.md`](docs/structure.md) for the full annotated directory tree and co-location conventions.

---

## Git Workflow

**Branch naming** — always lowercase to avoid file system issues across operating systems:

| Branch                        | Purpose                                         |
| ----------------------------- | ----------------------------------------------- |
| `main`                        | Production-ready code                           |
| `develop`                     | Development branch                              |
| `feature/<short-description>` | New features                                    |
| `fix/<short-description>`     | Bug fixes                                       |
| `hotfix/<short-description>`  | Urgent production fixes                         |
| `chore/<short-description>`   | Maintenance: deps, config, tooling, refactoring |
| `docs/<short-description>`    | Documentation-only changes                      |

**Before a PR is ready to merge (and preferably before asking for review), all three of these must pass:**

```bash
npm run type-check
npm run lint
npm run format:check
```

Run `npm run find-typos` to check for spelling issues — it outputs unrecognized words to `project-words.txt` for review. Fix typos and add legitimate new terms to `cspell.json` before merging.

Write commit messages following [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add donation form to fundraiser page
fix: correct currency formatting for JPY
docs: update naming conventions
style: reformat header component
refactor: extract currency utils into separate module
test: add unit tests for formatting utils
chore: bump next to 16.2.0
```

Keep commits small and focused. No PR should be merged with TypeScript errors, lint violations (e.g. unused variables, banned `console.log`), formatting diffs, or unresolved spell check warnings.

---

## Further Reading

| File                                                 | Contents                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`docs/naming.md`](docs/naming.md)                   | Full naming conventions with examples and anti-patterns                      |
| [`docs/structure.md`](docs/structure.md)             | Annotated directory tree and co-location conventions                         |
| [`docs/explore-feature.md`](docs/explore-feature.md) | Architecture of the Explore page — data flow, component breakdown, routing   |
| [`docs/theme-system.md`](docs/theme-system.md)       | Theme system design — predefined themes, route mapping, flash-free rendering |
| [`docs/project-setup.md`](docs/project-setup.md)     | Phase-by-phase record of how the project was set up                          |
