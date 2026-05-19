# Modules

Modules are self-contained features that plug into the fundraiser. Each one owns its UI, hooks, settings, and module metadata in a single folder under `src/modules/`.

> **Working in `src/modules/*`?** Read this file first. Then read the module's own `README.md` for what it does and how it works.

---

## What is a module?

A pluggable feature attached to a fundraiser. Toggled per fundraiser via `FundraiserSettings.modules.<id>`. Examples: Stage Mode (a live event display), Leaderboard (donor list block), DonorScore (decorates the donation form), Contribution (donation amount options).

A module typically owns one or more of:
- A **route segment** (Stage Mode owns `/raise/[slug]/stage`).
- One or more **UI blocks** that render inside a host (Leaderboard renders inside `FundraiserView`).
- A **settings panel** rendered inside the fundraiser admin form.
- A **settings shape** that lives on the fundraiser record under `modules.<id>`.

---

## Folder layout

```
src/modules/<id>/
  components/        UI components (always present if the module has UI)
  hooks/             Module-specific React hooks (optional)
  server/            Server-only loaders, cache helpers (optional)
  constants.ts       Module-wide constants (limits, intervals, ...) (optional)
  settings.ts        TypeScript types for FundraiserSettings.modules.<id>
  module.ts          Module metadata: id, settingsKey, route segment, default settings
  index.ts           Public surface — what external code imports
  README.md          Required. What the module does, how it works.
```

**No file outside `src/modules/<id>/` may reach inside that folder.** External code imports from `@/modules/<id>` only (the barrel `index.ts`). This keeps modules swappable and prevents the host from coupling to internal layout.

---

## `module.ts`

The current minimal shape:

```ts
import type { <Id>ModuleSettings } from './settings';

export const <ID>_MODULE_ID = '<id>' as const;

export const <id>Module = {
  id: <ID>_MODULE_ID,
  settingsKey: '<id>',                  // path under FundraiserSettings.modules
  localeNamespace: '<id>',              // optional, matches /locales/<locale>/<id>.json
  route: { segment: '<segment>' },      // optional, if the module owns a route
} as const;

export const <id>DefaultSettings: <Id>ModuleSettings = { ... };
```

After writing `module.ts`, register the module in [`src/modules/index.ts`](./index.ts) by adding it to `registeredModules`. Core helpers (the i18n loader, future slot renderer) iterate this list.

A registry helper (`defineModule(...)`) will come after the second module migrates. Don't build it preemptively.

---

## Settings

- The module owns the type: `<Id>ModuleSettings` in `settings.ts`.
- Defaults live in `module.ts` as `<id>DefaultSettings`.
- The type is registered in [`src/modules/index.ts`](./index.ts) (the registry barrel) under the `FundraiserModules` interface. That is the single point where `src/lib/types/fundraiser.ts` learns about each module's shape — lib does not reach into individual module folders.
- `src/lib/types/fundraiser.ts` re-exports the type for backward compatibility, so existing call sites importing from `@/lib/types/fundraiser` keep working.

When a module migrates, add its slot to `FundraiserModules` in `src/modules/index.ts` and remove it from the inline `modules: { ... }` shape in `fundraiser.ts`.

---

## Persistence

Module settings live on the fundraiser record at `fundraiser.settings.modules.<id>`. The backend stores the full `settings` blob as JSON; modules don't have their own tables or endpoints today.

- **Writes** go through `PUT /fundraisers/{id}` via [`updateFundraiser()`](../lib/api/fundraiser-service.ts) — the client sends the entire `UpdateFundraiserRequest` payload, not a per-module patch. Changing one module's settings means sending the full settings object.
- **Validation**: backend validates the merged payload. Client-side zod schemas (when present) are submit-time guards, not the source of truth.
- **Visibility lag**: changes take effect on next fetch. Stage Mode's polling picks them up within 15s; the public fundraiser page on next page load.
- **Defaults**: when a fundraiser is created without a module entry, the slot is `undefined` and the module's `defaultSettings` should be used at render time. The backend does not seed defaults.
- **No module-owned state yet**: if a module ever needs to store data beyond its settings (e.g. user-generated content, separate records), it would need its own endpoints — not the case for any current module.

When designing a module's settings:
- Keep the shape flat where possible; deep nesting is expensive to migrate.
- Avoid storing computed values; store the inputs and recompute.
- Mark optional fields with `?` so old fundraisers without the field still parse.
- Don't store cross-module references (e.g. a Stage setting pointing at a Leaderboard setting). Settings are independent slots in the same JSON blob.

---

## Live data and polling

Modules can read live data, but the fetch pattern depends on the surface:

- **Live surfaces** (Stage Mode, real-time dashboards): a polling hook inside the module. Use a wall-clock bucket helper so all clients hit the backend at the same boundaries (better cache hits, predictable load). See Stage's [`stage-hash.ts`](./stage/stage-hash.ts) and [`useAlltimeStats`](./stage/hooks/use-alltime-stats.ts).
- **Read-once surfaces** (public fundraiser page, admin reads): a one-shot fetch via the service layer (`src/lib/api/...`). No bucket, no polling. The service exposes the same endpoint as the polling hook; the hook calls the service with a bucket cache-buster, the one-shot caller omits it.
- **SSR surfaces** (server components, initial page render): call the service from the server, pass data as props. No client hook involved.

Rule of thumb: a module's polling hook stays inside the module; the underlying fetch helper lives in the service layer (`src/lib/api/...`) so non-module consumers can reuse it.

---

## Routes

Next.js App Router is file-based. The registry can't generate routes dynamically. So:

- The route file lives at its natural place under `src/app/`.
- The page component lives **inside the module**, exported from `index.ts`.
- The route file is a thin shell that imports the module's page component.

```tsx
// src/app/(stage)/raise/[slug]/stage/page.tsx
import { StageView } from '@/modules/stage';
// ... boilerplate that fetches fundraiser, renders <StageView .../>
```

---

## Mounting inside a host (future: slots)

For modules that render as blocks inside another page (e.g. Leaderboard inside `FundraiserView`), the planned shape is named slots:

```ts
blocks: [{
  component: LeaderboardBlock,
  allowedSlots: ['fundraiser:main:top', 'fundraiser:sidebar:bottom'],
  defaultSlot: 'fundraiser:main:top',
  defaultOrder: 100,
}]
```

The host renders `<ModuleSlot name='fundraiser:main:top' ctx={{ fundraiser }} />` which queries the registry for enabled modules contributing to that slot, sorts by order, renders. Per-fundraiser layout (which slot, what order) lives in `FundraiserSettings.modules.<id>.layout` so the user can drag-and-drop.

This is **not built yet** — design only. Leaderboard's migration will trigger building it.

---

## Adding a new module

1. Pick an `id` (kebab-case, lowercase).
2. Create the folder structure above.
3. Write `settings.ts` first — what config does this module need?
4. Add the field to `FundraiserSettings.modules` in `src/lib/types/fundraiser.ts` (re-exporting the type from the module).
5. Build the UI in `components/`.
6. Wire `module.ts` and `index.ts`.
7. Write the `README.md`. Be specific about: what this module does, when it's enabled, what it reads, what it writes, what other modules it depends on (if any).

---

## Locales

Module string files live in `/locales/<locale>/<namespace>.json` — the same convention core uses. The module declares its `localeNamespace` in `module.ts`, and [`src/i18n/request.ts`](../i18n/request.ts) loads every registered module's namespace automatically. No manual edit to the i18n loader when adding a module.

**Self-contained pages with a different locale** (e.g. Stage Mode, which can render in a locale different from the app) keep their own `NextIntlClientProvider` and load only their namespace — see [Stage's route](../app/(stage)/raise/[slug]/stage/page.tsx). The central loader still ships the namespace for everywhere else.

Pattern:
1. Create `/locales/en/<id>.json` (and other locales).
2. Set `localeNamespace: '<id>'` in `module.ts`.
3. Make sure the module is in `registeredModules` in [`index.ts`](./index.ts).

No core code changes are needed.

---

## Conventions

- **Module README is required.** Future contributors and Claude rely on it to understand the module before touching it.
- **Cross-module dependencies** should go through shared `src/lib/*` or be elevated when a third module needs them. Don't import directly from another `@/modules/<other>`.
- **Host code imports modules through the barrel only.** Files under `src/lib/`, `src/components/`, or `src/app/` may import from `@/modules/<id>` (the `index.ts` barrel) or from `@/modules` (the registry barrel for cross-module type composition). They must NOT reach into private paths like `@/modules/<id>/components/...` or `@/modules/<id>/settings.ts`.
- **Module-internal infra stays inside the module** until two or more modules actually need it. Don't preemptively promote a module's helper to `src/lib/` just because the name sounds generic. Wait for the second real consumer.
- **Tests** go inside the module under `__tests__/` (when added).

---

## Migrated modules

| Module | Folder | Status |
|---|---|---|
| Stage Mode | `src/modules/stage/` | Migrated |
| Leaderboard | (not yet) | Lives under `src/components/fundraisers/leaderboard/` |
| Contribution | (not yet) | Lives under `src/components/donate/` and form fields |
| DonorScore | (not yet) | Setting-only |
| ProjectsSupported | (not yet) | Lives under `src/components/fundraisers/` |
| CustomFields | (not yet) | Form fields only |
