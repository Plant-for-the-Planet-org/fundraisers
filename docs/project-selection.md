## Project Selection / Add Cause Parity (Updated)

### Summary

Align Project Selection data loading and filtering exactly with `gofundnature` while keeping the RHF integration in `fundraiser`.
Add legacy project metadata tags in overlay cards: **Top Project**, **Country**, **Type**, and **Learn More** link.

### Implementation Changes

1. Data fetch behavior.

- Use `/projects` endpoint via `ProjectsService`.
- Load projects when overlay opens and refetch when fundraiser country changes.
- Keep only `allowDonations === true` projects for cause selection.

2. Keep filtering pipeline exactly as legacy.

- Apply tab filter first (`top` => `isTopProject === true`, `all` => no tab filter).
- Exclude already-selected projects.
- Apply raw-query search filter (`name`, `description`, `country`, `tpo.name`) without extra normalization beyond lowercase conversion.
- Remove any country-based filter mode/switch logic from this flow.

3. Keep create-flow RHF behavior from current implementation.

- `FundraiserFormValues.projectAllocations` is the single source of truth for both the UI and the API payload; the component reads it via `useWatch` rather than keeping a parallel `extraProjects` state.
- Presentation-only project metadata (name, description, image) is cached in a local `sessionProjectDetails` map, merged with any `initialExtraProjects` prop into `projectDetailsById`. This map is never written back to the form.
- Allocation writes go through a single `commitAllocations(nextIds)` helper that re-derives percentages via `calculateProjectAllocations` and calls `setValue('projectAllocations', …, { shouldDirty: true, shouldValidate: true })`.
- Country change only swaps the stale default-cause id in the form for the new one: user-selected projects present in `projectDetailsById` are kept; any allocation that does not map to a known project (i.e. the previous default cause) is replaced by the new `defaultCauseId`. A short-circuit skips the update when allocations already reference the current `defaultCauseId`, so mount never dirties the form.
- Allocation remains derived from selected projects via utility function.
- `MIN_DEFAULT_CAUSE_PERCENT` is `25`.
- Allocation behavior (legacy parity):
  - Equal split across all projects when `floor(100 / projectCount) >= 25` (or when `MIN_DEFAULT_CAUSE_PERCENT` is `null`/`0`).
  - Otherwise, default cause gets `25%` plus the remainder, other causes split the remaining `75%` evenly.

4. Improve project card metadata in overlay (legacy parity + requested improvement).

- Add metadata row with:
  - Top Project tag
  - Country label
  - Type tag (`trees` => restoration, `conservation` => conservation)
  - Learn More link to Plant-for-the-Planet project page with tracking params

5. Localize all new UI text.

- Add/update keys in `locales/en/fundraisers.json` and `locales/de/fundraisers.json` under `Fundraisers.create.projectSelection.modal.tags.*`.

### Public APIs / Interfaces / Types

- `ProjectsService` exposes:
  - `getProjects()`
  - `getCauseSelectableProjects()`
- Project selection utility API keeps:
  - `resolveCauseCountry`
  - `getDefaultCauseId`
  - `createDefaultCause`
  - `calculateProjectAllocations`
- Country-filter mode contracts are removed from this slice.

### Test Plan

1. Open Add Cause overlay:

- fetch runs once on first open
- shows loading, success, and retry states

2. Verify filter order parity:

- tab (`top`/`all`) changes result set
- selected projects are excluded
- search filters remaining results by legacy fields

3. Verify metadata row on each project card:

- Top Project tag
- Country label
- Type tag
- Learn More opens external project page and does not select the project

4. Verify selection flow:

- click project card selects and closes overlay
- selected project no longer appears in overlay list

5. Verify create-flow behavior:

- default non-earmarked cause exists initially
- country change swaps only the stale default cause id for the new one; previously selected extra projects stay in the list
- allocation display remains correct

### Assumptions

- Legacy default cause mapping remains DE fallback for all countries.
- Edit-route behavior is still future scope; utility fallback when default cause is missing remains supported.
