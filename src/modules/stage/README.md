# Stage Mode

A read-only fullscreen display for live fundraiser events — designed to run on a TV or projector while a concert, gala, or talk is happening. Donors give via QR code; the screen reacts in real time.

> This is a **module**. See [`../README.md`](../README.md) for module conventions before editing.

---

## Route

```
/raise/[id]/stage
```

Public — no auth required. Any device with a browser can load it.

**Casting:** Share the URL and open on any browser-capable device (Chromecast with Google TV, Fire Stick, Apple TV, smart TV browser). No app or SDK needed.

**Not enabled:** If `modules.stage.enabled !== true`, the page shows: _"Stage Mode is not enabled for this fundraiser."_

---

## Registration

Module metadata is declared in [`module.ts`](./module.ts):

```ts
stageModule = {
  id: 'stage',
  settingsKey: 'stage',          // FundraiserSettings.modules.stage
  localeNamespace: 'stage',      // /locales/<locale>/stage.json
  route: { segment: 'stage' },   // /raise/[slug]/stage
}
```

The settings type ([`StageModuleSettings`](./settings.ts)) is registered in [`src/modules/index.ts`](../index.ts) under `FundraiserModules` so the central fundraiser type composes it without reaching into stage. The module is in `registeredModules`, which the i18n loader walks to include `stage.json` automatically.

---

## Config

Stored under `fundraiser.settings.modules.stage`.

```ts
interface StageModuleSettings {
  enabled: boolean;

  title?: string; // Falls back to fundraiser.title
  description?: string; // Falls back to fundraiser.description (first paragraph)
  partner_logo_url?: string; // PNG, 56×56, optional — shown in top bar

  locale?: string; // Fixed display locale ("en" | "de"). Independent of the viewer's app locale.

  slides: {
    position: number; // Display order (1-based)
    title: string;
    description?: string;
    image?: string; // JPG or PNG URL
    duration: number; // Seconds per slide. Default: 8
  }[];
}
```

The stage locale is resolved from `modules.stage.locale`, falling back to the organizer's selected app locale (`ui-locale` cookie). Because this can differ from the locale used to render the rest of the app, `StagePage` wraps `StageView` in a second `NextIntlClientProvider` scoped to `stageLocale`. This ensures client components in the stage subtree read the correct strings regardless of what language the organizer has the app set to.

**Driven by other modules — no Stage override:**

- Leaderboard visibility — `modules.leaderboard.enabled`
- Leaderboard display options (tab, anonymize, show_amount) — `modules.leaderboard`
- `show_days_left` — from alltime-stats settings
- `show_impact` breakdown values — from alltime-stats settings
- Font and accent colors — `fundraiser.settings.theme`

**Always visible — no controls:**

- Goal + raised
- QR panel (`stage.pp.eco/:id` with UTM params)
- Ticker — horizontal scrolling recent donations
- Toasts — pop-up on new donation

---

## Scaling

Canvas is always 1920×1080px. Scale = `window.innerWidth / 1920`, capped at 1 (no upscaling past 1080p). Height flexes proportionally. Full width at any aspect ratio.

---

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  TOP BAR — Planet logo · partner logo · event name          │
├───────────────────────────┬─────────────────────────────────┤
│                           │   COUNTER (raised, goal, pct)   │
│   STORY SLIDE PANEL       │   + progress bar                │
│   (rotating, Ken Burns)   │   + donors / trees / days left  │
│                           ├─────────────────────────────────┤
│                           │   LEADERBOARD (if enabled)      │
│                           ├─────────────────────────────────┤
│                           │   QR panel                      │
├───────────────────────────┴─────────────────────────────────┤
│  TICKER — scrolling recent donations                        │
└─────────────────────────────────────────────────────────────┘
```

Toast notifications overlay top-right when a new donation lands.

---

## Data Sources

| Data                                           | Source                                                     | Used for                    |
| ---------------------------------------------- | ---------------------------------------------------------- | --------------------------- |
| Event name                                     | `fundraiser.title` or `modules.stage.title`                | Top bar                     |
| Planet logo                                    | `https://cdn.plant-for-the-planet.org/logo/svg/planet.svg` | Top bar                     |
| Partner logo                                   | `modules.stage.partner_logo_url`                           | Top bar                     |
| Goal, raised, trees, days left, donation count | `GET /fundraisers/{slug}/alltime-stats?stagehash=` via `useAlltimeStats` (polls 15s; uses [`getAlltimeStats`](../../lib/api/fundraiser-service.ts) under the hood) | Counter |
| Donation feed + leaderboard                    | Leaderboard module endpoint (polled every 15s)             | Ticker, toasts, leaderboard |
| QR code                                        | `https://qr.pp.eco/?url={origin}/raise/{id}?utm_*`         | QR panel                    |
| Short URL display                              | `stage.pp.eco/{id}`                                        | QR panel label              |
| Slide content                                  | `modules.stage.slides`                                     | Story panel                 |
| Theme, fonts, accent                           | `fundraiser.settings.theme`                                | All styling                 |

---

## Polling

Stage is the only surface that polls live data. `?stagehash=Math.floor(Date.now()/15000)` is appended so all polling clients land on the same 15s bucket — backend cache cohesion. The bucket helper is in [`stage-hash.ts`](./stage-hash.ts) and stays inside the module until a second consumer needs it.

| Endpoint                                | Interval | Status |
| --------------------------------------- | -------- | ------ |
| `GET /fundraisers/{slug}/alltime-stats` | 15s      | Wired  |
| `GET /fundraisers/{slug}/leaderboard`   | 15s      | Wired  |

**Non-stage consumers** of the same endpoints (e.g. the public fundraiser sidebar) use the service-layer one-shot call ([`getAlltimeStats`](../../lib/api/fundraiser-service.ts)) without the stagehash param — single fetch on page load, no polling, no bucket coupling.

---

## Offline Mode

- Freeze counter at last known value
- Hide ticker
- Slides and QR continue normally
- Auto-recover silently

**Status: not yet implemented**

---

## Components

All file paths below are relative to `src/`.

| Component          | File                                                | Status                                             |
| ------------------ | --------------------------------------------------- | -------------------------------------------------- |
| `StageLayout`      | `app/(stage)/raise/[slug]/stage/layout.tsx`         | Done                                               |
| `StagePage`        | `app/(stage)/raise/[slug]/stage/page.tsx`           | Done                                               |
| `StageView`        | `modules/stage/components/stage-view.tsx`           | Done                                               |
| `StageTopBar`      | `modules/stage/components/stage-top-bar.tsx`        | Done                                               |
| `StageSlidePanel`  | `modules/stage/components/stage-slide-panel.tsx`    | Done — Ken Burns, crossfade, pager                 |
| `StageCounter`     | `modules/stage/components/stage-counter.tsx`        | Done — live via alltime-stats                      |
| `StageQRPanel`     | `modules/stage/components/stage-qr-panel.tsx`       | Done                                               |
| `StageTicker`      | `modules/stage/components/stage-ticker.tsx`         | Done — live via leaderboard feed, countdown ring   |
| `StageToastStack`  | `modules/stage/components/stage-toast-stack.tsx`    | Mount point only — toast injection not yet wired   |
| `StageLeaderboard` | `modules/stage/components/stage-leaderboard.tsx`    | Done — live via leaderboard feed                   |
| `StageModePanel`   | `modules/stage/components/stage-mode-panel.tsx`     | Done — admin settings panel rendered in form       |
| `StageMenuItem`    | `modules/stage/components/stage-settings.tsx`       | Done — add-to-fundraiser menu entry                |
| `useStageScale`    | `modules/stage/hooks/use-stage-scale.ts`            | Done                                               |
| `useAlltimeStats`  | `modules/stage/hooks/use-alltime-stats.ts`          | Done — stage-internal polling hook, uses poll-bucket |
| `useLeaderboard`   | `modules/stage/hooks/use-leaderboard.ts`            | Done — polls every 15s, feeds ticker + leaderboard |

**Public surface** ([`index.ts`](./index.ts)): `StageView`, `StageModePanel`, `StageMenuItem`, `StageSection`, `STAGE_LIMITS`, `stageModule`, `stageDefaultSettings`, plus the `StageModuleSettings`/`StageSlide` types.

---

## TODOs

- [x] Wire leaderboard/donation feed endpoint → ticker, leaderboard
- [x] Apply fundraiser theme (accent color, fonts) to Stage Mode
- [x] Top bar: show description from `modules.stage.description` or fundraiser fallback
- [ ] Wire toast notifications on new donation (StageToastStack mount point exists)
- [ ] Implement offline mode badge in top bar
- [ ] Confirm `stage.pp.eco/:id` short URL resolves in production
- [ ] Implement Stage Mode configuration in the create fundraiser page
