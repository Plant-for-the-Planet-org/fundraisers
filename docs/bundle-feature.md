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
| 3 — Form schema + provider wiring | ✅ Shipped (simpler than spec) | No ephemeral form fields. Active tab is component-local `useState`; selected bundle is derived on each render via `detectBundleFromAllocations`. `buildDefaultCreateValues` now seeds the default bundle (first slug of `meta.defaultTab`) via `bundleToAllocations`, so a fresh form mounts with that bundle pre-selected on its tab |
| 4 — `BundleTabs` shell | ✅ Shipped (create + edit) | Both create and edit forms render `<BundleTabs />`. Edit-mode initial-tab logic: bundle match → bundle's first tab; no match → `custom` (so existing custom selections land where they can be edited). Tabs are a custom segmented-pill control (matches `FundraiserStatusFilter`), not the shadcn `Tabs` primitive |
| 4a — Country gating | ✅ Shipped | Tab visibility flips correctly between DE/ROW (all tabs) and ES/CH (Custom-only). Country-change reconciliation handled via `workspace-selector` — switching country wipes allocations and reseeds the new country's default cause at 100% |
| 5 — Bundle preview modal | ✅ Shipped | UX iterated past spec; see step body for the shipped behaviour |
| 5a — `projectsService.getProjectById` | 🟡 Deferred | Not needed in practice. Synthetic fallback in `useBundleProjects` covers the support-project miss using `DEFAULT_NON_EARMARKED_CAUSE_FALLBACK` |
| 6 — Custom tab panel | ✅ Shipped | Default project is locked (not removable); 8-card paginated grid; image + name in grid links to project page in new tab; selected rows non-interactive |
| 7 — Public view | ⏸ Pending | |
| 8 — Cleanup | ✅ Shipped | Deleted `project-selection.tsx`, `project-selection-overlay.tsx`, `docs/project-selection.md`. Dropped `mapProjectToSelectedCause`, `createDefaultCause`, and the exported `resolveCauseCountry` (now internal) from `lib/utils/project-selection.ts`. Trimmed the `Fundraisers.form.projectSelection.*` locale namespace to the 4 keys still consumed by the public-view `ProjectsSupportedDisplay` component |

## Open Decisions Captured (defaults assumed unless overridden)

| # | Decision | Default taken |
|---|----------|---------------|
| 1 | Bundle identity persistence | Not stored on API; reverse-detected on edit by ID-set match |
| 2 | Manual edit to bundle's project list | Falls back to `Custom` tab on next edit |
| 3 | Support project handling | **Workspace-level** default project (not embedded in bundle config). Stored in a separate `supportProjects` map keyed by workspace. Component prepends it to bundle projects at render/allocation time and preselects it in Custom |
| 4 | Project metadata source | `/countryProjects/<country>?locale=<l>` once on mount, plus per-ID fallback fetch for bundle / support projects missing from the list |
| 5 | Tab → bundle mapping | Driven by `tabs[].bundleSlugs` in config; `bundles[].tab` is informational only |
| 6 | Public-view bundle tag | When a bundle has multiple tabs, prefer the first non-`staff-picks` tab |
| 7 | Bundle labels / taglines | Translated via `Bundles.entries.<slug>.{label,tagline}` in `locales/{en,de}/bundles.json`. Components look up by slug; the raw strings in `BUNDLE_CONFIG` are no longer rendered. German copy is a draft — flag for native-speaker review. |
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

`buildDefaultCreateValues` seeds `projectAllocations` from the default bundle (first slug of `BUNDLE_CONFIG.meta.defaultTab`) via `bundleToAllocations`, resolved against the default country's workspace. A fresh DE/ROW form mounts with that bundle's allocations, so `detectBundleFromAllocations` matches on first render and `BundleTabs` lands on the bundle's tab with the bundle card shown selected. If the default country has no workspace (shouldn't happen for `DE`), it falls back to the legacy single-support-project allocation at 100%.

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
- **Swap covers both create and edit.** `fundraiser-form-body.tsx` renders `<BundleTabs mode={mode} />` for both forms. The `mode` prop drives the initial-tab fallback when no bundle is detected: create → `BUNDLE_CONFIG.meta.defaultTab` (Staff Picks); edit → `'custom'`, so a fundraiser whose existing allocations don't match any curated bundle opens directly on the Custom tab where the user can edit them. Bundle-match behaviour is identical in both modes (open on the bundle's first tab). The legacy `<ProjectSelection />` and `<ProjectSelectionOverlay />` files are now fully orphaned — Step 8 cleanup is unblocked.
- **`useBundleProjects` lifted to `BundleTabs`** rather than created per-modal-instance, so the bundle cards can render real project thumbnails (was a follow-up fix once thumbnails were noticed to be placeholders).

**Step 4a — Country gating behaviour (shipped):**

What works:
- DE / ROW → workspace `DE` → all 5 tabs render with the bundle card grid.
- ES / CH → workspace `null` → tab strip is hidden, body renders the live Custom panel for that country.
- Country-change reconciliation handled in [`workspace-selector.tsx`](src/components/fundraisers/workspace-selector.tsx): on country change the form wipes `projectAllocations` and reseeds with `[{ project_id: getDefaultCauseId(newCountry), percentage: 100 }]`, marked `shouldDirty: true, shouldValidate: true`.

Deliberate trade-off: this is a full reset, not a swap-and-resplit. The original spec implied swapping the support project ID and rebalancing the existing percentages. We chose the blunt reset because (a) projects fetched for country A almost certainly aren't valid for country B's catalogue, so preserving them is unsafe, and (b) the user has no expectation that selections survive a workspace change. Trade-off: a careful custom-bundle build is silently discarded if the user accidentally clicks the country dropdown — a confirmation dialog or "selections were reset" toast would be a worthwhile follow-up.

**Files:**

- `src/components/fundraisers/bundle-selection/{bundle-tabs,bundle-tab-panel,bundle-card,use-bundle-projects,index}.{ts,tsx}` — new
- `src/components/fundraisers/fundraiser-form-body.tsx` — `mode === 'create'` branch
- `locales/{en,de}/bundles.json` — `Bundles.tabs.*` plus `card.{seeInside,projectCount}` and `aria.{openBundle,selectedBundle}`

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
- `locales/{en,de}/bundles.json` — `Bundles.modal.{projectsInside,useBundle,unitCost,learnMore,tag.{rage,wonder,love,staffPicks},errorTitle,errorMessage,retry,loading}` plus `aria.{closeModal,openProject,selectedBundle,openBundle}` and `projectImageAlt`

**Visual test:** open `/fundraisers/create`, click any bundle card on the page background → modal opens with 5 rows and full metadata. Click "Use this bundle" → modal closes, the bundle's card on the page now shows the selected check; `projectAllocations` reflects the 28%/18×4 split. Try a card click directly (without opening modal) → also selects.

---

### Step 6 — Custom tab panel (shipped)

**What we shipped:**

- `custom-tab-panel.tsx` — top-level layout with two cards stacked: the search/grid panel, then the "YOUR CUSTOM BUNDLE" selected list.
- `project-search-card.tsx` — the `+` card used in the grid.
- `selected-project-row.tsx` — the row used in the selected list (X for removable rows, Lock indicator for the default).

**Support project preselection.** `useEffect` with a `hasSeededRef` guard runs once on mount: if `projectAllocations` is empty, it seeds `[{ project_id: getDefaultCauseId(country), percentage: 100 }]` with `shouldDirty: false, shouldValidate: false`. The guard means removing-and-re-mounting doesn't re-seed unintentionally; once the form is dirty the user owns the state.

**Search grid (top card):**
- Reuses the same `useBundleProjects(country)` hook from Step 5 — single fetch shared with the bundle tabs.
- Filter is `name | description | country | tpo.name` (lowercase contains) for legacy parity.
- Renders an 8-card 2-column grid by default with `"Showing 8 of N · Search to find more"` footer when results exceed 8. Typing into the search box drops the cap and shows all matches.
- Already-selected projects (including the preselected default cause) are filtered out of the grid.
- Each card: gradient placeholder fallback (no Target icon) | name + country + unit cost (`€X per tree` / `Y € pro Baum` per locale) | `+` button.
- **Image + name region is wrapped in `<a target="_blank">`** that points at the platform project page (same UTM params as the modal's "Learn More" link). Hover reveals an `ExternalLink` icon and shifts the title to the primary accent. The `+` button is a separate click target outside the link.
- Empty / loading / error / "all added" states are inline (no overlay component).

**Selected list (bottom card):**
- Header: `YOUR CUSTOM BUNDLE` eyebrow + `N project(s)` count.
- Each row: image | name (line-clamp-2) + country | percentage | action slot. Rows are **non-interactive** (no link, no hover) — explicitly different from the search grid.
- **Default project is locked, not removable.** Per UX feedback the workspace's default cause must always remain in the bundle. Renders a muted `Lock` icon in the action slot with `aria-label` / `title` `"{name} is the default project and cannot be removed"`.
- **Lock icon only renders when there are removable siblings.** When the default is the only allocation, the action slot is omitted entirely so the row stretches full width.
- Removable rows: bordered `X` button styled as a peer to the `+` button (both `h-8 w-8`, `border bg-background`); hover shifts to `destructive` color (vs. `primary` for `+`) to communicate intent.

**Allocation rule:**

Reuses the existing `calculateProjectAllocations` from `@/lib/utils/project-selection` rather than extracting a shared `splitWithDefaultMinimum`. That helper already enforces `MIN_DEFAULT_CAUSE_PERCENT` (25% floor on the default cause) — same rule as Decision #10, no divergent code path. The `applyAllocationsFromIds` callback in `custom-tab-panel.tsx` builds placeholder `SelectedProject[]` objects from the IDs, runs them through `calculateProjectAllocations(placeholderProjects, defaultCauseId, MIN_DEFAULT_CAUSE_PERCENT)`, and writes the resulting `{ project_id, percentage }` array.

**Bundle detection coexistence:**

Adding or removing in Custom mutates `projectAllocations`, which automatically falls out of `detectBundleFromAllocations` on the next render — no explicit `selectedBundleSlug` to clear (Step 3's "derive on render" decision pays off here). Switching back to a bundle tab still shows the previous bundle as unselected unless its exact 5-ID set match is restored.

**Departures from spec:**

- **Default project is not removable** — original spec said "removable (parity with adding any other project)". Changed to locked-and-indicated after UX iteration; preserves the workspace's support project guarantee on every fundraiser. The Lock indicator pattern (with `showLockIndicator` prop reserving a fixed-width slot only when siblings exist) keeps percentages aligned across rows.
- **Image + name links out** in the search grid (not spec'd) — addresses the "users have no way to learn about a project before adding" gap that Custom had vs. the bundle tabs (which expose Learn More inside the modal). Selected rows are intentionally **not** linked to keep that section purely an editing context.
- **Allocation rule reuses `calculateProjectAllocations`** (already country-aware via `defaultCauseId` parameter) instead of extracting a new shared helper. The earlier draft of this step proposed `splitWithDefaultMinimum`; deemed unnecessary given the existing helper already does the same job.
- **Country-change reconciliation moved to `workspace-selector.tsx`** rather than living inside Custom — see Step 4a above for the full reset trade-off.

**Files:**

- `src/components/fundraisers/bundle-selection/custom-tab-panel.tsx` — new
- `src/components/fundraisers/bundle-selection/project-search-card.tsx` — new
- `src/components/fundraisers/bundle-selection/selected-project-row.tsx` — new
- `src/components/fundraisers/workspace-selector.tsx` — added country-change reset
- `src/lib/utils/bundle.ts` — added `buildProjectLearnMoreUrl` helper (the existing duplicates in `project-selection-overlay.tsx` and `bundle-preview-modal.tsx` were left in place; cleaning those up belongs in Step 8)
- `locales/{en,de}/bundles.json` — added `Bundles.custom.{description,searchPlaceholder,showingCount,noResultsTitle,noResults,clearSearch,loading,errorTitle,errorMessage,retry,yourBundle,projectCount,emptyState,allAddedTitle,allAddedDescription,allocationLabel}` plus the `custom.aria.{search,addProject,removeProject,defaultProjectLocked}` sub-namespace.

**i18n note:** aria/screen-reader-only strings were grouped under a `custom.aria.*` sub-namespace (matching the existing `bundleSelection.aria.*` convention) rather than mixed with the visible strings. The `defaultProjectLocked` key is new — it powers the Lock indicator's `aria-label` and `title`.

**Visual test:** Custom tab on `/fundraisers/create` → support project preselected at 100% with Lock icon (no removable siblings → Lock hidden, full-width row). Type into search → grid filters; click `+` → project moves into selected list with split percentages, Lock now visible on default row. Click `×` on a non-default row → removed, percentages re-split. Click image or name on a search-grid card → opens project page in a new tab with UTM params. Switch country in the workspace selector → allocations reset to the new country's default cause at 100%.

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

### Step 8 — Cleanup + remove dead code (shipped)

**What we shipped:**

Now that the bundle UI is the only entry point on both create and edit forms (Step 4), the legacy project-selection components and their support code have been removed:

- **Deleted files:**
  - `src/components/fundraisers/project-selection.tsx`
  - `src/components/fundraisers/project-selection-overlay.tsx`
  - `docs/project-selection.md`
- **Trimmed `src/lib/utils/project-selection.ts`:** removed `mapProjectToSelectedCause` and `createDefaultCause` (only consumed by the deleted components). `resolveCauseCountry` is now a non-exported internal helper (still used by `getDefaultCauseId`). `getDefaultCauseId` and `calculateProjectAllocations` stay — both are core dependencies of the bundle/custom flows.
- **Kept `src/lib/constants/project-selection.ts` as-is:** every exported constant is still used (`MIN_DEFAULT_CAUSE_PERCENT` by `bundleToAllocations` and custom tab; `DEFAULT_NON_EARMARKED_CAUSE_FALLBACK` by `useBundleProjects`; `DEFAULT_NON_EARMARKED_CAUSE_BY_COUNTRY` and `DEFAULT_NON_EARMARKED_CAUSE_ID` by `getDefaultCauseId`).
- **Trimmed `Fundraisers.form.projectSelection.*` locale namespace** in both en and de. The 4 keys still referenced by [projects-supported-display.tsx](src/components/fundraisers/projects-supported-display.tsx) were preserved: `viewModeSectionHeading`, `projectImageAlt`, `expandDescription`, `collapseDescription`. Everything else (`addCause`, `removeCause`, `modal.*`, `aria.*`, `defaultCause`, etc.) was dropped.

**Not touched (intentionally):**

- The public-view `projects-supported-display.tsx` component itself stays — it's a different component from the form-side `ProjectSelection` and remains the active surface for the fundraiser detail page.
- Types in `src/lib/types/project-selection.ts` are all still in use (`ProjectData`, `SelectedProject`, `ProjectAllocationPreview`, `ProjectPurpose`, `PROJECT_PURPOSES`, `ProjectUnitType`, `DefaultCauseIdByCountry`) — no trims.

**Visual test:** Full create + edit + public-view smoke run, both `/en` and `/de` locales. Edit form should load existing fundraisers into the bundle UI (matching bundles open on their tab; non-matching land on Custom).

---

## Cross-cutting concerns

### i18n

Every user-facing string — including `aria-label`, `title`, `alt`, `placeholder` — must use `next-intl` with both `en` and `de` entries. Namespace: `Bundles.*` (extracted into `locales/{en,de}/bundles.json`) and `Fundraisers.publicView.bundle.*`. Bundle `label` and `tagline` are looked up by slug from `Bundles.entries.<slug>.{label,tagline}` — `BUNDLE_CONFIG.bundles[].label` / `.tagline` exist only as authoring metadata and are not rendered.

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

- Persisting `selectedBundleSlug` on the API (current detection-by-match approach is simpler and covers the requirement).
- Editing bundle config from a CMS — config is hard-coded for now.
- Analytics events on bundle selection (deferred).
