/**
 * Which header items the current route hides.
 *
 * Visible is the default; hiding is the exception that needs a reason. Every
 * reason lives in `getHeaderVisibility`, so a component never repeats a path
 * check — it reads the flag for its own item and renders accordingly.
 */

/**
 * Trailing slash included: a project page always carries a slug, and matching
 * `/projects/` rather than `/projects` keeps a future sibling route such as
 * `/projects-archive` from being mistaken for one.
 */
const PROJECT_PATH_PREFIX = '/projects/';
const SIGN_IN_PATH = '/login';
const VERIFY_EMAIL_PATH = '/verify-email';
const CREATE_FUNDRAISER_PATH = '/fundraisers/create';
const EDIT_FUNDRAISER_PATH = '/dashboard/fundraisers/edit';
const REDIRECTING_PATH = '/redirecting';

/** Where the visitor is — everything the decision is allowed to read. */
export interface HeaderLocation {
  pathname: string;
  /** The `redirectTo` query param, present on `/login?redirectTo=...`. */
  redirectTo: string | null;
}

/**
 * One flag per header item whose visibility depends on the route. Flags name
 * the surface they belong to, so the nav and the user menu can differ.
 */
export interface HeaderVisibility {
  /** The whole primary navigation. */
  primaryNav: boolean;
  startFundraiserNavLink: boolean;
  exploreMenuItem: boolean;
  startFundraiserMenuItem: boolean;
  dashboardMenuItem: boolean;
  /** The header Sign In button shown to signed-out visitors. */
  signInButton: boolean;
}

/**
 * Pure: pass a location in, get flags out. Client components use
 * `useHeaderVisibility`, which wires this up to the router.
 */
export function getHeaderVisibility({
  pathname,
  redirectTo,
}: HeaderLocation): HeaderVisibility {
  const isProjectPage = pathname.startsWith(PROJECT_PATH_PREFIX);
  const isSignInPage = pathname.startsWith(SIGN_IN_PATH);
  // Signing in mid-donation is part of the project flow, so the nav stays
  // stripped. Sign-in reached from anywhere else keeps its usual navigation.
  const isProjectSignIn =
    isSignInPage && (redirectTo?.startsWith(PROJECT_PATH_PREFIX) ?? false);
  const isEditingFundraiser =
    pathname.startsWith(CREATE_FUNDRAISER_PATH) ||
    pathname.startsWith(EDIT_FUNDRAISER_PATH);
  /**
   * `/redirecting` is the hop that carries visitors through login and logout.
   * It replaces itself with the destination as soon as it can, so header
   * controls shown there read as a flash rather than as navigation. The
   * destination cannot be checked: on login it lives in sessionStorage under
   * the `state` nonce, not in the URL.
   */
  const isAuthTransition = pathname.startsWith(REDIRECTING_PATH);

  return {
    // The project page keeps the focus on donating: nothing competes with the
    // donate action, and no route leads away into browsing or fundraising.
    // Below `xs` the nav is gone and the user menu carries the same links, so
    // both surfaces have to be stripped for the page to stay focused.
    primaryNav: !isProjectPage && !isProjectSignIn && !isAuthTransition,
    exploreMenuItem: !isProjectPage,
    startFundraiserMenuItem: !isProjectPage,
    dashboardMenuItem: !isProjectPage,
    // Start Fundraiser would lead back to where the visitor already is.
    startFundraiserNavLink: !isEditingFundraiser,
    // Auth pages have their own sign-in entry point, so the header button is
    // redundant there, and it would capture the auth page as redirectTo. On
    // the transition hop it would flash in for a moment mid-logout.
    signInButton:
      !isSignInPage &&
      !pathname.startsWith(VERIFY_EMAIL_PATH) &&
      !isAuthTransition,
  };
}
