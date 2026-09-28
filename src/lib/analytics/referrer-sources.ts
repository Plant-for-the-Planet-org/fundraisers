export type KnownSource =
  | 'linkedin'
  | 'instagram'
  | 'facebook'
  | 'whatsapp'
  | 'x'
  | 'google'
  | 'bing'
  | 'email';

export interface SourceCount {
  /** A known platform, or the referring domain as Umami reported it. */
  source: KnownSource | string;
  known: boolean;
  visitors: number;
}

// Apps report their package name (com.linkedin.android) and platforms bounce links through redirectors (l.instagram.com), so one platform shows up under several names.
const SOURCE_PATTERNS: Array<[KnownSource, RegExp]> = [
  ['linkedin', /(^|\.)linkedin\.(com|android)$|^lnkd\.in$|^com\.linkedin\./],
  ['instagram', /(^|\.)instagram\.com$|^com\.instagram\./],
  ['facebook', /(^|\.)facebook\.com$|^fb\.me$|^com\.facebook\./],
  ['whatsapp', /(^|\.)whatsapp\.com$|^wa\.me$|^com\.whatsapp/],
  ['x', /(^|\.)(twitter|x)\.com$|^t\.co$/],
  [
    'google',
    /(^|\.)google\.[a-z.]+$|^com\.google\.android\.googlequicksearchbox$/,
  ],
  ['bing', /(^|\.)bing\.com$/],
  [
    'email',
    /(^|\.)(mail\.google\.com|outlook\.(live|office)\.com|mail\.yahoo\.com)$/,
  ],
];

// Sign-in redirects land back on the page with the identity provider as referrer. That is our own login, not a source.
const IGNORED =
  /^accounts\.google\.com$|(^|\.)auth0\.com$|^auth\.|(^|\.)plant-for-the-planet\.org$|(^|\.)startplanting\.org$/;

function classify(referrer: string): KnownSource | null {
  const host = referrer.toLowerCase();
  // Email webmail hosts are checked first so mail.google.com is not counted as Google search.
  const email = SOURCE_PATTERNS.find(([name]) => name === 'email');
  if (email && email[1].test(host)) return 'email';
  return SOURCE_PATTERNS.find(([, pattern]) => pattern.test(host))?.[0] ?? null;
}

/** Folds raw referrer hosts into sources, largest first. */
export function groupReferrers(
  referrers: Array<{ x: string; y: number }>,
  limit: number
): SourceCount[] {
  const totals = new Map<string, SourceCount>();

  for (const { x, y } of referrers) {
    const host = x.trim().toLowerCase();
    if (!host || IGNORED.test(host)) continue;
    const known = classify(host);
    const key = known ?? host.replace(/^www\./, '');
    const entry = totals.get(key) ?? {
      source: key,
      known: known !== null,
      visitors: 0,
    };
    entry.visitors += y;
    totals.set(key, entry);
  }

  return [...totals.values()]
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, limit);
}
