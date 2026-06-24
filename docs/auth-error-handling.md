# Auth error handling

How the app handles Auth0 login errors — both actionable denials (unverified email) and generic failures. Implementation lives in `src/app/api/auth/callback/route.ts`, `src/app/(standard)/verify-email/page.tsx`, `src/components/auth/auth-initializer.tsx`, and the root layout.

## Behavior

- **Unverified email →** the callback routes `email_not_verified` to a dedicated `/verify-email` page with a generic "confirm your email" message. The provider re-sends the verification email on each attempt, so the page has no resend button.
- **Any other failure →** falls through to the `auth_failed` path, which shows a generic error toast.

## Key decisions

### Only one error code is handled

Login errors reach our callback only when the credentials were correct but a post-authentication check denied the login. Audit of the provider's post-login flow confirmed the single such denial today is the unverified-email case. Other failures (wrong password, blocked user, rate-limiting) happen at the credential stage and are shown on the provider's own hosted page — they never redirect back to us, so there is nothing to handle.

The callback uses a `USER_ACTIONABLE_ERRORS` lookup, so a new denial code (if one is ever added) is a one-line addition rather than a refactor.

### `'401'` is intentionally not handled

planet-webapp matches a `'401'` code, but that is an artifact of its auth SDK. This app reads `error_description` directly from the callback URL, where the only denial value sent is `email_not_verified`. `error_description=401` has no code path here, so it is deliberately absent.

### `/verify-email` is gated by a cookie

The page must only appear for users who actually hit the denial, not anyone who types the URL. Auth state lives in client-side localStorage (not readable server-side), so the callback sets a short-lived, `httpOnly`, path-scoped cookie on the denial; the page (a server component) checks it and redirects to `/login` if absent. The cookie is cleared on the next successful login and otherwise expires in 10 minutes.

### Single Toaster in the root layout

The sign-in-error toast fires synchronously while `AuthInitializer` (root layout) mounts, and sonner drops any toast published before a `<Toaster>` has subscribed. So the Toaster must mount before `AuthInitializer`'s effect runs: a single `<Toaster>` lives in the root layout, ordered ahead of `AuthInitializer`. A single instance there also avoids the duplicate Toasters that per-layout placement would create. The toast only appears on an actual `auth_failed` redirect or a genuine init exception, never on a routine visit.
