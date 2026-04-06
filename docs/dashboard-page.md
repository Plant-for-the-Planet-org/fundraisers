# Dashboard Page Plan (Legacy‑aligned)

## Summary
Build the `/(standard)/dashboard` page to match `gofundnature`’s high‑level overview: a localized header + three reusable cards. Use `AuthGuard` + `authStore` for user context, and a shared `CardBase` layout inside `src/components/dashboard`.

---

# Main Task – Dashboard Page

**Goal**
- Render a localized dashboard header with a friendly welcome line using `authStore` data.
- Show three summary cards using a shared `CardBase`.
- Keep layout consistent with current typography and default theme styles.

**Implementation notes**
- Update `src/app/(standard)/dashboard/page.tsx` to be a client component using `AuthGuard`.
- Use `useAuthStore` to get `user` and derive display name (`profile.displayName || user.name || user.email || t('fallbackName')`).
- Use `useTranslations('Dashboard')` for all copy.

---

## SubTask – Card for My Fundraisers
- Purpose: show count of the user’s fundraisers and a short status line.
- Data: placeholder `0` count and “no active fundraisers” message (localized).
- UX: single metric + helper text, consistent with legacy layout.

## SubTask – Card Total Raised
- Purpose: show total raised across campaigns.
- Data: placeholder `€0` using EUR (per your decision), with a call‑to‑action hint.
- UX: amount in large type, short description underneath.

## SubTask – Card Donations
- Purpose: show count of donations made by the user.
- Data: placeholder `0` + “no donations yet” message.
- UX: identical layout to other cards for visual rhythm.

---

## Key Implementation Changes
- **New components in `src/components/dashboard/`:**
  - `card-base.tsx`: shared layout using `ui/card` primitives.
  - `my-fundraisers-card.tsx`, `total-raised-card.tsx`, `donations-card.tsx`: thin wrappers that pass localized strings and placeholder values into `CardBase`.
  - Optional `index.ts` export for clean imports.
- **Routing:**
  - Replace placeholder `src/app/(standard)/dashboard/page.tsx` with the new layout and cards.
- **Localization:**
  - Expand `locales/en/dashboard.json` + `locales/de/dashboard.json` with:
    - header title + welcome line
    - card titles, descriptions, empty states, and CTA hints
  - Update `src/i18n/types.ts` to include `MessagesDashboard` so `useTranslations('Dashboard')` stays type‑safe.
- **Docs:**
  - Update `docs/structure.md` to include `src/components/dashboard` and the dashboard route.

---

## Test Plan
- `npm run type-check`
- Manual check: `/dashboard` renders after auth, welcome line uses user profile/name/email.
- Verify each card shows localized title/description and placeholder metrics.

---

## Assumptions
- Total Raised uses EUR placeholder `€0` (legacy‑aligned).
- Cards are informational only (no links or actions yet).
- Dashboard data is placeholder until API wiring is introduced.
