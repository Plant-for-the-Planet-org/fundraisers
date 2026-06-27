import type { FaIconName } from '@/components/fa-icons';

import {
  FIREALERT_ICON,
  PLANETCASH_ICON,
  PLATFORM_ICON,
  TRACER_ICON,
  TREEGAME_ICON,
  TREEMAPPER_ICON,
} from './app-icons';

// The ForestCloud app catalogue + types.
//
// This file is intentionally free of app-specific imports (only the icon-name
// type) so the whole `forestcloud-apps/` folder can be lifted into @planet/sdk
// later without changes.

export type AppGroup = 'core' | 'giving' | 'tools' | 'more' | 'admin';

export interface ForestCloudApp {
  /** Stable id. Also the localStorage favourite key and the `currentAppId` match. */
  id: string;
  /** Label shown on the tile. */
  name: string;
  /** Absolute production URL the tile links to. */
  url: string;
  /** Monochrome fallback icon from the FA registry (see fa-icons.ts). */
  icon: FaIconName;
  /**
   * The app's own icon (favicon / logo) URL — the real, coloured mark. Shown
   * when set; falls back to `icon` if the image fails to load. PfP web
   * properties share the green PfP favicon; only distinctly-branded apps
   * (e.g. Tree Game, TFFF Watch) resolve to their own.
   */
  iconUrl?: string;
  /**
   * When set, `iconUrl` is a full-bleed app icon (its own background +
   * rounded corners), so it's rendered edge-to-edge filling the tile rather
   * than as a small mark centred in the muted chip. The ForestCloud app
   * icons in app-icons.ts are full-bleed; favicons / PfP marks are not.
   */
  iconBleed?: boolean;
  group: AppGroup;
  /**
   * Access-gate keys. Absent/empty → visible to any signed-in user.
   * When set, the app shows only if the user's grants satisfy one of these.
   * Until the Auth0 token carries grants, gated apps stay hidden (fail closed).
   * See filter.ts.
   */
  requires?: string[];
  /** URL not yet confirmed against the live app. Editorial flag, not shown in UI. */
  unverified?: boolean;
  /** Temporarily hide this tile without removing the entry. Filtered in visibleApps. */
  hidden?: boolean;
}

/** Display order + labels for the grouped launcher sections (future use). */
export const APP_GROUPS: { id: AppGroup; label: string }[] = [
  { id: 'core', label: 'Platform' },
  { id: 'giving', label: 'Giving' },
  { id: 'tools', label: 'Tools' },
  { id: 'more', label: 'More from ForestCloud' },
  { id: 'admin', label: 'Admin' },
];

/**
 * Hardcoded for v0 — there is no registry endpoint yet. Edit this list to add,
 * rename, reorder, or fix the URL of an app. Entries flagged `unverified` still
 * need their production URL confirmed before launch.
 */
// The PfP web properties all serve the same green PfP favicon. Distinctly
// branded apps below point at their own icon instead.
const PFP_ICON = 'https://www.plant-for-the-planet.org/favicon.ico';

// Canopy's own app icon (src/app/icon.svg) — the green PfP-leaf wordmark that
// Next.js serves as the favicon. Embedded so the launcher stays portable.
const CANOPY_ICON =
  'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%22-8%20-8%2099.405%20101%22%3E%0A%20%20%3Cpath%20d%3D%22M86.059%2C44.774l-.376.035.282%2C2.751.376-.043c.864-.1%2C1.839-.381%2C1.719-1.566-.094-.917-.727-1.289-2-1.177Zm1.394%2C16.732%2C2.352-.251-1.531-3.426-.821%2C3.677Zm29.273-7.648.89%2C8.591-2.823.3-.89-8.591-5.381.58.188%2C1.834%2C3.191-.337.248%2C2.422L108.968%2C59l.2%2C1.9%2C3.362-.363.257%2C2.431-6.193.658-1.146-11.013%2C6.039-.64%2C7.331-.779.248%2C2.422-2.335.242ZM102.415%2C64.066%2C96.5%2C57.829l.7%2C6.791-2.831.3h0l-2.669.285L90.8%2C63.365l-3.892.415-.556%2C2-2.994.32h0L77.7%2C66.7%2C76.564%2C55.692l2.823-.3.89%2C8.591%2C3.747-.4%2C2.37-8.937%2C3.088-.329%2C4.782%2C9.5-1.027-9.9%2C2.823-.294%2C5.911%2C6.22-.7-6.774%2C2.823-.3%2C1.146%2C11.013-2.823.285ZM70.345%2C49.592a5.449%2C5.449%2C0%2C0%2C1%2C1.411-4.274%2C6.4%2C6.4%2C0%2C0%2C1%2C4.021-2.033%2C6.317%2C6.317%2C0%2C0%2C1%2C4.346%2C1.142%2C5.445%2C5.445%2C0%2C0%2C1%2C2.258%2C3.893%2C6.158%2C6.158%2C0%2C0%2C1-1.249%2C4.551%2C6.071%2C6.071%2C0%2C0%2C1-4.14%2C2.163h0a5.872%2C5.872%2C0%2C0%2C1-6.647-5.442Zm5.133%2C12.735a4.073%2C4.073%2C0%2C0%2C1-2.754%2C1.194l-1.24.138-.368.043.376%2C3.651-2.831.3L67.522%2C56.643l4.328-.459c2.549-.268%2C4.089.865%2C4.328%2C3.2a3.714%2C3.714%2C0%2C0%2C1-.7%2C2.941Zm-8.486-6.61-2.823.3L63.031%2C45.007l6.245-.666.248%2C2.422-3.422.363.2%2C1.843%2C3.1-.329.257%2C2.422-3.105.337.445%2C4.317ZM56.8%2C68.92%2C55.657%2C57.906l6.185-.658.248%2C2.422-3.362.355.2%2C1.843%2C3.182-.346.248%2C2.422-3.182.337.2%2C1.895%2C3.353-.355.248%2C2.422L56.8%2C68.92Zm-4.166.441-.47-4.516-4.08.433.47%2C4.516-2.823.3-.89-8.582-2.139.225.89%2C8.582-2.831.3-.89-8.582-2.335.251-.248-2.422L47.411%2C58.8l.436%2C4.248%2C4.08-.433-.445-4.248%2C2.831-.3%2C1.138%2C11.013-2.823.285Zm1.129-35.488%2C4.328-.459a4.315%2C4.315%2C0%2C0%2C1%2C2.943.562%2C3.446%2C3.446%2C0%2C0%2C1%2C1.386%2C2.647%2C3.768%2C3.768%2C0%2C0%2C1-.7%2C2.95%2C4.092%2C4.092%2C0%2C0%2C1-2.754%2C1.194l-1.608.173.376%2C3.651-2.823.3L53.758%2C33.873Zm11.856-1.254.89%2C8.591%2C3.747-.4%2C2.37-8.937%2C3.088-.329%2C5.244%2C10.581-3.02.32-.907-1.834-3.884.407-.556%2C1.99-8.657.926L62.783%2C32.921l2.831-.3ZM86.6%2C53.633l-2.831.3L82.629%2C42.922l4.226-.45a4.178%2C4.178%2C0%2C0%2C1%2C2.78.528%2C3.188%2C3.188%2C0%2C0%2C1%2C1.352%2C2.466%2C3.007%2C3.007%2C0%2C0%2C1-1.565%2C3.175l-.453.225%2C3.849%2C4.109-3.524.372-3.139-3.98.445%2C4.265ZM83.014%2C30.767l5.911%2C6.22-.7-6.774%2C9.966-1.055.248%2C2.422-2.335.251.89%2C8.591-2.823.3-.89-8.591-1.976.208.89%2C8.591-2.831.3L83.45%2C35.006l.7%2C6.783-2.823.277-1.138-11%2C2.823-.3Zm36.861%2C23.515-.077-.753-.248-2.422-.077-.753-.736.078-7.109.761a7.6%2C7.6%2C0%2C0%2C0-4.508-1.7c.359-2.976-1.172-8.452-7.314-8.461a13.627%2C13.627%2C0%2C0%2C0-2.5-6.722L97.12%2C32.48l1.6-.173.736-.078-.086-.753-.248-2.422-.077-.744-.736.078-7.322.779-2.823.3-.736.078.077.744.188%2C1.782a15.241%2C15.241%2C0%2C0%2C0-1.668.744l-2.447-2.578-.248-.268-.359.035-2.831.3-.736.078.077.744.214%2C2.111a9.8%2C9.8%2C0%2C0%2C0-2.241.061L76.41%2C31.191l-.231-.467-.513.052-3.088.329-.5.052-.163.519L70.9%2C35.482a6.994%2C6.994%2C0%2C0%2C0-4.337-.926l-.205-2.016-.077-.753-.736.078-2.831.3-.736.078.077.744.1%2C1a3.6%2C3.6%2C0%2C0%2C0-.71-.64%2C5.008%2C5.008%2C0%2C0%2C0-3.439-.683l-4.328.459-.736.078.077.744%2C1.146%2C11.013.017.2a7.166%2C7.166%2C0%2C0%2C0-3.062%2C8.34%2C10.158%2C10.158%2C0%2C0%2C0-6.895%2C4.862l-.462.052h0l-6.561.7-.736.078.077.744.248%2C2.422.077.744.736-.078%2C1.6-.173.813%2C7.838.077.744.736-.078%2C1.933-.208c-3.807%2C4.819%2C1.129%2C14.586%2C10.308%2C12.9.958%2C2.76%2C5.047%2C2.838%2C9.709%2C2.422l-.128-1.064L46.607%2C76.792l1.8-4.049%2C3.8%2C1.566L51.876%2C73.1l1.728-.407%2C1.334%2C3.3%2C8.2%2C6.056-.222-3.3%2C3.422-.363.95%2C3.253L69.729%2C79.4l-7.853-4.213%2C1.8-4.04%2C3.8%2C1.557-.334-1.211%2C1.719-.407%2C1.334%2C3.3%2C2.78%2C2.05%2C1.4-1.289.205-4.689%2C3.02.216-.077%2C1.895%2C2.541-3.3%2C2.352%2C1.609L82.15%2C69.9l1.728-.407%2C1.334%2C3.3%2C2.9%2C2.146%2C1.531-1.4.214-4.7%2C3.02.216-.086%2C1.895%2C2.669-3.469%2C2.609%2C4.594L93.921%2C75.46l2.686-.285.95%2C3.253%2C7.1-6.506.214-4.689%2C3.011.216-.086%2C1.895%2C2.669-3.469%2C2.609%2C4.594L99.242%2C81.793l.188.865c3.841-.355%2C7.759-1%2C9.41-4.447%2C7.2-.329%2C10.881-9.283%2C7.109-13.946-.573-.7-.9-.8-.9-.8l2.652-.285.736-.078-.077-.744-.813-7.838%2C1.6-.173.727-.069ZM72.518%2C58.624a3.45%2C3.45%2C0%2C0%2C0-1.437-.026h-.009l-.479.052.282%2C2.742.479-.052c1-.1%2C2.027-.216%2C1.89-1.566-.068-.632-.3-.995-.727-1.151ZM57.591%2C38.579c1-.112%2C2.036-.225%2C1.891-1.566-.145-1.4-1.086-1.3-2.181-1.185l-.479.052.282%2C2.751.488-.052Zm16.92-3.512-.821%2C3.677%2C2.352-.251-1.531-3.426ZM79.43%2C48.641a3.081%2C3.081%2C0%2C0%2C0-3.379-2.578%2C3.138%2C3.138%2C0%2C0%2C0-2.079%2C1.116%2C2.88%2C2.88%2C0%2C0%2C0-.693%2C2.12%2C3.4%2C3.4%2C0%2C0%2C0%2C1.146%2C2.258%2C2.963%2C2.963%2C0%2C0%2C0%2C1.9.718s.188%2C0%2C.359-.017.376-.061.376-.061a3.171%2C3.171%2C0%2C0%2C0%2C2.37-3.556Zm9.119%2C31.214-4.32%2C3.53.18.813%2C8.657-.917-.128-1.073-4.388-2.353ZM73.4%2C81.386l-4.44%2C3.634.18.813%2C8.905-.943-.128-1.073L73.4%2C81.386Zm7.126-5.831-1.873%2C1.531%2C2.943-.311.95%2C3.253%2C2.335-2.137-4.354-2.336Zm-4.157%2C3.4%2C2.019%2C1.488-.205-2.976-1.814%2C1.488ZM93.4%2C78.843l-.188-2.8-1.711%2C1.4%2C1.9%2C1.4Zm1.206%2C11.143-1.129%2C9.776-.017.043-1.506%2C4.049-.59.182L86.008%2C95.1l-.017-.061L83.4%2C83.1l5.064-4.135%2C5.158%2C2.768.992%2C8.21-.009.043ZM82.159%2C81.395l-1.112-3.8-2.1.225.282%2C4.187L75.144%2C78.99l5.287-4.326%2C5.714%2C3.071-3.986%2C3.66ZM79.592%2C91.586l-1.129%2C9.776L76.846%2C105.7l-.607.19-5.483-9.162-2.609-12%2C5.175-4.239%2C5.3%2C2.838.992%2C8.219-.017.043ZM106.5%2C102.66%2C101.021%2C93.5l-2.609-12%2C13.7-11.212-1.737-3.063-3.422%2C4.447.154-3.521-1.531-.112-.2%2C4.231-8.2%2C7.518-1.112-3.807-2.1.225.282%2C4.187-3.969-2.933%2C6.818-5.58-1.745-3.071-3.422%2C4.447.154-3.512-1.54-.112-.2%2C4.239-2.207%2C2.024-3.559-2.63-1.172-2.9-.351.087.6%2C2.18-3.447-2.353-3.55%2C4.611.154-3.521-1.54-.112-.188%2C4.231L73%2C77.4l-3.43-2.535-1.172-2.9-.351.087.522%2C1.929-4.534-1.86-1.215%2C2.734%2C8.169%2C4.386L66.881%2C83l-1.112-3.8-2.07.225.282%2C4.187L54.323%2C76.49l-1.172-2.9-.351.087.522%2C1.929-4.534-1.869-1.223%2C2.742%2C15.774%2C8.47.984%2C8.21-1.138%2C9.819-2.464%2C6.6-2.78%2C1.055.693%2C2.673%2C5.056-1.99%2C3.986-14.759L73.4%2C111.087l6.946-2.717-.18-4.213L82.963%2C95l5.7%2C14.465%2C6.946-2.725-.163-3.833.017-.052%2C2.5-9.517%2C5.723%2C14.534%2C6.946-2.725-.163-3.668L106.5%2C102.66Z%22%20transform%3D%22translate(-36.47%20-28.31)%22%20fill%3D%22%23688716%22%20%2F%3E%0A%3C%2Fsvg%3E';

export const FOREST_CLOUD_APPS: ForestCloudApp[] = [
  // Core surfaces. There's no separate "Platform" tile — "Projects" (the web
  // app) is the Platform surface, so it carries the Platform mark (PLATFORM_ICON).
  // (A SeedManager brand icon exists in the design handoff but has no tile yet —
  // not a product.) The main PfP marketing site doesn't need its own tile.
  {
    id: 'accounts',
    name: 'Account',
    url: 'https://accounts.plant-for-the-planet.org',
    icon: 'circle-user',
    iconUrl: PFP_ICON,
    group: 'core',
  },
  {
    id: 'projects',
    name: 'Projects',
    url: 'https://web.plant-for-the-planet.org',
    icon: 'tree',
    iconUrl: PLATFORM_ICON,
    iconBleed: true,
    group: 'core',
  },
  // This app — the Start Planting fundraiser. Uses the app's own favicon (served
  // same-origin) as the Start Planting mark; marked current via currentAppId.
  {
    id: 'fundraiser',
    name: 'Fundraiser',
    url: 'https://startplanting.org',
    icon: 'seedling',
    iconUrl: '/favicon.ico',
    group: 'core',
  },

  // Giving
  // Canopy tile hidden for now — flip `hidden` to re-enable (entry + icon kept).
  {
    id: 'canopy',
    name: 'Canopy',
    url: 'https://canopy.startplanting.org',
    icon: 'building',
    iconUrl: CANOPY_ICON,
    group: 'giving',
    hidden: true,
  },
  // NOTE: PlanetCash is a section inside the Platform; confirm the exact path.
  // iconUrl is PlanetCash's own wallet mark (from planet-webapp), in PfP green;
  // falls back to the FA "wallet" icon if the image fails.
  {
    id: 'planetcash',
    name: 'PlanetCash',
    url: 'https://app.plant-for-the-planet.org/profile/planetcash',
    icon: 'wallet',
    iconUrl: PLANETCASH_ICON,
    group: 'giving',
    unverified: true,
  },

  // Tools
  {
    id: 'treemapper',
    name: 'TreeMapper',
    url: 'https://dash.treemapper.app',
    icon: 'location-dot',
    iconUrl: TREEMAPPER_ICON,
    iconBleed: true,
    group: 'tools',
  },
  {
    id: 'firealert',
    name: 'FireAlert',
    url: 'https://www.plant-for-the-planet.org/firealert/',
    icon: 'fire',
    iconUrl: FIREALERT_ICON,
    iconBleed: true,
    group: 'tools',
  },
  // Tree Game lives in the main Apps section (was "More from ForestCloud").
  {
    id: 'treegame',
    name: 'Tree Game',
    url: 'https://treegame.io',
    icon: 'gamepad-modern',
    iconUrl: TREEGAME_ICON,
    iconBleed: true,
    group: 'tools',
  },

  // More from ForestCloud — Shopify App + apps with their own coloured icons.
  {
    id: 'website',
    name: 'Website',
    url: 'https://www.plant-for-the-planet.org/',
    icon: 'globe',
    iconUrl: PFP_ICON,
    group: 'more',
  },
  {
    id: 'tracer',
    name: 'EUDR Tracer',
    url: 'https://farm.tracer.eco',
    icon: 'barcode-read',
    iconUrl: TRACER_ICON,
    iconBleed: true,
    group: 'more',
  },
  {
    id: 'tfff-watch',
    name: 'TFFF Watch',
    url: 'https://tfffwatch.org',
    icon: 'binoculars',
    iconUrl: 'https://tfffwatch.org/favicon.ico',
    group: 'more',
  },
  {
    id: 'shopify-app',
    name: 'Shopify App',
    url: 'https://www.plant-for-the-planet.org/shopify-app/',
    icon: 'bag-shopping',
    iconUrl: PFP_ICON,
    group: 'more',
  },
  {
    id: 'restoration-standards',
    name: 'Restoration Standards',
    url: 'https://www.plant-for-the-planet.org/standards/',
    icon: 'shield-check',
    iconUrl: PFP_ICON,
    group: 'more',
  },

  // Admin — gated; hidden until the token carries an app grant (see filter.ts).
  // NOTE: placeholder URL for internal reviewer tooling; confirm before enabling.
  {
    id: 'admin-console',
    name: 'Reviewer',
    url: 'https://app.plant-for-the-planet.org',
    icon: 'shield-halved',
    iconUrl: PFP_ICON,
    group: 'admin',
    requires: ['admin', 'reviewer'],
    unverified: true,
  },
];
