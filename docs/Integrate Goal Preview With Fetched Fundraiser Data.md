# Integrate Goal Preview With Fetched Fundraiser Data

## Summary

Refactor `GoalPreview` into read/write modes so it can render create‑form previews (current behavior) and also render real fundraiser stats from fetched data. Move the stats + donation count UI from `fundraiser-view.tsx` into the read mode of `GoalPreview`.

## Key Changes

- **GoalPreview API update**
  - Add `mode?: 'read' | 'write'` (default `read`) and `fundraiser?: Fundraiser` (required for read).
  - Split into `GoalPreviewRead` (uses fundraiser data) and `GoalPreviewWrite` (uses RHF `useWatch`).
- **Read mode (fundraiser view)**
  - Compute `progressPercent` with `totalRaised / goalAmount` (guard goalAmount = 0).
  - Compute `daysLeft` from `endDate` (same helper currently in `fundraiser-view`).
  - Render the exact UI block currently in `fundraiser-view`, including donation count.
  - Use `useTranslations('Fundraisers.create.goalPreview')` for raised/goal/days and `useTranslations('Fundraisers')` for donation count.
- **Write mode (create flow)**
  - Keep existing RHF logic: watch `goalAmount`, `currency`, keep progress at 40%, days at 42.
  - No donation count in write mode.
- **Wire usage**
  - `fundraiser-view.tsx`: replace stats + donation count block with `<GoalPreview mode="read" fundraiser={fundraiser} />`; remove local progress/days calculations and unused imports.
  - Create page: update to `<GoalPreview mode="write" />` to avoid changing current create flow.

## Test Plan

- Create flow: `/fundraisers/create` still shows 40% progress, goal amount from form, days left 42.
- Fundraiser view: `/fundraisers/[slug]` shows real raised amount, progress percent, goal line, days left, and donation count.

## Assumptions

- Read mode requires a `Fundraiser` object with `goalAmount`, `totalRaised`, `currency`, `endDate`, and `donationCount`.
- Default mode should be `read` to match Title/Description’s pattern; create page will explicitly pass `mode="write"`.
