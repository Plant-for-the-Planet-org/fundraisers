export const ALLOWED_REDIRECTS = ['/explore'] as const;

export type RedirectPath = (typeof ALLOWED_REDIRECTS)[number];

export const DEFAULT_REDIRECT_PATH: RedirectPath = '/explore';
