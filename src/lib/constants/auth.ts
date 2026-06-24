export const DEFAULT_REDIRECT_PATH = '/explore';

// Set by the Auth0 callback when a login is denied for an unverified email.
// Gates the /verify-email page so it is only shown to users who actually hit that denial, not anyone who navigates to the URL directly.
export const EMAIL_VERIFICATION_PENDING_COOKIE = 'email_verification_pending';

export const PROTECTED_PATH = [
  '/dashboard',
  '/dashboard/fundraisers/edit',
  '/fundraisers/create',
];
