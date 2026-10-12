/** Header, content and footer share one column width, so they line up. Most pages read best narrow. */
export const DEFAULT_PAGE_MAX = '60rem';

/** The dashboard is a workspace with side-by-side panels, Explore shows tiles and lists side by side, and the fundraiser form is a sidebar beside a main column, so all use more of a wide screen. */
const WIDE_PAGE_MAX = '90rem';

export function getPageMaxForPath(pathname: string): string {
  const isBrowse = pathname === '/explore' || pathname.startsWith('/explore/');
  const isDashboard = pathname.startsWith('/dashboard');
  // Creating and editing share one form, so they share one width.
  const isForm =
    pathname === '/fundraisers/create' ||
    pathname.startsWith('/dashboard/fundraisers/edit');
  return isBrowse || isDashboard || isForm ? WIDE_PAGE_MAX : DEFAULT_PAGE_MAX;
}
