export const HEADER_LINKS = [
  {
    href: '/explore',
    labelKey: 'explore',
  },
  {
    href: '/fundraisers/create',
    labelKey: 'startFundraiser',
  },
] as const;

const HIDE_START_FUNDRAISER_PATHS = [
  '/fundraisers/create',
  '/dashboard/fundraisers/edit',
];

// Shared by the desktop header nav and the mobile user menu so both hide the link on the same pages.
export function shouldShowStartFundraiser(pathname: string) {
  return !HIDE_START_FUNDRAISER_PATHS.some(p => pathname.startsWith(p));
}
