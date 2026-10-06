# Insights PDF Report Plan

## Context

- Hosts want to print or share a fundraiser's insights: hand a page to family, a company, a club, or pin it up.
- The dashboard Insights tab already has all the numbers. This adds a one page A4 report of the same data, with a QR code that leads back to the fundraiser.
- Design (two artboards, the second is a busy 30 day case with a light accent): https://claude.ai/artifact/RjtGshUFzLWpwFx7RXbPcN
- How insights work today is in [insights.md](../insights.md).

## Decision: print route first, Cloudflare later

- **v1**: a dedicated print page plus print CSS. The host clicks "Download PDF", a clean A4 preview opens, and the browser's own Print dialog saves it as PDF.
- Why: no new infrastructure, no cost, no file storage, the charts are plain divs so they stay sharp, and the page already sits behind the host's login.
- **Later, only if needed**: Cloudflare Browser Rendering can turn the same print page into a PDF on our side, for emailed or scheduled reports. It needs a short lived signed link, because the page is behind login and the token lives in the browser. Not in v1.

## What Already Exists

- `FundraiserInsightsCard` and its pieces in `src/components/dashboard/fundraiser-detail/`: chart, totals, donation journey, audience lists.
- `useFundraiserInsights(slug, range)` fetches `GET /api/fundraisers/[slug]/insights` with the host's token. The print page reuses it, so there is no new API and no new access rule.
- Raised, goal, donation count and hosts come from the fundraiser in `FundraiserDetailContext`. Donor count comes from `useLeaderboardSummary`. `FundraiserPerformance` shows how to combine them, including `convertTotalRaisedToSingleCurrency`.
- `fundraiser.hosts` holds public, active hosts only (see the comment in `fundraiser-hosts-card.tsx`).
- `qrcode` is already a dependency.
- The Share tab builds tagged links with `utm_source` and `utm_medium` (`share-links.tsx`).
- The fundraiser accent lives in `fundraiser.settings.theme`. `getAccentColor` in `src/lib/theme/accent-utils.ts` turns it into a hex.

## What the Report Shows

Top to bottom, on one A4 portrait page:

1. Header: the site logo on the left (its "PLANTING" word in the ink color, see Accent below), "Campaign insights" on the right with one line under it: date range in bold, then "Generated on <date and time>".
2. Title, then "by <public hosts>". Two names at most, then "and N others". Never a host marked hidden from public.
3. Four tiles in one row, with two captions above them: "Campaign total" over Raised so far (with a progress bar and "% of goal") and Donors (with donation count), and the chosen range (for example "Last 30 days") over Visitors and Page views. The captions make clear that raised and donors are totals while the rest follows the range. Change badges show only when the period before had data.
4. Visitors chart. Few buckets (up to 10): a value above each bar and a label under each bar. Many buckets: only the peak value is printed and only three axis labels (first, middle, last), because labels under 30 thin bars get clipped.
5. Donation journey: Visited, Clicked Donate, Submitted, Paid. One compact row of four columns. Each has a bar (filled part is the share of visitors), the count, and the percent. No summary line above it.
6. Two lists side by side: top countries and top sources. Top 4 each, plus one "Other" row. See "Other rows" below.
7. Footer: short accuracy note, the fundraiser link with a link icon, and a QR code (about 64px) at the bottom right.

Left out on purpose: the status pill (it is stale the day after printing), the "share tagged links" hint, the tagged links list, and any "% paid" headline.

## Design Decisions

- **Range**: the PDF follows the range selected on the Insights tab and passes it as `?range=`.
- **Accent**: bars and the goal bar use the fundraiser accent. The logo's "PLANTING" word uses an "ink" version: the accent mixed towards black only as far as needed to reach AA contrast on white (`readableInk`), so a pale accent like `#f5abab` still reads. All other text is fixed grey or black.
- **No outlines on bars.** Decided in review: they looked wrong. Very pale accents print faint in grayscale. If that matters, darken pale accents a little when drawing bars.
- **Language and locale**: follows the host's UI locale (next-intl). Numbers and dates use `Intl`. Paper is A4.
- **Generated on** is the moment the page renders, not the Umami snapshot time.
- **Other rows**:
  - Countries: "Other countries" is total visitors minus the top 4 (clamped at 0). The API only returns the top 6, so summing hidden rows would undercount. This also includes visitors with an unknown country.
  - Sources: "Other" is the sum of the hidden known rows.
- **QR link**: `<origin>/raise/<slug>?utm_source=report&utm_medium=print`. Same shape as the Share tab links. Add `report` to the known source names in `insights-audience.tsx` (and its translations) so it reads as "Printed report" under "From your tagged links".
- **Paid step**: the `donation_completed` event fires for a paid card or wallet payment and a confirmed SEPA mandate. A pending bank transfer does not fire it. A fundraiser can show donations on the platform and 0 in this step (Nepal shows 8 submitted, 0 paid, 4 donations). Open question below.

## Steps

### Step 1 - Pure helpers and tests

**What:** Small pure functions in `src/lib/analytics/insights-report.ts`, with tests next to it (Vitest, like `insights-buckets.test.ts`):

- `parseReportRange(value)`: a known range, or 7 days for anything else.
- `splitTop(rows, limit)`: shown and hidden rows (limit 4).
- `otherCountryVisitors(visitors, shown)`: visitors minus the shown countries, clamped at 0.
- `sumVisitors(rows)`: used for the sources "Other" row.
- `axisLabelIndexes(count)`: every bar when 10 or fewer, otherwise first, middle and last.
- `valueLabelIndexes(buckets)`: every bar when few, otherwise only the busiest. Day bars built from hours (the 7 day range) also get only the busiest, because their values can add up to more than the Visitors tile.
- `publicHostsLine(hosts)`: public, active hosts only, in displayOrder (unset last), two names, then a count of others.
- `funnelSteps(visitors, eventVisitors)`: the four steps with a percent of visitors, capped at 100.
- `goalProgress(raised, goal)`: an uncapped percent for the label, and a bar that stops at full and keeps a sliver for a tiny amount.
- `readableInk(accent)`: the accent darkened just enough to read on white.
- `reportLink(origin, slug)`: the tagged QR link.

**Files:** `src/lib/analytics/insights-report.ts`, `src/lib/analytics/insights-report.test.ts`

**Test:** `npm run test`.

### Step 2 - Share the chart helpers

**What:** `formatBucket` and `bucketDate` were private to `fundraiser-insights-card.tsx`, and the period text was written out in `PeriodLabel`. Move them into `src/lib/analytics/insights-buckets.ts` (already the home of bucket logic) as `formatBucket` and `formatPeriod`, and use them in both the card and the report. No behavior change.

**Files:** `src/lib/analytics/insights-buckets.ts`, `src/components/dashboard/fundraiser-detail/fundraiser-insights-card.tsx`

**Test:** `npm run test`, `npm run type-check`. Insights tab looks the same.

### Step 3 - Print route and shell

**What:**

- New route `src/app/(print)/dashboard/fundraisers/[slug]/insights/print/page.tsx`, in a new `(print)` route group whose layout adds nothing, so there is no site header, footer or dashboard menu. It still sits under the root layout.
- A small `FundraiserPrintShell`: `AuthGuard` plus `useHostedFundraiser(slug)`, the same auth path as `FundraiserDetailShell`. It passes the fundraiser to the report as a prop, so no `FundraiserDetailContext` is needed. Loading, not found and unauthorized states reuse the same messages.
- Return `notFound()` when `isUmamiStatsConfigured()` is false, like the Insights page.
- Screen view: a centered A4 sheet (`210mm x 297mm`) on a gray backdrop, with a toolbar (Print or Save as PDF, Back) that is hidden when printing.
- The sheet themes itself without the full ThemeShell: CSS variables on the sheet carry the accent (`--report-accent`), the ink for the logo (`--accent-color`) and the title font, from `buildTheme(fundraiser.settings?.theme)` and `getAccentColor`.

**Files:** new route and layout under `src/app/`, `src/components/dashboard/fundraiser-detail/fundraiser-print-shell.tsx`

**Visual test (reviewer):** open `/dashboard/fundraisers/<slug>/insights/print` as a host. Only the sheet and toolbar show. A non host sees the unauthorized message.

### Step 4 - The report component

**What:** `InsightsReport` renders sections 1 to 7 above from `useFundraiserInsights` plus the fundraiser data. Print CSS in the same component or a small module: `@page { size: A4; margin: 0 }`, `print-color-adjust: exact` (bars are backgrounds and drop out without it), fixed sheet height with overflow hidden, and no shadows or rounded page border in print. Clamp the title to two lines. Generate the QR with `QRCode.create(url)` and draw its cells as one inline SVG path, in a `useMemo`.

**Files:** `src/components/dashboard/fundraiser-detail/insights-report/` (report, tiles, chart, funnel, lists, footer), print styles

**Visual test (reviewer):** compare with both design artboards. Test with a 7 day fundraiser with few visitors, a 30 day one with six countries, a very long title, and a pale accent. Nothing may be cut off at the bottom. Then "Save as PDF" from the browser and check the file is one page.

### Step 5 - Translations

**What:** New keys under `Dashboard.fundraiser.insights.report` in `locales/en` and `locales/de`: tile labels, "by", "and N others", "Generated on", "Other countries", "Other", funnel step names, the shortened accuracy note, toolbar buttons. Use `t.rich` for any inline element. Add `sources.report`. After editing, run `npm run build` so the generated locale types refresh before trusting `npm run type-check` (see Gotchas in CLAUDE.md).

**Files:** `locales/en/*.json`, `locales/de/*.json`, `src/components/dashboard/fundraiser-detail/insights-audience.tsx` (add `report` to `KNOWN_SOURCES`)

### Step 6 - Entry point

**What:** A "Download PDF" button (outline, small, open-in-new-tab icon) in the Insights card header next to the range tabs. It opens the print route in a new tab with the current range, for example `.../insights/print?range=30d`. It always shows, also while loading or on error: the print page loads its own data, so it does not depend on the card. The print page validates `range` against `INSIGHTS_RANGES` and falls back to `7d`.

**Files:** `fundraiser-insights-card.tsx`

**Visual test (reviewer):** button shows on desktop and mobile widths, opens the right range.

### Step 7 - Docs

**What:** Add a "PDF report" section to `docs/insights.md`: where it lives, that it reuses the insights route, the QR and `utm_source=report`, the Other row rules, and the print CSS notes. Mention the Cloudflare option as a later idea with its login caveat.

**Files:** `docs/insights.md`

### Verification

Per CLAUDE.md: `npm run type-check`, `npm run lint`, `npm run test`, and `npm run build` after locale edits. No dev server or browser check from the agent. The reviewer checks the UI using the visual tests above.

## Decided During Build

- **Range**: the PDF follows the range picked on the Insights tab.
- **Raised and donors**: shown as totals since the start, labelled "Campaign total", next to range based traffic. A per period version would need donations by date from the platform.
- **Hosts**: the "by" line only names public, active hosts.
- **Download PDF button**: always shown, not hidden while the card loads or after an error, because the report fetches its own data. The trade-off: during a lasting failure (Umami down), the button opens a report that fails the same way.

## Open Questions

1. **Paid step**: keep the label "Paid" and accept undercounting, rename it (for example "Paid online"), or add a one line note under the funnel? A fundraiser can show 0 there while the platform lists donations.
2. **Entry point**: should "Download PDF" also appear on the Overview tab, or only on Insights?

## Risks

- **Page overflow**: content height varies with title length, list rows and footer text. The design caps lists at 4 plus Other and clamps the title to two lines, but this needs a real check with awkward data.
- **Browser differences**: `@page` and `print-color-adjust` behave a little differently across browsers. Check Chrome and Safari at least.
- **Umami numbers are a guide**: the footer keeps a short version of the accuracy note.
