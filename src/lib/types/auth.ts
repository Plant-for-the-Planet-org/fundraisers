export const ALLOWED_REDIRECT_ROOTS = [
  '/explore',
  '/dashboard',
  '/fundraisers',
] as const;

type AllowedRoot = (typeof ALLOWED_REDIRECT_ROOTS)[number];

export type RedirectPath = AllowedRoot | `${AllowedRoot}/${string}`;
