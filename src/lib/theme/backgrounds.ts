import {
  ANIMATION_TYPES,
  type AnimationType,
  BG_DECORATIONS,
  BG_IMAGE_MODES,
  type BgDecoration,
  type BgImageMode,
  type BgSettings,
} from './types';

// Defaults for a fresh bg block (everything except the gradient).
export const DEFAULT_BG: Omit<BgSettings, 'gradient'> = {
  decoration: 'none',
  pattern_id: null,
  image_url: null,
  image_mode: 'cover',
  logo_id: null,
  opacity: 0.5,
  animation: 'none',
};

// Build a preset bg block from a gradient class plus optional overrides.
// Used in theme presets to keep them terse.
export function defineBg(
  gradient: string,
  overrides: Partial<Omit<BgSettings, 'gradient'>> = {}
): BgSettings {
  return { ...DEFAULT_BG, ...overrides, gradient };
}

export type BackgroundAssetType = 'pattern' | 'image' | 'video';

export interface BackgroundAsset {
  id: string; // Library key — currently persisted in settings.theme.bg.pattern_id or settings.theme.bg.image_url.
  label: string;
  type: BackgroundAssetType;
  thumb: string; // Picker thumbnail (data URI today, real assets later).
  src: string; // Full asset (rendered on the fundraiser page).
  tileSize?: string; // Optional override for the rendered tile size, eg '138px 92px'.
}

export const DEFAULT_PATTERN_TILE = '115px 77px';

// Inline SVG thumbnail factory. Real curated assets land under
// public/theme-backgrounds/ later; for now both `thumb` and `src` use the
// same data URI so the picker and render-side both work end-to-end.
function svgThumb(
  kind: string,
  [c1, c2]: [string, string],
  { wide = false } = {}
): string {
  const patterns: Record<string, string> = {
    dots: `<pattern id='p' width='8' height='8' patternUnits='userSpaceOnUse'><circle cx='4' cy='4' r='1.5' fill='${c2}'/></pattern><rect width='100%' height='100%' fill='${c1}'/><rect width='100%' height='100%' fill='url(#p)'/>`,
    grid: `<pattern id='p' width='8' height='8' patternUnits='userSpaceOnUse'><path d='M0 0 H8 M0 0 V8' stroke='${c2}' stroke-width='0.5'/></pattern><rect width='100%' height='100%' fill='${c1}'/><rect width='100%' height='100%' fill='url(#p)'/>`,
    waves: `<rect width='100%' height='100%' fill='${c1}'/><path d='M0 20 Q15 12 30 20 T60 20' stroke='${c2}' stroke-width='1.5' fill='none'/><path d='M0 28 Q15 20 30 28 T60 28' stroke='${c2}' stroke-width='1.5' fill='none' opacity='0.6'/>`,
    paper: `<rect width='100%' height='100%' fill='${c1}'/><rect width='100%' height='100%' fill='${c2}' opacity='0.25'/>`,
    wash: `<defs><radialGradient id='g' cx='30%' cy='40%'><stop offset='0' stop-color='${c2}'/><stop offset='1' stop-color='${c1}'/></radialGradient></defs><rect width='100%' height='100%' fill='url(#g)'/>`,
    leaves: `<rect width='100%' height='100%' fill='${c1}'/><ellipse cx='15' cy='18' rx='7' ry='12' fill='${c2}' transform='rotate(30 15 18)'/><ellipse cx='45' cy='24' rx='6' ry='10' fill='${c2}' opacity='0.7' transform='rotate(-20 45 24)'/>`,
    sky: `<defs><linearGradient id='g' x2='0' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><ellipse cx='20' cy='14' rx='10' ry='3' fill='#fff' opacity='0.6'/>`,
    balloons: `<rect width='100%' height='100%' fill='${c1}'/><circle cx='18' cy='18' r='6' fill='${c2}'/><circle cx='36' cy='14' r='5' fill='${c2}' opacity='0.7'/><circle cx='46' cy='22' r='4' fill='${c2}' opacity='0.5'/>`,
    confetti: `<rect width='100%' height='100%' fill='${c1}'/><rect x='10' y='8' width='3' height='1.5' fill='${c2}' transform='rotate(30 11 9)'/><rect x='24' y='20' width='3' height='1.5' fill='${c2}' transform='rotate(-20 25 21)'/><rect x='42' y='12' width='3' height='1.5' fill='${c2}' transform='rotate(60 43 13)'/><rect x='48' y='28' width='3' height='1.5' fill='${c2}' transform='rotate(10 49 29)'/>`,
    cake: `<rect width='100%' height='100%' fill='${c1}'/><rect x='18' y='18' width='24' height='14' rx='2' fill='${c2}'/><rect x='28' y='12' width='4' height='8' fill='${c2}'/><circle cx='30' cy='11' r='1.5' fill='#f59e0b'/>`,
    meadow: `<rect width='100%' height='100%' fill='${c1}'/><path d='M0 32 Q15 28 30 32 T60 32 L60 40 L0 40 Z' fill='${c2}'/>`,
    petals: `<rect width='100%' height='100%' fill='${c1}'/><circle cx='18' cy='14' r='3' fill='${c2}'/><circle cx='40' cy='22' r='2.5' fill='${c2}' opacity='0.7'/><circle cx='50' cy='10' r='2' fill='${c2}' opacity='0.5'/>`,
    stars: `<rect width='100%' height='100%' fill='${c1}'/><circle cx='12' cy='10' r='0.8' fill='#fff'/><circle cx='28' cy='20' r='1' fill='#fff'/><circle cx='45' cy='12' r='0.8' fill='#fff'/><circle cx='50' cy='28' r='0.8' fill='#fff'/><circle cx='20' cy='30' r='0.8' fill='#fff'/>`,
    clouds: `<rect width='100%' height='100%' fill='${c1}'/><ellipse cx='20' cy='18' rx='10' ry='4' fill='#fff' opacity='0.7'/><ellipse cx='44' cy='26' rx='12' ry='5' fill='#fff' opacity='0.5'/>`,
    candle: `<rect width='100%' height='100%' fill='${c1}'/><rect x='28' y='18' width='4' height='16' rx='1' fill='${c2}'/><path d='M30 18 Q28 14 30 11 Q32 14 30 18 Z' fill='#fbbf24'/><circle cx='30' cy='13' r='1.2' fill='#fde68a' opacity='0.9'/>`,
  };
  const vb = wide ? '0 0 240 40' : '0 0 60 40';
  const body = patterns[kind] ?? patterns.wash;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${vb}' preserveAspectRatio='xMidYMid slice'>${body}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const BG_LIBRARY: BackgroundAsset[] = [
  // Patterns
  {
    id: 'bg-grid',
    label: 'Grid',
    type: 'pattern',
    thumb: svgThumb('grid', ['#f8fafc', '#e2e8f0']),
    src: svgThumb('grid', ['#f8fafc', '#e2e8f0']),
    tileSize: '138px 92px',
  },
  {
    id: 'bg-waves',
    label: 'Waves',
    type: 'pattern',
    thumb: svgThumb('waves', ['#eff6ff', '#93c5fd']),
    src: svgThumb('waves', ['#eff6ff', '#93c5fd']),
  },
  {
    id: 'bg-paper',
    label: 'Paper',
    type: 'pattern',
    thumb: svgThumb('paper', ['#fafaf7', '#e5e4df']),
    src: svgThumb('paper', ['#fafaf7', '#e5e4df']),
  },
  {
    id: 'bg-watercolor',
    label: 'Watercolor',
    type: 'pattern',
    thumb: svgThumb('wash', ['#fef2f2', '#fbcfe8']),
    src: svgThumb('wash', ['#fef2f2', '#fbcfe8']),
  },
  {
    id: 'bg-leaves',
    label: 'Leaves',
    type: 'pattern',
    thumb: svgThumb('leaves', ['#ecfdf5', '#86efac']),
    src: svgThumb('leaves', ['#ecfdf5', '#86efac']),
  },
  {
    id: 'bg-botanic',
    label: 'Botanic',
    type: 'pattern',
    thumb: svgThumb('leaves', ['#fdf4ff', '#f9a8d4']),
    src: svgThumb('leaves', ['#fdf4ff', '#f9a8d4']),
  },
  {
    id: 'bg-balloons',
    label: 'Balloons',
    type: 'pattern',
    thumb: svgThumb('balloons', ['#fff7ed', '#fdba74']),
    src: svgThumb('balloons', ['#fff7ed', '#fdba74']),
  },
  {
    id: 'bg-petals',
    label: 'Petals',
    type: 'pattern',
    thumb: svgThumb('petals', ['#fdf4ff', '#f9a8d4']),
    src: svgThumb('petals', ['#fdf4ff', '#f9a8d4']),
  },
  {
    id: 'bg-stars',
    label: 'Stars',
    type: 'pattern',
    thumb: svgThumb('stars', ['#0f172a', '#a855f7']),
    src: svgThumb('stars', ['#0f172a', '#a855f7']),
  },
  // Images
  {
    id: 'bg-candle',
    label: 'Candle',
    type: 'image',
    thumb: svgThumb('candle', ['#fff7ed', '#fdba74']),
    src: svgThumb('candle', ['#fff7ed', '#fdba74']),
  },
  // First real curated asset: a static file under public/theme-backgrounds/
  // (referenced by path, not an inline data URI — it is too large to inline).
  {
    id: 'bg-planet-botanical',
    label: 'Botanical',
    type: 'image',
    thumb: '/theme-backgrounds/planet-botanical.svg',
    src: '/theme-backgrounds/planet-botanical.svg',
  },
  // Videos (looping placeholder = static SVG until real assets land)
  {
    id: 'bg-cake-loop',
    label: 'Cake loop',
    type: 'video',
    thumb: svgThumb('cake', ['#fff7ed', '#fdba74']),
    src: svgThumb('cake', ['#fff7ed', '#fdba74']),
  },
  {
    id: 'bg-meadow-loop',
    label: 'Meadow loop',
    type: 'video',
    thumb: svgThumb('meadow', ['#ecfdf5', '#86efac']),
    src: svgThumb('meadow', ['#ecfdf5', '#86efac']),
  },
  {
    id: 'bg-clouds-loop',
    label: 'Clouds loop',
    type: 'video',
    thumb: svgThumb('clouds', ['#eef2ff', '#c7d2fe']),
    src: svgThumb('clouds', ['#eef2ff', '#c7d2fe']),
  },
];

const BG_BY_ID = new Map(BG_LIBRARY.map(b => [b.id, b]));

export type ResolvedBgAsset =
  | { kind: 'library'; asset: BackgroundAsset }
  | { kind: 'external'; src: string };

// Resolves a stored pattern_id or image_url to a renderable asset.
// Logos are excluded — they resolve separately via LOGO_LIBRARY.find.
export function resolveBgAsset(
  bgAsset: string | null | undefined
): ResolvedBgAsset | null {
  if (!bgAsset) return null;
  if (/^https?:\/\//i.test(bgAsset)) return { kind: 'external', src: bgAsset };
  const asset = BG_BY_ID.get(bgAsset);
  return asset ? { kind: 'library', asset } : null;
}

// ─── Partner logos ──────────────────────────────────────────────────────
// Each entry is rendered as a centered watermark/logo on the fundraiser.
// Replace placeholder data URIs with real SVGs (FontAwesome free brands,
// official asset packs) when they land.

export interface LogoAsset {
  id: string; // library key persisted in bg.logo_id
  label: string;
  src: string;
}

// Logos live in public/theme-logos/. To add a new partner, drop the SVG in
// that folder and append a line here.
const logoSrc = (id: string) => `/theme-logos/${id}.svg`;

export const LOGO_LIBRARY: LogoAsset[] = [
  // Corporate / commerce
  { id: 'apple', label: 'Apple', src: logoSrc('apple') },
  { id: 'atlassian', label: 'Atlassian', src: logoSrc('atlassian') },
  { id: 'dhl', label: 'DHL', src: logoSrc('dhl') },
  { id: 'paypal', label: 'PayPal', src: logoSrc('paypal') },
  { id: 'salesforce', label: 'Salesforce', src: logoSrc('salesforce') },
  { id: 'slack', label: 'Slack', src: logoSrc('slack') },
  { id: 'spotify', label: 'Spotify', src: logoSrc('spotify') },
  { id: 'stripe', label: 'Stripe', src: logoSrc('stripe') },
  // Social (share-out / partner channels)
  { id: 'facebook', label: 'Facebook', src: logoSrc('facebook') },
  { id: 'instagram', label: 'Instagram', src: logoSrc('instagram') },
  { id: 'whatsapp', label: 'WhatsApp', src: logoSrc('whatsapp') },
  { id: 'youtube', label: 'YouTube', src: logoSrc('youtube') },
];

// Validators
export function isValidDecoration(value: unknown): value is BgDecoration {
  return (
    typeof value === 'string' && BG_DECORATIONS.includes(value as BgDecoration)
  );
}

export function isValidImageMode(value: unknown): value is BgImageMode {
  return (
    typeof value === 'string' && BG_IMAGE_MODES.includes(value as BgImageMode)
  );
}

export function isValidAnimation(value: unknown): value is AnimationType {
  return (
    typeof value === 'string' &&
    ANIMATION_TYPES.includes(value as AnimationType)
  );
}
