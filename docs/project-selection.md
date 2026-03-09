## Project Selection / Add Cause Parity (Updated)

### Summary

Align Project Selection data loading and filtering exactly with `gofundnature` while keeping the RHF integration in `fundraiser`.
Add legacy project metadata tags in overlay cards: **Top Project**, **Country**, **Type**, and **Learn More** link.

### Implementation Changes

1. Keep data fetch behavior exactly as legacy.

- Use `/projects` endpoint via `ProjectsService`.
- Load all projects once when overlay opens.
- Keep only `allowDonations === true` projects for cause selection.

2. Keep filtering pipeline exactly as legacy.

- Apply tab filter first (`top` => `isTopProject === true`, `all` => no tab filter).
- Exclude already-selected projects.
- Apply raw-query search filter (`name`, `description`, `country`, `tpo.name`) without extra normalization beyond lowercase conversion.
- Remove any country-based filter mode/switch logic from this flow.

3. Keep create-flow RHF behavior from current implementation.

- `CreateFundraiserFormValues.projects` remains the source of truth.
- Country change still resets selected projects to default non-earmarked cause (legacy create-page behavior).
- Allocation remains derived from selected projects via utility function.
- Default non-earmarked cause minimum allocation is `28%`; this applies when equal split would drop below `28` (starts from 4+ causes).

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
- country change resets selected projects to default cause
- allocation display remains correct

### Assumptions

- Legacy default cause mapping remains DE fallback for all countries.
- Edit-route behavior is still future scope; utility fallback when default cause is missing remains supported.
