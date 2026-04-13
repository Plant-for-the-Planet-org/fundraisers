export const ALLOWED_REDIRECT_PATHS = ['/explore', '/dashboard'] as const;

export type RedirectPath = (typeof ALLOWED_REDIRECT_PATHS)[number];
