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

/**
 * The links to show for a page.
 * Start Fundraiser goes while starting or editing one, and Explore goes on the Explore page itself, since the visitor is already there.
 * A category page keeps it: there it leads back to the whole list.
 */
export function getHeaderLinks(pathname: string) {
  return HEADER_LINKS.filter(link => {
    if (link.labelKey === 'explore') return pathname !== '/explore';
    return !HIDE_START_FUNDRAISER_PATHS.some(path => pathname.startsWith(path));
  });
}
