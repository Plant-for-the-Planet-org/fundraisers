# Bundle Feature Implementation Plan

## Context

Introduce a "Bundle" UX in the fundraiser create / edit / public-view flows. Bundles are curated, named groups of project IDs (e.g. _Underdog Bundle_, _Undo Your Amazon Order_) organised under emotional tabs (_Staff Picks_, _Wonder_, _Rage_, _Love_). A fifth tab — **Custom** — lets users hand-pick projects.

The feature **fully replaces** the current `<ProjectSelection />` slot in [fundraiser-form-body.tsx:66](src/components/fundraisers/fundraiser-form-body.tsx#L66). The existing [project-selection.tsx](src/components/fundraisers/project-selection.tsx) and [project-selection-overlay.tsx](src/components/fundraisers/project-selection-overlay.tsx) are not reused inside the form (kept temporarily as dead code; deletion in a follow-up step once parity is verified).

The API layer is **unchanged**: bundle identity is not persisted. Selecting a bundle simply writes its 5 project IDs to `projectAllocations` (with the support project floored at 25% per the legacy rule — see Decision #10). On edit, the originally-selected bundle (if any) is reverse-detected by exact project-ID set match.

## Implementation Status

| Step | Status | Notes |
|---|---|---|
| 1 — Bundle config + types | ✅ Shipped | |
| 2 — Bundle helpers | ✅ Shipped | `getEqualSplit` was inlined into `bundleToAllocations` and removed; `getDisplayableUnitCost` added for the per-row unit-cost metric |
| 3 — Form schema + provider wiring | ✅ Shipped (simpler than spec) | No ephemeral form fields. Active tab is component-local `useState`; selected bundle is derived on each render via `detectBundleFromAllocations`. `buildDefaultCreateValues` left as-is — its existing `getDefaultCauseId(defaultCountry)` happens to return the same support-project ID for DE |
| 4 — `BundleTabs` shell | ✅ Shipped (create-mode only) | Edit-mode form keeps `<ProjectSelection />` until Custom lands. Tabs are a custom segmented-pill control (matches `FundraiserStatusFilter`), not the shadcn `Tabs` primitive |
| 4a — Country gating | ⚠️ Partial | Tab visibility flips correctly between DE/ROW (all tabs) and ES/CH (custom-only placeholder). Cross-country allocation reconciliation is deferred — switching DE → ES leaves the now-orphaned bundle allocations on the form until the user touches Custom |
| 5 — Bundle preview modal | ✅ Shipped | UX iterated past spec; see step body for the shipped behaviour |
| 5a — `projectsService.getProjectById` | 🟡 Deferred | Not needed in practice. Synthetic fallback in `useBundleProjects` covers the support-project miss using `DEFAULT_NON_EARMARKED_CAUSE_FALLBACK` |
| 6 — Custom tab panel | 🟡 Placeholder only | Real implementation pending; UX shared by user but not wired up |
| 7 — Public view | ⏸ Pending | |
| 8 — Cleanup | ⏸ Pending | Blocked on Step 6 |

## Open Decisions Captured (defaults assumed unless overridden)

| # | Decision | Default taken |
|---|----------|---------------|
| 1 | Bundle identity persistence | Not stored on API; reverse-detected on edit by ID-set match |
| 2 | Manual edit to bundle's project list | Falls back to `Custom` tab on next edit |
| 3 | Support project handling | **Workspace-level** default project (not embedded in bundle config). Stored in a separate `supportProjects` map keyed by workspace. Component prepends it to bundle projects at render/allocation time and preselects it in Custom |
| 4 | Project metadata source | `/countryProjects/<country>?locale=<l>` once on mount, plus per-ID fallback fetch for bundle / support projects missing from the list |
| 5 | Tab → bundle mapping | Driven by `tabs[].bundleSlugs` in config; `bundles[].tab` is informational only |
| 6 | Public-view bundle tag | When a bundle has multiple tabs, prefer the first non-`staff-picks` tab |
| 7 | Bundle labels / taglines | Raw strings from config for now; i18n added in a follow-up once translations land |
| 8 | Old `project-selection*.tsx` files | Kept as dead code until Step 8, then removed |
| 9 | Country-based gating | Bundle tabs (Staff Picks / Wonder / Rage / Love) only shown when the form's country resolves to the config's `meta.workspace` (currently `DE`). For other supported countries (ES, CH) only the **Custom** tab is shown. "Rest of the World" maps to the default workspace (`DE`) and gets all tabs |
| 10 | Allocation split | **25% floor preserved on the support project** — same rule as the legacy `calculateProjectAllocations` (`MIN_DEFAULT_CAUSE_PERCENT`). For a 5-project bundle (1 support + 4 curated): support 28%, others 18% each (vs. a flat 20% × 5 if we'd dropped the floor). Earlier iterations of this doc proposed dropping the rule; we kept it for parity with the existing project-selection behaviour |

## What Already Exists

- `Fundraiser.projectAllocations: ProjectAllocation[]` ([fundraiser.ts:137](src/lib/types/fundraiser.ts#L137)) — server source of truth, unchanged
- `CreateFundraiserRequest.projectAllocations` / `UpdateFundraiserRequest.projectAllocations` ([fundraiser.ts:151](src/lib/types/fundraiser.ts#L151), [fundraiser.ts:175](src/lib/types/fundraiser.ts#L175)) — unchanged
- `projectsService.getCauseSelectableProjects(country, locale)` ([projects-service.ts:111](src/lib/api/projects-service.ts#L111)) — reused for both Custom search list and bundle metadata resolution
- `ProjectsSupportedDisplay` ([projects-supported-display.tsx](src/components/fundraisers/projects-supported-display.tsx)) — public-view component, extended in Step 7
- next-intl set up ([locales/en/fundraisers.json](locales/en/fundraisers.json), [locales/de/fundraisers.json](locales/de/fundraisers.json))

## What Must Be Built

- Static typed bundle config module
- Pure helpers: bundle lookup, ID-set match against `projectAllocations`
- New `BundleTabs` component (replaces `<ProjectSelection />` slot)
- Per-tab panels: 4 bundle tabs + 1 Custom tab
- Bundle preview modal ("Use this bundle")
- Public-view bundle header
- i18n keys (en + de) for all user-facing strings, including `aria-label` / `title` / `alt` / `placeholder`

---

## Steps

### Step 1 — Bundle config + types

**What:**

Add the static config as a typed TS module so it is tree-shakeable and validated at build time. Fix the missing trailing commas in the user-supplied JSON when porting it.

The supplied config has a `meta.workspace` field (`"DE"`) that drives country gating (see Step 4a). The 4 curated project IDs per bundle are stored in `bundle.projects`. The **support project** is *not* embedded in each bundle — it lives in a sibling `supportProjects` map (see Decision #3 in the table above).

Define types:

- `BundleSlug` — string union of all 10 slugs in the config
- `BundleTabId` — `'staff-picks' | 'wonder' | 'rage' | 'love' | 'custom'`
- `BundleWorkspace` — `'DE'` (extend as more workspaces come online)
- `Bundle` — `{ slug: BundleSlug; label: string; tabs: BundleTabId[]; tagline: string; projectIds: string[] }` (4 curated IDs; support ID is *not* in this list)
- `BundleTab` — `{ id: BundleTabId; label: string; description: string; bundleSlugs: BundleSlug[] }`
- `BundleConfig` — `{ meta: { version, workspace, defaultTab, tagline, subline }; tabs: BundleTab[]; bundles: Bundle[]; supportProjects: Record<BundleWorkspace, string> }`

**Files:**

- `src/lib/types/bundle.ts` — new
- `src/lib/constants/bundle-config.ts` — new (the typed config object). Normalise `bundles[].tab` into `bundles[].tabs: BundleTabId[]` (always array). Add `supportProjects: { DE: 'proj_bFH0BU0Qw02RuetpQlLOMVYX' }`.
- `src/lib/constants/bundle-country-mapping.ts` — new. Maps a fundraiser country code to a `BundleWorkspace | null`. `DE → 'DE'`, "Rest of the World" sentinel (the form's default-country flow) → `'DE'`, `ES → null`, `CH → null`. `null` means "Custom-only mode".

**Visual test:** None (no UI yet). `tsc --noEmit` passes.

---

### Step 2 — Bundle helpers (pure, unit-testable)

**What:**

Create pure helpers used by both the form and the public view:

- `getBundleBySlug(slug): Bundle | undefined`
- `getBundlesForTab(tabId): Bundle[]` — uses `tabs[].bundleSlugs` ordering
- `getSupportProjectId(workspace: BundleWorkspace): string` — reads from `supportProjects` map
- `getWorkspaceForCountry(country: string | undefined): BundleWorkspace | null` — wraps `bundle-country-mapping.ts`. Returns `null` when only Custom should be exposed
- `getBundleProjectIds(bundle: Bundle, workspace: BundleWorkspace): string[]` — returns `[supportId, ...bundle.projectIds]` (length 5). Single place that combines the two sources
- `detectBundleFromAllocations(allocations: { project_id: string }[], workspace: BundleWorkspace): Bundle | undefined` — exact set match against `getBundleProjectIds(bundle, workspace)` (same size, same IDs, order-independent)
- `bundleToAllocations(bundle, workspace): Array<{ project_id; percentage }>` — applies the legacy 25% floor on the support project (see Decision #10). For 5-project bundles → `[28, 18, 18, 18, 18]`. The arithmetic is inlined; an earlier draft of this step pointed at a separate `getEqualSplit` helper which was removed during implementation since it had no other callers
- `getDisplayTabForBundle(bundle): BundleTabId` — picks the first non-`staff-picks` tab; falls back to `staff-picks` if it is the only one
- `getDisplayableUnitCost(unitCost, unitType): { value, unitType } | null` — gates the per-row "~8 €/tree" / "~12 €/m²" metric in the modal. Returns `null` for `currency`-typed projects or missing data so the caller hides the line

**Files:**

- `src/lib/utils/bundle.ts` — new
- `src/lib/utils/__tests__/bundle.test.ts` — new (unit tests for each helper, especially `detectBundleFromAllocations` order-independence, support-project inclusion, and `getEqualSplit` rounding)

**Visual test:** None. Run unit tests.

---

### Step 3 — Form schema + provider wiring (shipped: no schema changes)

**What we shipped:**

The Zod schema is **unchanged**. `projectAllocations` is still the only persisted field, and there are no ephemeral form additions. UX state lives outside the form:

- **Active tab** — component-local `useState<BundleTabId>` inside `BundleTabs`. Defaults to `selectedBundle?.tabs[0] ?? BUNDLE_CONFIG.meta.defaultTab` so an existing bundle is shown on its tab when the form mounts.
- **Selected bundle** — derived per render via `detectBundleFromAllocations(allocations, workspace)`. No state to keep in sync, no stripping before submit.

`buildDefaultCreateValues` is **also unchanged**. It still calls `getDefaultCauseId(defaultCountry)` which returns the same DE support-project ID (`proj_bFH...`) at 100% — so a fresh DE/ROW form already starts in the right state. No bundle is selected on first mount; the user picks one (or stays in Custom).

`fundraiserToFormValues` is **unchanged**. Edit-mode bundle detection is not needed because the edit form doesn't use `<BundleTabs />` yet (see Step 4) — it still renders `<ProjectSelection />`.

**Why simpler than spec:** the original spec proposed `selectedBundleSlug` + `activeBundleTab` form fields with strip-before-send plumbing. Deriving the selection on every render eliminated that whole layer and removed any drift risk between form state and UI state. The active-tab `useState` is acceptable: tabs reset on form remount, but that's not a real UX concern for a single-page form.

**Files actually touched:** none in this step.

**Visual test:** load `/fundraisers/create` → form mounts with `projectAllocations: [{ supportId, 100 }]` and Staff Picks tab open. Pick a bundle → `projectAllocations` becomes the 5-row split (Decision #10) and the bundle's card shows the selected check.

---

### Step 4 — `BundleTabs` shell + tab navigation (shipped)

**What we shipped:**

Created `src/components/fundraisers/bundle-selection/` with:

- `bundle-tabs.tsx` — top-level container. Reads `country` and `projectAllocations` via `useWatch`, resolves workspace via `getWorkspaceForCountry`, computes `selectedBundle` via `detectBundleFromAllocations`. Renders all 5 tab triggers + the matching panel when a workspace exists; renders the Custom-only placeholder when the country has no workspace (ES, CH).
- `bundle-tab-panel.tsx` — bundle list view (used for the 4 bundle tabs). Renders cards via `getBundlesForTab(tabId)`. Each card opens the preview modal.
- `bundle-card.tsx` — single bundle tile with icon, label, tagline, the 5 project image thumbnails (real images via shared `useBundleProjects`, gradient placeholder fallback), project count, and a "See inside" link.
- `use-bundle-projects.ts` — shared hook **lifted from the modal up to `BundleTabs`** so cards and modal use the same fetched project data (single fetch per workspace; service-level cache).
- `index.ts` — barrel export.

**Departures from spec:**

- **Tabs are a custom segmented-pill control**, not the shadcn `Tabs` primitive. Matches the dashboard's `FundraiserStatusFilter` pattern: rounded muted container, white active pill with shadow, `flex-1` per tab so they share the container width equally, segmented-control look. Mobile gets `overflow-x-auto` plus `pr-3` so the right tab doesn't clip while scrolling.
- **No `subline` rendering.** The spec described showing the meta `subline` per tab; the shipped UI just renders the tab description (italic muted text) above the card grid.
- **Swap is create-mode only.** [`fundraiser-form-body.tsx:67-71`](src/components/fundraisers/fundraiser-form-body.tsx#L67-L71) renders `<BundleTabs />` only when `mode === 'create'`. Edit mode keeps `<ProjectSelection />` until Custom ships and we can verify parity with existing fundraisers.
- **`useBundleProjects` lifted to `BundleTabs`** rather than created per-modal-instance, so the bundle cards can render real project thumbnails (was a follow-up fix once thumbnails were noticed to be placeholders).

**Step 4a — Country gating behaviour (partial):**

What works:
- DE / ROW → workspace `DE` → all 5 tabs render with the bundle card grid.
- ES / CH → workspace `null` → tab strip is hidden entirely, body shows the Custom placeholder ("Coming soon").

What's deferred:
- **Cross-country allocation reconciliation** is not implemented. Switching from DE → ES with a bundle selected leaves the now-orphaned bundle allocations on the form. The user has to re-pick allocations once Custom ships. Acceptable today since ES/CH only show the placeholder anyway, but worth fixing as part of Step 6.

**Files:**

- `src/components/fundraisers/bundle-selection/{bundle-tabs,bundle-tab-panel,bundle-card,use-bundle-projects,index}.{ts,tsx}` — new
- `src/components/fundraisers/fundraiser-form-body.tsx` — `mode === 'create'` branch
- `locales/{en,de}/fundraisers.json` — `Fundraisers.form.bundleSelection.tabs.*` plus `card.{seeInside,projectCount}` and `aria.{openBundle,selectedBundle}`

**Visual test:** DE / ROW → 5 tabs render with cards; ES / CH → only Custom placeholder is shown; switching country between DE and ES flips visibility correctly (allocations stay as-is — see "deferred" above).

---

### Step 5 — Bundle preview modal + "Use this bundle" (shipped)

**What we shipped:**

- `bundle-preview-modal.tsx` — opened by clicking a bundle card. Header shows the package icon, bundle label, the orange contextual tag (`STAFF PICKS` / `WONDER` / `RAGE` / `LOVE`), tagline in quoted italics, and an X close button. Body lists the 5 projects (support + 4 curated, resolved via `getBundleProjectIds(bundle, workspace)`).
- **Each row** shows: project image, name (line-clamp-2 on mobile, truncate on desktop), country (full localized name via `Intl.DisplayNames`), and the unit-cost metric. Non-support rows have a right-aligned "Learn More" link (orange-700 / dark:orange-300, no arrow) that opens the platform project page in a new tab. The support project (workspace default) renders **without** the Learn More link — the row is non-interactive to prevent navigation away from the workspace's own default cause.
- **Footer** has a single centered "Use this bundle" button. The previously-spec'd `Close` button was removed — the X icon, Esc key, and backdrop click already cover dismissal.
- "Use this bundle" handler: `bundleToAllocations(bundle, workspace)` → `setValue('projectAllocations', …, { shouldDirty: true, shouldValidate: true })`, then closes the modal. (No `selectedBundleSlug` to write — bundle selection is derived.)
- The whole bundle card on the parent page also acts as a select-on-click target (clicking the card body writes the allocations directly without opening the modal).

**Departures from spec:**

- **Metric flipped** from "trees per €" to "unit cost per unit". Spec showed `~1.4 trees/€`; we ship `~8 € per tree` / `~12 € per m²`. Driven by `unitCost` + `unitType` fields added to `ProjectData` and normalized in `projects-service.ts`. ICU `select` on `unitType` localizes the unit name (en `tree` / de `Baum`, m² unchanged). Currency-typed projects show country only, no metric.
- **"Learn More" link replaces row-as-link.** Earlier iteration had the whole `<li>` be an `<a>`; final version has the row as a plain element with a right-aligned link, so clicking the row text doesn't accidentally navigate away.
- **Width**: `max-w-[min(56rem, 100dvw - 1.5rem)]` — matches `image-selection-overlay`'s ceiling on desktop and pins to the dynamic visual viewport on mobile (resolves a class of mobile-overflow bugs). Outer overlay uses block layout + `mx-auto` (not flex centering) for predictable width on iOS Safari.
- **Colors**: orange-themed palette (header band `bg-orange-100`, footer band `bg-orange-50/50`, "LOVE/RAGE/etc" tag pill `bg-orange-200`, Learn More `text-orange-700`). The contextual tag is the bundle's identity moment.
- **Mobile responsiveness**: `min-w-0` + `wrap-break-word` on bundle name and project names, `overflow-hidden` on row text wrappers, smaller image (40 × 40) and tighter padding on `< sm` breakpoints.

**Step 5a — `projectsService.getProjectById` (deferred):**

Not implemented. Reason: the only ID known to be missing from `getCauseSelectableProjects` is the workspace's support project (it's filtered out because its `purpose` isn't `trees`/`conservation`). `useBundleProjects.getProject` falls back to a synthetic `ProjectData` built from `DEFAULT_NON_EARMARKED_CAUSE_FALLBACK` for that one ID. Other curated bundle IDs all pass the cause-selectable filter.

If support-project metadata becomes important enough to require live data (it currently shows fixed `name` / `description` / `image` from the constants), the right move is to switch `useBundleProjects` to call `getProjects` (the unfiltered list) instead of `getCauseSelectableProjects` — same shape, no new endpoint needed. See the "Fix options" notes from the implementation discussion.

**Files actually touched:**

- `src/components/fundraisers/bundle-selection/bundle-preview-modal.tsx` — new
- `src/components/fundraisers/bundle-selection/use-bundle-projects.ts` — new (lifted to `BundleTabs` per Step 4)
- `src/lib/types/project-selection.ts` — added `unitCost`, `unitType`, `ProjectUnitType`
- `src/lib/api/projects-service.ts` — added `normalizeUnitCost` / `normalizeUnitType` to `normalizeProject`
- `src/lib/utils/bundle.ts` — added `getDisplayableUnitCost`
- `locales/{en,de}/fundraisers.json` — `Fundraisers.form.bundleSelection.modal.{projectsInside,useBundle,unitCost,learnMore,tag.{rage,wonder,love,staffPicks},errorTitle,errorMessage,retry,loading}` plus `aria.{closeModal,openProject,selectedBundle,openBundle}` and `projectImageAlt`

**Visual test:** open `/fundraisers/create`, click any bundle card on the page background → modal opens with 5 rows and full metadata. Click "Use this bundle" → modal closes, the bundle's card on the page now shows the selected check; `projectAllocations` reflects the 28%/18×4 split. Try a card click directly (without opening modal) → also selects.

---

### Step 6 — Custom tab panel

**Status:** placeholder shipped (a "Coming soon" box). UX shared by user; real implementation pending.

**Locked-in decisions for when this lands:**

- **Use `getDefaultCauseId(country)` for the support project, not `BUNDLE_CONFIG.supportProjects[workspace]`.** The bundle workspace map is DE-only; the `getDefaultCauseId` helper has support-project IDs for DE / ES / CH / ROW. Custom needs to work for every country, so the country-aware lookup is the right primitive.
- **Allocation rule should match Decision #10** — the same 25% floor on the support project that `bundleToAllocations` applies. Either reuse the inline logic from `bundleToAllocations` or extract a shared `splitWithDefaultMinimum(ids, defaultIndex)` helper. Don't reintroduce a divergent equal-split rule for Custom.
- **Country-change reconciliation for Step 4a should land in this step too** — when Custom can actually receive new allocations, switching DE → ES (or vice versa) needs to swap the support project ID from `getDefaultCauseId(oldCountry)` to `getDefaultCauseId(newCountry)` and re-split.

**What:**

`custom-tab-panel.tsx` — implements screenshot 1:

- **Support-project preselection.** On mount, if the resolved country's `getDefaultCauseId` is not yet in allocations AND `projectAllocations` is empty, seed allocations with `[{ project_id: defaultCauseId, percentage: 100 }]`. This is the "100% allocation initially, then split when causes are added" behaviour. The seeding runs once per mount; it must not re-seed after the user removes the support project.
- **Top section ("Search 200+ projects by name or country…")** — search input + 2-column project grid.
  - Source: same `useBundleProjects()` hook from Step 5 (reuses the cached country fetch). When the country is not `DE`, refetch for the user's country.
  - Filter pipeline: by `name`, `description`, `country`, `tpo.name` (legacy parity, lowercase compare).
  - Pagination: show **8 cards** when the search query is empty, with `"Showing 8 of N · Search to find more"` footer. When the user types, show all matching results.
  - Each card has a `+` button. Clicking adds the project to allocations (recompute equal split via `getEqualSplit(allocations.length + 1)`).
  - Already-selected projects (including the preselected support project) are excluded from the grid.
- **Bottom section ("YOUR CUSTOM BUNDLE — N projects")** — list of currently-selected projects with image, name, country, percentage, and `×` remove button. Removing recomputes equal split. The support project is removable (parity with adding any other project) — once removed it does not re-seed automatically.
- Selecting any project clears `selectedBundleSlug` (it is no longer a clean bundle match).

`custom-tab-panel.tsx` does **not** use the existing `<ProjectSelectionOverlay />`. The grid is rendered inline.

**Files:**

- `src/components/fundraisers/bundle-selection/custom-tab-panel.tsx` — new
- `src/components/fundraisers/bundle-selection/project-search-card.tsx` — new (the `+` card)
- `src/components/fundraisers/bundle-selection/selected-project-row.tsx` — new (the `×` row)
- `locales/en/fundraisers.json`, `locales/de/fundraisers.json` — add `Fundraisers.form.bundleSelection.custom.{searchPlaceholder,showingCount,yourBundle,projectCount,removeProject,addProject,emptyState}` plus `aria-label`s for `+` / `×`

**Visual test:** Custom tab → search box filters to typed query; clicking `+` moves a project into the bundle list with re-split percentages; `×` removes it; switching to a bundle tab and back preserves the manual selection (do **not** auto-clear when leaving Custom).

---

### Step 7 — Public view: bundle header + per-row percentages

**What:**

Extend [projects-supported-display.tsx](src/components/fundraisers/projects-supported-display.tsx):

- On render, resolve `workspace = getWorkspaceForCountry(fundraiser.country)`. If `null`, skip bundle detection (custom-only fundraiser).
- Otherwise run `detectBundleFromAllocations(projectAllocations, workspace)`.
- If a bundle matches: render the bundle header row above the list (icon + label + em-dashed tagline + uppercase tab tag, e.g. `LOVE BUNDLE`). Use `getDisplayTabForBundle()` for the tag.
- Add `percentage` rendering on each `ProjectItem` (currently hidden in this component, only shown in edit). Show as a right-aligned `XX%`.
- Add a "See all →" link on the right of the header — opens the same `BundlePreviewModal` from Step 5 in read-only mode (no "Use this bundle" CTA in public view).

**Files:**

- `src/components/fundraisers/projects-supported-display.tsx` — extend
- `src/components/fundraisers/bundle-selection/bundle-preview-modal.tsx` — accept `mode: 'select' | 'view'` prop to toggle the CTA
- `locales/en/fundraisers.json`, `locales/de/fundraisers.json` — add `Fundraisers.publicView.bundle.{header,tag.{rage,wonder,love,staffPicks},seeAll}` and the percentage suffix already exists as `allocationLabel`

**Visual test:** Open `/fundraisers/<slug>` for a fundraiser whose allocations match a bundle → bundle header renders with correct tab tag and tagline, project rows show percentages. For non-matching (custom) fundraisers → no header, just the project list with percentages (or current behaviour, TBD — see Step 7a).

**Step 7a — Custom-fundraiser public view:** confirm with stakeholders whether percentages should display for custom fundraisers too. Default in this plan: yes, always show percentages. Easy to flip with a single condition.

---

### Step 8 — Cleanup + remove dead code

**What:**

Once Steps 1–7 are merged and the new flow is the only entry point:

- Delete [project-selection.tsx](src/components/fundraisers/project-selection.tsx) and [project-selection-overlay.tsx](src/components/fundraisers/project-selection-overlay.tsx).
- Audit `src/lib/utils/project-selection.ts` — keep `mapProjectToSelectedCause` (still used by Step 5/6 hook), drop `createDefaultCause`, `resolveCauseCountry`, `getDefaultCauseId`, `calculateProjectAllocations` if no other caller remains.
- Drop `MIN_DEFAULT_CAUSE_PERCENT` from [project-selection.ts](src/lib/constants/project-selection.ts) if unused.
- Remove now-orphaned i18n keys under `Fundraisers.form.projectSelection.modal.*` and `addCause`/`removeCause` if not referenced.

**Files:** as above.

**Visual test:** Full create + edit + public-view smoke run, both `/en` and `/de` locales.

---

## Cross-cutting concerns

### i18n

Every user-facing string — including `aria-label`, `title`, `alt`, `placeholder` — must use `next-intl` with both `en` and `de` entries. New namespace: `Fundraisers.form.bundleSelection.*` and `Fundraisers.publicView.bundle.*`. The bundle `label` and `tagline` from the config remain raw strings for now; once translations are provided, swap them to `useTranslations('Bundles.<slug>.label')` etc.

### Accessibility

- Tab triggers use the shadcn `Tabs` primitive (already keyboard-accessible).
- Bundle cards and project `+` / `×` buttons must be `<button type="button">` with descriptive `aria-label`s.
- Modal: focus trap + Escape-to-close handled by the existing modal pattern in `project-selection-overlay.tsx` (port it).

### Performance

- One `/countryProjects/<country>?locale=<l>` fetch per form mount, cached in `projectsService`.
- Bundle missing-ID fallback fetches happen lazily, only when a preview modal opens.
- The public view does **not** fetch country projects; bundle metadata is read from the static config + the `projectAllocations` already on the fundraiser response.

### Country handling

- **Workspace gating.** The bundle config is workspace-scoped (`meta.workspace: 'DE'`). The form's selected country is mapped to a workspace via `getWorkspaceForCountry`:
  - `DE` → workspace `DE` → all 5 tabs.
  - "Rest of the World" (form's default-country fallback) → workspace `DE` → all 5 tabs.
  - `ES`, `CH` → `null` → only the Custom tab is exposed.
- **Form behaviour.**
  - When a workspace exists, the workspace's support project is preselected at 100% on a fresh form (and stays as a regular member of any chosen bundle's 5-project allocation).
  - Country drives the Custom tab's project list (refetch on country change, like today).
  - Country changes between workspace ↔ Custom-only modes reconcile allocations per Step 4a.
- **Public view.** Workspace is resolved from the fundraiser's country. Bundle detection runs only when a workspace exists; for Custom-only-country fundraisers no bundle header is rendered.

### Testing strategy per step

- Unit tests for Step 2 helpers (highest leverage — every other step depends on these).
- Component tests for `BundleTabs`, `BundlePreviewModal`, `CustomTabPanel` — happy path + edge cases (empty bundle, all projects selected, missing project metadata).
- Visual smoke test in browser per step as listed above. The user has confirmed they cannot run automated UI tests, so each step's "Visual test" is the merge gate.

---

## Out of Scope (for this plan)

- Translating bundle labels / taglines (handled in a follow-up once strings are localised).
- Persisting `selectedBundleSlug` on the API (current detection-by-match approach is simpler and covers the requirement).
- Editing bundle config from a CMS — config is hard-coded for now.
- Analytics events on bundle selection (deferred).
