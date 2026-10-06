# Insights (Umami)

How the dashboard shows page views, visitors, donation events, countries and sources from our self-hosted Umami.

Where it shows up:

- **Overview**: "Visitors this week" across your fundraisers.
- **A fundraiser's Insights tab**: visitors over time, donation journey, countries, sources.
- **Insights page** (`/dashboard/insights`): all your fundraisers combined, a ranking, or one fundraiser picked from a list.
- **PDF report**: a one page A4 print of a fundraiser's Insights, opened from a button on its Insights tab. See [PDF report](#pdf-report).

The dashboard layout is described in [dashboard-page.md](./dashboard-page.md).

---

## Setup

| Variable | Where | What |
| --- | --- | --- |
| `NEXT_PUBLIC_UMAMI_URL` | public, optional | The Umami instance, also used by the tracker. Defaults to `https://insights.startplanting.org` when unset or empty. |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | public | The website the tracker reports to |
| `UMAMI_API_KEY` | **server only** | API key for reading stats |
| `UMAMI_STATS_WEBSITE_ID` | server only, optional | The website to read stats from, when it differs from the one this box reports to (for example, reading production stats locally) |
| `COLLECT_INSIGHTS` | server only, optional | `true` (default) or `false`. With `false`, this box stops sending visits and donation events to Umami (`0`, `off` and `no` also count as false). Insights keep working, since they only read stats. |

- Create the key as a dedicated **view-only** Umami user added to the website's team. Umami keys act with the user's full permissions and never expire, so a view-only user keeps a leaked key harmless beyond reading stats.
- Never prefix the key with `NEXT_PUBLIC_`. Next.js would bundle it into the browser code.
- Locally, `COLLECT_INSIGHTS=false` with the production website id lets you see real numbers without counting your own visits.
- Without `UMAMI_API_KEY`, every Insights route returns a 503, the Insights pages return a 404, and the Insights menu item, tab and Overview cell are hidden. The check runs on the server (`isUmamiStatsConfigured`).

---

## How requests flow

The browser never talks to Umami. It calls our own routes, which call Umami with the key.

| Route | Used by |
| --- | --- |
| `GET /api/fundraisers/[slug]/insights?range&tz` | A fundraiser's Insights |
| `GET /api/insights/account?range&tz` | The Insights page |
| `GET /api/insights/summary` | Overview, Visitors this week |

Each route first runs `getHostedFundraisersForInsights` (`src/app/api/_lib/hosted-fundraisers.ts`):

1. Umami is configured, or 503.
2. The request carries the host's platform token, or 401.
3. The platform lists the fundraisers the caller actively hosts (view-only co-hosts included), or 401 or 502.

Routes only ask Umami about slugs from that list, never about a slug from the request alone. A fundraiser that is not yours gets the same 404 as one that does not exist, so the route cannot be used to probe slugs. Slugs must also match `^[a-z0-9-]+$` before they reach Umami, because Umami reads a comma in the path filter as "or this other path".

---

## What is counted

All numbers filter on the fundraiser page path, `/raise/<slug>`. The fundraiser page is served at one URL per fundraiser, and Stage Mode is not tracked, so this counts real visits.

| Number | Umami call |
| --- | --- |
| Visitors and page views, with the period before | `stats` with `path` |
| Visitors per hour, day or month | `pageviews` with `unit` and `timezone` |
| Donation journey (clicked, submitted, completed) | `metrics/expanded?type=event` with `path`, using `visitors` |
| Countries, sources, channels, tagged links | `metrics?type=country`, `referrer`, `channel`, `utmSource` |
| Ranking: visitors per fundraiser | one `metrics?type=path` call for the whole site, filtered on our server. This metric counts visitors, not page views. |
| Ranking: visitors who clicked Donate and who submitted, per fundraiser | `event-data/values` on the event's `fundraiser` property finds the fundraisers with any donation step (one call per event), then one `metrics/expanded?type=event` call per such fundraiser |
| Overview, visitors this week | `stats` with the comma-joined paths, this week and the week before |

Notes:

- **Combined numbers**: comma-separated paths mean "any of these", and Umami counts each visitor once across them, so one request covers up to 40 fundraisers. Larger lists are split into groups of 40 and added up, which counts a visitor twice if they saw fundraisers in two groups.
- **Ranking limits**: two columns of the ranking read site-wide lists from Umami and keep only your fundraisers. Visitors come from the top 1,000 visited pages on the whole site (`metrics?type=path&limit=1000`). Clicked Donate and Submitted are only counted for fundraisers that `event-data/values` returns, and that endpoint has its own limit in Umami. A fundraiser outside either list shows 0 in that column (so its rates show "–" or 0%), with no warning, while its own Insights tab still shows the right numbers. This is far off today (fewer than 10 fundraisers, a few dozen visited pages). If the site gets close, ask Umami per fundraiser instead, the way a fundraiser's own Insights tab does.
- **Sources**: referrer hosts are grouped into platforms (`com.linkedin.android` counts as LinkedIn, `l.instagram.com` as Instagram), and sign-in redirects are dropped (`src/lib/analytics/referrer-sources.ts`). Visits with no referrer, including WhatsApp and most apps, show as "Direct or apps".
- **People, not events**: the donation journey, click rate and conversion count visitors who sent an event at least once, not how often it fired. One person can press Donate several times, so event counts divided by visitors went over 100%. `metrics/expanded` returns both: `pageviews` is how often the event fired, `visitors` is how many people sent it. Rates are capped at 100% for the rare event whose page view fell just before the window.
- **Conversion** in the ranking is visitors who submitted a donation, as a share of visitors. The completed event undercounts, because some payment flows leave the page before it is sent.
- **Change** ("+54%") is (this period − the period before) ÷ the period before. It is hidden when the period before had nothing.

- **Accuracy**: a note under both Insights pages says visitor numbers and donation steps are a guide, not exact. Umami runs without cookies and does not count people who block trackers. Amounts raised and donation totals come from the platform; donations by direct debit or bank transfer count once the payment arrives, so they can show up a few days later.

### Time windows

- Ranges: 24 hours (hourly bars, rolling), 7 days and 30 days (daily bars), and on a single fundraiser, Campaign: start date to end date, or to today while it runs. Campaigns longer than 90 days use monthly bars.
- 7 days and 30 days start at midnight in the host's timezone: today so far plus the full days before it, so they show exactly 7 or 30 bars. "vs before" compares with a window of the same length just before.
- 7 days asks Umami for hours instead of days and adds them up into day bars, so each light day bar can show its 24 hours inside it, with the busiest hour in the tooltip. Same number of requests as the daily series. Views add up exactly. Day visitors are summed per hour, so someone who comes back later that day counts twice. The headline numbers come from Umami's own count and stay exact.
- Umami labels each bucket with the local time in the requested timezone but writes it with a `Z`. The label is matched as text, never parsed as UTC (`src/lib/analytics/insights-buckets.ts`). Days with no views are filled with zeros.
- Umami only has data from when tracking started (September 2026), so a Campaign view for an older fundraiser shows empty months before that.
- A renamed fundraiser starts fresh, because views are stored by path.

---

## Caching

Numbers are a snapshot, not realtime. How often a snapshot is taken depends on the range (`SNAPSHOT_MINUTES` in `umami-stats.ts`):

| Range | Snapshot |
| --- | --- |
| 24 hours | 5 minutes, since this is what hosts watch live, for example during an event |
| 7 days, 30 days, Campaign | 30 minutes |
| Overview, Visitors this week | 30 minutes |

1. **Umami answers** are kept in the Next.js data cache for one snapshot (`cache: 'force-cache'` with `revalidate`). The window end snaps to the last full snapshot, so the request URL (the cache key) stays the same for everyone during that snapshot and all hosts share one answer. Umami is only queried when someone looks, at most once per snapshot per fundraiser and range.
   - `force-cache` is required. Next.js does not cache requests that send an `authorization` header unless asked to, and the Umami calls send the key that way.
   - Only responses are stored; the key is not written to the cache.
2. **The platform check** is never cached. It runs on every request with the caller's token, so access is always current. While staff impersonate a host, the browser also forwards `x-switch-user` and `x-user-support-pin`, since the impersonation lives in localStorage and our server cannot see it. The check then lists the host's fundraisers.
3. **The browser** does not keep our responses (`Cache-Control: private, no-store`). The answer depends on who is signed in, but the browser cache keys on the URL only, not the `Authorization` header. So after a sign-out and sign-in, or an account switch, a kept response would show the previous account's numbers. The server cache in step 1 already makes repeat calls cheap.

The period line on each card shows the window and when the snapshot was taken: "Sep 17 – 24, 2026 · 10:30 PM".

---

## Tagged links

The Share tab builds links like `/raise/<slug>?utm_source=whatsapp&utm_medium=messaging`. They show up under "From your tagged links" on Insights. Same shape as the Stage Mode QR code: a source and a medium, no campaign.

---

## PDF report

A host can print or save a one page A4 report of a fundraiser's Insights, to hand to family, a company or a club. The plan and the design decisions are in [plans/insights-pdf.md](./plans/insights-pdf.md).

There is no PDF library and no server side rendering. The report is a normal web page sized to A4, and the browser's Print dialog turns it into a PDF ("Save as PDF"). The QR code is drawn as an SVG path from the `qrcode` package.

- **Where**: `/dashboard/fundraisers/[slug]/insights/print?range=7d|24h|30d|campaign`, in the `(print)` route group so it has no site header, footer or dashboard menu. The "Download PDF" button on the Insights card opens it in a new tab with the range on screen. An unknown range falls back to 7 days.
- **Access**: the same as the Insights tab. The page checks sign in and hosting in the browser (`FundraiserPrintShell`), and the numbers come from the same `GET /api/fundraisers/[slug]/insights` route, so there is no new API and no new access rule. Without an Umami key the page is a 404, like the tab.
- **Content**: raised so far (with goal progress), donors and donations, visitors and page views for the range, a visitors chart, the donation journey, top countries and sources, an accuracy note, the fundraiser link and a QR code. Raised and donors are totals since the start, so the tile row has two captions: "Campaign total" over those two and the range (for example "Last 30 days") over visitors and page views. The chart, journey, countries and sources follow the range too.
- **Hosts**: the "by" line names public, active hosts only, in the same order as the public page (displayOrder, unset last), two at most, then "and N others". A host marked hidden from public never appears.
- **Lists**: countries and sources show the top 4 plus one "Other" row. "Other countries" is total visitors minus the shown countries, because the API only returns the top few. That also counts visitors whose country is unknown. "Other" for sources is the sum of the hidden rows.
- **Chart**: up to 10 bars get a value and a label each. With more bars only the busiest one is printed and the axis has three labels (first, middle, last). The 7 day bars are built from hourly numbers, so a person who came back later the same day counts twice. Their values would not add up to the Visitors tile, so only the busiest bar is printed there too.
- **Theme**: bars and the goal bar use the fundraiser accent, and the report uses the theme's body and title fonts. Text, including "PLANTING" in the logo, uses a darker version of the accent (`readableInk`), mixed towards black only as far as needed to read on white. An accent that already reads is used as it is.
- **Goal**: the percent is not capped, like the Overview tab, so a passed goal reads 180%. Only the bar stops at full.
- **File name**: the page title is "<fundraiser title> - Insights report", which browsers suggest as the PDF file name.
- **QR link**: `/raise/<slug>?utm_source=report&utm_medium=print`. Visits from a printed report show up in "From your tagged links" as "Printed report". The tokens are listed in [naming.md](./naming.md#utm-parameters).
- **Print CSS**: `@page { size: A4; margin: 0 }`, colours forced on (`print-color-adjust: exact`), and everything except the sheet hidden when printing, so banners and toasts never reach the paper. The sheet is 296mm tall in print so rounding does not push a blank second page. Content that does not fit is cut, not carried over, so keep titles and lists capped.
- **Funnel**: the donation journey is one row of four steps (Visited, Clicked Donate, Submitted, Paid), each with a bar filled to its share of visitors, its count and its percent. A real count that rounds to 0% shows as under 1%. The Insights tab and the PDF share one component (`InsightsFunnel`), so they always read the same.
- **Paid step**: the last funnel step is `donation_completed`, shown as "Paid". It fires for a paid card or wallet payment and a confirmed SEPA mandate, but not for a pending bank transfer, so it can show 0 while the platform lists donations.
- **Later**: emailed or scheduled PDFs would need server side rendering, for example Cloudflare Browser Rendering pointed at this page with a short lived signed link, since the page sits behind login.

The pure helpers (list caps, axis labels, funnel steps, hosts line, ink colour, QR link) live in `src/lib/analytics/insights-report.ts` with tests.
