# Host dashboard

Where hosts manage their fundraisers: see how they are doing, who gave, where visitors come from, and what to do next.

The original build plan for the first dashboard (header, summary tiles, list, toolbar, row actions) is in git history. This page describes how the dashboard works now.

For Umami page views and donation events, see [insights.md](./insights.md).

---

## Routes

| Route | What it shows | Menu |
| --- | --- | --- |
| `/dashboard` | Overview: stats strip, pending host invitations, latest 2 fundraisers | Overview |
| `/dashboard/fundraisers` | The full list with search, status filter and sort | Fundraisers |
| `/dashboard/fundraisers/[slug]` | One fundraiser: stats, "Make it a success" checklist, hosts, features | Fundraisers |
| `/dashboard/fundraisers/[slug]/donors` | Donors and donations, paged | Fundraisers |
| `/dashboard/fundraisers/[slug]/insights` | That fundraiser's visitors, donation journey, countries, sources | Fundraisers |
| `/dashboard/fundraisers/[slug]/share` | Tagged share links per channel | Fundraisers |
| `/dashboard/insights` | All your fundraisers combined, a ranking, or one picked from a list (`?fundraiser=<slug>`) | Insights |
| `/dashboard/fundraisers/edit/[slug]` | The editor (no menu, full width) | none |

Both Insights routes, and the Insights menu item and tab, only exist when Umami is set up (`UMAMI_API_KEY`). Without it they return a 404 and are hidden.

Fundraiser URLs use the slug. Renaming a fundraiser changes its URL; the editor already redirects to the new slug.

---

## Layout and route groups

```
src/app/(standard)/dashboard/
  layout.tsx                      metadata only (noindex)
  (menu)/layout.tsx               DashboardShell: left menu + content
    (home)/layout.tsx             DashboardFundraisersProvider (shared list)
      page.tsx                    /dashboard
      fundraisers/page.tsx        /dashboard/fundraisers
    fundraisers/[slug]/layout.tsx FundraiserDetailShell (header + tabs)
      page.tsx, donors/, insights/, share/
    insights/page.tsx             /dashboard/insights
  fundraisers/edit/[slug]/        the editor, outside (menu) on purpose
```

- The dashboard sits inside the standard 960px frame, like other pages. The menu takes part of that width.
- `(menu)` holds the menu. The editor is outside it because the editor and its live preview need the full width.
- `(home)` shares one fundraiser list between Overview and Fundraisers, so moving between them does not refetch.

### The menu (`DashboardShell`, `DashboardNav`)

- Items: Overview, Fundraisers, Insights (only with Umami).
- Collapsed to an icon rail by default. The choice is remembered per browser (`localStorage`, `use-menu-collapsed.ts`); the server renders the default.
- Rows have a fixed height and padding, so icons stay in place when the menu is toggled. The toggle is instant; a width animation would reflow the content on every frame.
- On small screens the same menu sits above the content: a row of icons plus the toggle when collapsed, the full list with labels when expanded. It shares the collapse setting with desktop.
- Starting a fundraiser is in the site header ("Start Fundraiser"), not in the menu.

### Theme

The dashboard has its own theme, `dashboard` in `src/lib/theme/themes.ts`: a light indigo-to-sky wash, a faint dot pattern, and an indigo accent. `route-themes.ts` maps `/dashboard` to it.

Chart bars, icons, links, chips and the active menu item use the theme's `--accent-color` directly (`bg-accent-color`, `text-accent-color`). The shadcn `Button` is hard-wired to `primary`, so `DashboardShell` also mirrors the accent into `--primary`, on its wrapper and on `<html>` while the dashboard is open (dialogs and menus portal to `<body>`). To change the dashboard colour, change the theme's `accent`.

Green stays reserved for status (live, going up) and red for going down, so the accent is deliberately not green.

---

## Overview (`/dashboard`)

- **Stats strip** (`StatStrip`, shared with the fundraiser Overview): Total raised, Donations, Active fundraisers, and, with Umami, Visitors this week with the change against last week.
  - The strip knows up front whether the views cell exists, so the loading skeleton has the same shape as the loaded strip (2 by 2 on small screens, 4 across on desktop).
- **Pending invitations** to co-host, with accept and decline.
- **Active fundraisers**: up to 2 live fundraisers, newest first, with "View all". When nothing is live, it shows the 2 newest as "Latest fundraisers".

## Fundraisers (`/dashboard/fundraisers`)

The list with search, status pills and sort. Clicking a fundraiser opens its dashboard page (not the public page). The row menu has View page, Edit, Duplicate, Stage Mode, Share, Pause or Resume, and Delete, depending on status and role.

The toolbar uses container queries rather than screen breakpoints, because the menu takes part of the width.

---

## One fundraiser (`/dashboard/fundraisers/[slug]`)

### Who can see it

Every active host of the fundraiser, including view-only co-hosts. Only owners and admins can edit.

`useHostedFundraiser` loads the fundraiser with the host's token and checks it is in the platform's list of fundraisers the caller actively hosts. That list also carries every host, including private ones (the single-fundraiser payload only has public hosts), so its hosts are used.

For view-only co-hosts, the edit actions are hidden: the header's Edit button, the checklist's Fix and Invite buttons, the features' Turn on and Manage buttons, and the Hosts card's Invite button. Sharing stays available.

### Overview tab

- **Stats strip**: Raised (with % of goal), Donations, Donors, Avg. donation value.
- **Make it a success**: cover image, story (200 characters of text, or 100 with a picture or video), goal, published, a co-host who has accepted, first donation. Logic in `src/lib/utils/fundraiser-checklist.ts`. When every step is done and the fundraiser takes donations, it nudges to the Share tab.
- **Hosts**: active and invited hosts, with Invite co-host (opens the existing Manage hosts dialog). The checklist's co-host step opens the same dialog.
- **Features**: Leaderboard, Thank-you note, Stage Mode, each On or with a Turn on link to the editor.

### Donors tab

Data comes from the public leaderboard endpoints (`/fundraisers/:id/leaderboard/{recent|top}`), the same as the public "Show all donations" overlay.

- **Donors** (default, listed first) when the leaderboard groups top donors per person (`aggregate_top_by_donor`). Otherwise that tab is "Top donations" and Donations is the default.
- **Donations**, newest first, with a toggle for oldest first.
- 20 per page, "1–20 of 1,215" with round previous and next buttons, at the top and bottom.
- Anonymous donors are masked by the platform, so they show as "Anonymous" here too.

Oldest first reads the newest-first list from the end (`src/lib/utils/reverse-pages.ts`), at most 2 API pages per page, so pages stay full and the range label stays true.

The API cannot sort by name or amount, filter out anonymous donors, or search. Those need a platform change (see Platform requests).

### Share tab

Pick a channel (Plain link, WhatsApp, Instagram, LinkedIn, Facebook, Email, Newsletter) and copy one link. Tagged links add `utm_source` and `utm_medium`, the same shape as the Stage Mode QR code, so Insights can tell channels apart.

Every host-facing "Share" button leads here: the checklist, the donors empty state, and the row menu. The public page's "Copy Link" stays a plain copy, because visitors use it too.

This tab is built as cards so story images or post templates to download can be added later.

---

## Status: what "active" means

The platform can leave a fundraiser `active` after its end date, with donations closed. The public page already calls that ended (`hasFundraiserConcluded`), and the dashboard does too.

One rule, `getStatusBucket` in `src/lib/utils/fundraiser-list.ts`, drives the badge, the status filter, the filter counts and the Active fundraisers stat. `isLiveStatus` and `isFundraiserLive` are the shared "live right now" checks.

---

## Delete action

`DELETE /fundraisers/{id}` succeeds in one of two shapes, and the UI treats them the same:

| Response | Backend meaning | UI |
| --- | --- | --- |
| `204 No Content` | No donations, hard-deleted | Row removed |
| `200 OK` with `{ "status": "archived" }` | Had donations, archived | Row removed |

The list API does not return archived fundraisers, so there is no client-side filter for them. While the request runs, the dialog cannot be dismissed. On error the dialog stays open with a toast. On success the row and its dialog go, and the stats (derived from the list) update.

---

## Edge cases

| Scenario | Behavior |
| --- | --- |
| No fundraisers | Toolbar hidden, empty state with a create button. Stats show zeros. |
| Search or filter matches nothing | "No results" with Clear filters. |
| Several currencies | Total raised is one amount in the dominant currency, converted with `convertTotalRaisedToSingleCurrency`. |
| Active, but past its end date and closed to donations | Counted and shown as **Ended** (see Status). |
| End date 7 days away or less | "Ending soon" badge; still counted as Active. |
| Fundraiser has no donations | Donors tab shows an empty state; the Share button only shows while it takes donations. |
| View-only co-host | Sees every dashboard page; edit actions hidden. |
| Clipboard not available | Error toast. |
| Pause, resume or delete fails | Toast; local state unchanged. |

---

## Platform requests

Things the dashboard would do better with platform support:

1. **Sorting and filtering on the leaderboard endpoints**: `sort` (name, date, amount), `order`, `anonymous=exclude|only`, and name search.
2. **Daily donation stats**: `GET /fundraisers/:id/stats/daily` (count and amount per day), for a donations-over-time chart.
3. **Status transition**: move fundraisers to `completed` after their end date, so `status` is correct on its own.
