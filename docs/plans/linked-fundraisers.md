# Linked Fundraisers (module)

> Status: plan, nothing built yet.
> Builds on the Duplicate action (#345, merged), which is how a linked sibling gets created in practice.

## What it is

Several fundraisers that are really one campaign, shown as one campaign.

The two cases we know we have:

- **One campaign in several languages.** A fundraiser is always written in one language. A German and an English page are two records, linked, sharing a total.
- **One campaign in several places.** Ten schools or five cities, each with their own page and their own hosts, rolling up into a national total.

A viewer on any member page sees the group's raised amount, the group's donation count, and a merged leaderboard. Each member keeps its own URL, its own words, its own image, and its own hosts.

## What it is not

Not a translation layer. We considered per-locale content (a locale-keyed map, or inline `<locale:xx>` tags in title and description) and rejected it: hosts write in one language at a time, and the fundraiser page already carries a locale. See the decision trail in PR #345.

Not a way to split one goal into sub-goals. The goal shown on a page is that page's own goal (see below).

## Data model

A module, so it lives at `fundraiser.settings.modules.linked`, per [src/modules/README.md](../../src/modules/README.md).

```ts
export interface LinkedModuleSettings {
  enabled: boolean;
  /** Slugs of every other fundraiser in this group. Never includes itself. */
  members: string[];
  /** What this member is for, shown in the switcher. Free text, host-set. */
  label?: string;
}
```

`label` is what the language or place switcher shows ("Deutsch", "München"). It is deliberately not derived from a locale field: the place case has no locale, and a host naming their own page reads better than a generated label.

### Why the member list is duplicated on every member

The alternative is one primary record owning the list, with members storing a pointer to it. That halves the write problem (joining a group is two writes, not N) but forces a serial read: fetch the primary, learn the members, then fetch them.

Reads are far more frequent than writes here, and the public page is server-rendered where a waterfall costs real latency. So every member carries the full list and all siblings are fetched in parallel.

The cost is write consistency: adding a member to a group of three is three `PUT`s that can half-fail. Two mitigations:

- **Read-time verification, which is free.** We fetch every sibling anyway to read its totals, and each sibling's payload carries its own `members` list. Any sibling that does not list us back is dropped from the group for that render. A half-written group degrades to a smaller correct group, never to a wrong total.
- **A repair action in the settings panel** that rewrites every member's list from the one the host is looking at.

A server-side group resource would remove the problem outright. Worth asking for, not worth blocking on.

## Aggregation, surface by surface

The important design point: **do not invert the dependency rule.** Core must not learn to ask a module for its numbers. Instead the module hands core an already-aggregated `Fundraiser`, at the boundary, on the surfaces that want one.

[`fundraiser-view.tsx:52`](../../src/components/fundraisers/fundraiser-view.tsx) computes raised and progress from `fundraiser.totalRaised` and `fundraiser.goalAmount` in one place. If those arrive aggregated, every downstream component works unchanged.

| Surface                   | What happens                                                                                                                                                                                                                                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public page totals        | The page calls a module server helper after `getCachedFundraiser`, which fetches the siblings and returns a fundraiser whose `totalRaised` and `donationCount` are group sums. `convertTotalRaisedToSingleCurrency` already handles mixed currencies via `FLOOR_RATES`, so a DE plus CH group converts into the viewed page's currency with no new code. |
| Goal and progress         | Untouched. The goal stays the viewed fundraiser's own, per the product decision. Progress becomes group-raised over this page's goal.                                                                                                                                                                                                                    |
| Leaderboard               | The real work. `getLeaderboardByTab` is per fundraiser and paginated, so a merged list cannot be assembled from page N of each member. Over-fetch `page * limit` from every member, merge, sort, slice. Fine at two or three members, degrades beyond. `aggregate_top_by_donor` also has to dedupe donors across records.                                |
| Language / place switcher | The visible payoff, and the reason to build this at all. A row of links to the siblings, labelled by their `label`. Renders on the public page near the title.                                                                                                                                                                                           |
| Explore                   | Group members would each appear as their own card. Show one per group: prefer the member whose language matches the reader, else the one the host marked.                                                                                                                                                                                                |
| Stage Mode                | Polls one slug per interval ([use-leaderboard.ts](../../src/modules/stage/hooks/use-leaderboard.ts)). A group multiplies that by N. Acceptable at small N; decide whether stage aggregates at all, or deliberately shows one member.                                                                                                                     |
| Dashboard                 | Each row keeps its own numbers. A row belonging to a group gets a small marker, nothing more. Aggregating here would hide which page is actually doing the work.                                                                                                                                                                                         |

## Phases

1. **Settings and switcher.** The module, its settings type, the admin panel to link and unlink, and the switcher on the public page. No aggregation yet. On its own this already ships the language-switching story.
2. **Totals.** The server helper that sums `totalRaised` and `donationCount` across verified members, wired into the public page and nothing else.
3. **Leaderboard merge.** The over-fetch, merge, dedupe path.
4. **Explore dedupe.** One card per group.
5. **Stage, if wanted.**

Phases 1 and 2 are the ones with product value. Everything after is polish that can wait for real usage to justify it.

## Open questions

**How does a host link two fundraisers?** Picking from their own hosted list is the obvious flow, but a group can span hosts (the ten schools case), where nobody can see every member. Probably: link by slug or URL, with the other side accepting. That is an invite flow, and it is more work than it sounds.

**Who may link?** Linking changes what a viewer sees on someone else's page. An admin of both sides is the safe answer; anything looser needs the accept step above.

**What happens to a group when one member is deleted or archived?** Read-time verification handles it silently (the member stops listing back, or stops resolving), but the remaining members keep a stale slug in their list until someone repairs it.

**Does a donor on the German page appear on the English page's leaderboard?** Implied yes by a merged leaderboard, and worth confirming with whoever owns donor privacy, since the two pages may have different audiences.

## Backend asks

Collected here so they can go over in one conversation:

- A group resource, so membership is one write and one read instead of N and N.
- A leaderboard endpoint that accepts several fundraiser ids, which removes the over-fetch entirely.
- The two asks already raised by the clone work: add-host-by-user-id, and a server-side clone.
