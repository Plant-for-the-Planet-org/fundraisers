import type { HeaderVisibility } from '@/lib/utils/header-visibility';

interface HeaderLink {
  readonly href: string;
  /** Key in the `Common.headerLinks` namespace. */
  readonly labelKey: string;
  /**
   * Flag that hides this link on some routes — see `getHeaderVisibility`.
   * `null` when the link shows wherever the nav itself does.
   */
  readonly visibilityFlag: keyof HeaderVisibility | null;
}

// `as const satisfies` keeps `labelKey` a literal type — next-intl checks
// translation keys at compile time — while still enforcing the shape above.
export const HEADER_LINKS = [
  {
    href: '/explore',
    labelKey: 'explore',
    visibilityFlag: null,
  },
  {
    href: '/fundraisers/create',
    labelKey: 'startFundraiser',
    visibilityFlag: 'startFundraiserNavLink',
  },
] as const satisfies readonly HeaderLink[];
