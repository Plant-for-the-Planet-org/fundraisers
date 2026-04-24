# PR Review: `hotfix/auth-fixes` → `develop`

**Branch:** `hotfix/auth-fixes`  
**Base:** `develop`  
**Reviewed:** 2026-04-22  
**Updated:** 2026-04-24 (post-fix re-review)

---

## Overview

A large auth refactor spanning 16 files (4 new, 1 deleted, 11 modified). Primary goals:

- Fix an OAuth CSRF vulnerability (open redirect via the `state` parameter)
- Centralise post-auth and post-logout redirect handling in a new `/redirecting` page
- Add `RedirectPath` branded type for end-to-end redirect path validation
- Separate silent-auth PKCE from the regular login PKCE flow
- Remove render-phase router side-effects

The security fixes are well-implemented. One regression and several maintenance gaps need attention before merging.

---

## Security — Fixed

| Fix                                                   | Mechanism                                                                                                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| OAuth CSRF via `state` param                          | `state` is now a random nonce (`crypto.randomUUID()`); the intended `redirectTo` is stored in `sessionStorage` keyed by nonce (`oauth_state_{nonce}`) |
| Open redirect in callback route                       | Nonce-lookup approach prevents attackers from injecting redirect targets through the OAuth `state` param                                              |
| Protocol-relative URL bypass (`//evil.com`, `/\path`) | `isAllowedRedirect()` explicitly rejects both patterns before the allowlist check                                                                     |
| Render-phase `router.replace()` side-effects          | All `router.replace()` calls moved into `useEffect`                                                                                                   |

---

## Issues & Task Tracker

### ~~🔴 HIGH — Silent-auth iframe triggers `AuthInitializer` code exchange~~ ✅ Fixed (`f700adc`)

- [x] **Fix:** Guard `AuthInitializer` against iframe context

**Files:** `src/app/api/auth/callback/route.ts:26-28`, `src/components/auth/auth-initializer.tsx:12-16`, `src/lib/auth/auth0-config.ts:136-196`

The callback route now forwards the authorization code to the client:

```ts
// route.ts
const url = new URL('/redirecting', request.url);
url.searchParams.set('code', code);
```

The silent-auth hidden iframe therefore lands on `/redirecting?code=X`. Because `AuthInitializer` lives in the root layout, the **iframe's own `AuthInitializer` also runs** and sees `code=X`. It calls `handleCodeExchange(code)` → `exchangeCodeForTokens(code)` with no `inMemoryVerifier`, falling back to `getStoredCodeVerifier()` from `sessionStorage`.

Silent auth's PKCE verifier is intentionally in-memory only (not stored in sessionStorage — correct design), so `getStoredCodeVerifier()` returns `null` or a stale verifier from a previous login. Either way the exchange fails and the `catch` block calls `clearAuth()`:

```ts
// authStore.ts:131
localStorage.removeItem('access_token');
```

`localStorage` is shared across same-origin frames. If this races against the main page's `setAccessToken` (which writes to `localStorage` after `loadUserProfile()` resolves), it **deletes the just-stored token from `localStorage`**. The Zustand store stays authenticated for the current session, but the token won't survive a page refresh — silent auth silently fails to persist.

**Recommended fix:**

```ts
// auth-initializer.tsx — top of the init useEffect
if (typeof window !== 'undefined' && window.self !== window.top) return;
```

Alternative: have the callback route detect a silent-auth context and avoid redirecting to `/redirecting` in that path.

**Applied fix** (`f700adc`): added `if (typeof window !== 'undefined' && window.self !== window.top) return;` at the top of the init `useEffect`, exactly as recommended. The guard is correctly placed before the `logoutSuccess` and `didStartInit` checks.

Note: the second `useEffect` (`if (logoutSuccess === 'true') clearAuth()`) does not have the iframe guard, but logouts never run through an iframe, so this is safe.

---

### ~~🟡 MEDIUM — `AuthInitializer` fires a second `init()` after post-login navigation~~ ✅ Fixed (`ecf892a`)

- [x] **Fix:** Prevent double-invocation of `init()` after redirect

**File:** `src/components/auth/auth-initializer.tsx:30-83`

When `RedirectingPage` calls `router.replace('/dashboard')`, `useSearchParams()` in `AuthInitializer` updates (`code` changes from `X` → `null`). Since `code` is in the deps array, `useEffect` fires again concurrently with the still-in-flight code exchange:

- Second `init()` run: no code → no error → `getValidStoredToken()` (may return null, token not yet in localStorage) → falls through to `getAccessTokenSilently()` (5 s iframe round-trip)
- `isAuthInitializing` remains `true` (set by the first run), so `AuthGuard` shows a loader — no visible regression, but unnecessary silent auth work is triggered on every successful login

**Recommended fix:** use a `useRef` run-once flag inside the effect, or check that the effect hasn't already been settled before calling `init()` again.

**Applied fix** (`ecf892a`): added `const didStartInit = useRef(false)` and a `if (didStartInit.current) return; didStartInit.current = true;` guard at the top of the effect, exactly as recommended.

---

### ~~🔴 HIGH — Logout from authenticated `/fundraisers/*` routes lands on `/login`~~ ✅ Fixed (`22cae9f`)

- [x] **Fix:** Extend `PROTECTED_PATH` to cover all auth-required routes, or invert the logic to a public-path allowlist

**File:** `src/lib/constants/auth.ts`, `src/stores/auth-store.ts:106-112`

Logging out from e.g. `/fundraisers/create` redirects the user back to `/fundraisers/create` after Auth0 clears the session. `AuthGuard` then boots them to `/login` — a two-step redirect that exposes the login page on every logout from an authenticated fundraiser route.

Root cause: `PROTECTED_PATH = ['/dashboard']` is too narrow. `/dashboard` logout works correctly — `isProtectedRoute('/dashboard')` returns `true` and the user is sent to `/explore`. But `isProtectedRoute('/fundraisers/create')` returns `false`, so the logout flow uses `/fundraisers/create` as the post-logout destination. `getSafeRedirectPath` then allows it through because `/fundraisers/create` starts with `/fundraisers/` (an allowed root). The two validation lists (`PROTECTED_PATH` and `ALLOWED_REDIRECT_ROOTS`) are not aligned — a path can pass both checks and still be an auth-required page.

The `isAllowedRedirect` fix suggested for the medium issue below would not catch this either — `/fundraisers/create` is in the allowed roots.

**Options:**

- Extend `PROTECTED_PATH` to include `/fundraisers/create` (and any other auth-only sub-paths)
- Invert the model: maintain an explicit public-path allowlist for post-logout redirects and default everything else to `DEFAULT_REDIRECT_PATH`

**Applied fix** (`22cae9f`): added `/fundraisers/create` and `/dashboard/fundraisers/edit` to `PROTECTED_PATH`. `/fundraisers/create` is the only currently auth-required route under `/fundraisers/`, so this fix is complete for the present app. `/dashboard/fundraisers/edit` is already covered by the existing `/dashboard` prefix (since `isProtectedRoute` uses `startsWith`), so that entry is redundant but harmless. The architectural misalignment between `PROTECTED_PATH` and `ALLOWED_REDIRECT_ROOTS` remains; any new auth-required route added under `/fundraisers/` will need a manual `PROTECTED_PATH` entry to avoid the same bug.

---

### ~~🟡 MEDIUM — `logout()` embeds unvalidated paths in the Auth0 `returnTo` URL~~ ✅ Fixed

- [x] **Fix:** Apply `getSafeRedirectPath` to `redirectAfterLogout` in `authStore.logout()`

**File:** `src/stores/auth-store.ts:106-127`

```ts
const safeRedirect = isProtectedRoute(redirectAfterLogout)
  ? DEFAULT_REDIRECT_PATH
  : redirectAfterLogout; // validated only against PROTECTED_PATH, not ALLOWED_REDIRECT_ROOTS
```

Any non-protected path the user is on gets embedded in the Auth0 `returnTo` URL without being checked against the allowlist. It's validated at receipt by `getSafeRedirectPath()` in `/redirecting`, so there is no open-redirect risk — but it's inconsistent with the validation posture applied everywhere else and could mislead future maintainers.

**Recommended fix:** chain both checks — `isProtectedRoute` first (to avoid sending the user back to an auth-required page), then `getSafeRedirectPath` (to reject paths outside the allowlist):

```ts
const uncheckedRedirect = isProtectedRoute(redirectAfterLogout)
  ? DEFAULT_REDIRECT_PATH
  : redirectAfterLogout;
const safeRedirect = getSafeRedirectPath(uncheckedRedirect);
```

Note: replacing `isProtectedRoute` with `getSafeRedirectPath` alone would break `/fundraisers/create` — `isAllowedRedirect` passes it through because `/fundraisers` is an allowed root, so the user would be sent back to an auth-required page after logout, re-introducing the two-step redirect bug fixed in `22cae9f`.

**Applied fix:** chained both checks as above. `getSafeRedirectPath` is imported alongside `isProtectedRoute` in `auth-store.ts`. `/redirecting` retains its own `getSafeRedirectPath` call independently — it is a public page that can receive arbitrary query params directly.

---

### ~~🟢 LOW — Dead-code ternary inside `if (nonce)` block~~ ✅ Fixed (`4d4e8f4`)

- [x] **Fix:** Simplify the ternary

**File:** `src/app/(standard)/redirecting/page.tsx:36-38`

```ts
if (nonce) {
  const redirectTo = nonce                          // always truthy here
    ? (getStoredOAuthState(nonce) ?? DEFAULT_REDIRECT_PATH)
    : DEFAULT_REDIRECT_PATH;                        // dead branch
```

Simplify:

```ts
if (nonce) {
  const redirectTo = getStoredOAuthState(nonce) ?? DEFAULT_REDIRECT_PATH;
```

**Applied fix** (`4d4e8f4`): ternary removed; the assignment now reads `const redirectTo = getStoredOAuthState(nonce) ?? DEFAULT_REDIRECT_PATH;` inside the `if (nonce)` block.

---

### ~~🟢 LOW — `getValidStoredToken` and `cleanUrl` lack SSR guards~~ ✅ Fixed (`9eae94d`)

- [x] **Fix:** Add `isBrowser` guards or restrict to a client-only module

**File:** `src/lib/utils/auth.ts:67-87`

Both functions reference `localStorage` / `window.location` directly without a browser environment check. All current callers are `'use client'` components, so there's no runtime issue today. However, if either utility is imported in a server context (e.g., a future server action or route handler) it will throw at runtime with no warning at the import site.

**Resolution:** Added a local `isBrowser()` guard in `src/lib/utils/auth.ts`. `getValidStoredToken` now returns `null` on the server and `cleanUrl` no-ops, so importing either from a server context is safe. (A shared `isBrowser` utility was not extracted — three files currently define their own one-liner; consolidation deferred.)

---

### 🟢 ~~LOW — `getSignInPath` reads `window.location` as a redundant fallback~~

- [x] **Fixed:** `getSignInPath` now takes a required `currentPath: string` and parses pathname/search from it — no more `window.location` read or `typeof window` branch. `SignInButton` derives its `currentPath` from `usePathname()` / `useSearchParams()` (matching `AuthGuard`), and its unused `redirectTo` prop was dropped.

**File:** `src/lib/auth/sign-in-redirect.ts`

The function previously accepted `redirectTo?: string` and also read `window.location` internally. Both callers already supplied a fully-formed `currentPath`, so the `window.location` read was a silent fallback that would have produced an unexpected path if the function were ever called without the parameter in a different context.

---

### ~~🟢 LOW — `AuthGuard` preserves error query params in `redirectTo`~~ N/A

- [x] **Not applicable** — error params (`error=auth_failed`, `reason=...`) are only set by the auth callback route, which redirects to `/?error=...` (the home page). The home page is not wrapped by `AuthGuard`, so these params never appear in a guarded route's URL under normal usage. No fix needed.

---

## No Regressions Found

- `jwt-utils.ts` deleted; all callers migrated to `@/lib/utils/auth` ✅
- No remaining `/dash` route references ✅
- `logoutSuccess` removed from login page; handled correctly in `/redirecting` ✅
- `clearAuth()` now resets `isAuthInitializing: false` ✅
- All `useEffect` dependency arrays are complete ✅
- PKCE verifier cleared only for regular login flow, not for silent auth ✅

---

## PR Description vs. Actual Code

| Claim                                               | Verdict                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| OAuth CSRF fix via nonce                            | ✅ Accurate                                                                                                                                  |
| sessionStorage nonce storage & cleanup              | ✅ Accurate                                                                                                                                  |
| `/redirecting` page introduction                    | ✅ Accurate                                                                                                                                  |
| Simplified `/api/auth/callback`                     | ✅ Accurate                                                                                                                                  |
| Settled flag, error detection, iframe ordering      | ✅ Accurate                                                                                                                                  |
| In-memory verifier for silent auth                  | ✅ Accurate                                                                                                                                  |
| Prevent login page for authenticated users          | ✅ Accurate                                                                                                                                  |
| Increased timeout to 5s                             | ✅ Code correct — ❌ JSDoc on `getAccessTokenSilently` still says "3s" (`auth0-config.ts:121`)                                               |
| Decoupled exchange from redirect (race-free)        | ❌ `AuthInitializer` and `RedirectingPage` run concurrently on the same URL; new races introduced, not eliminated                            |
| Simplified AuthGuard by removing redirect useEffect | ❌ AuthGuard still has two `useEffect` blocks with `router.replace()` calls; render-phase redirect was moved _into_ a useEffect, not removed |
| `RedirectPath` branded type safety                  | ❌ Not mentioned — a meaningful cross-cutting change across 5+ files that reviewers won't know to look for                                   |
| `logout()` redirect validation gap                  | ❌ Not disclosed — inconsistent with the validation posture the PR establishes everywhere else                                               |

---

## Summary

| Severity  | Issue                                                                                                          | Status              |
| --------- | -------------------------------------------------------------------------------------------------------------- | ------------------- |
| 🔴 High   | Silent-auth iframe `AuthInitializer` races to exchange the code; `clearAuth()` can wipe the localStorage token | [x] Fixed `f700adc` |
| 🔴 High   | Logout from authenticated `/fundraisers/*` routes bounces user to `/login`                                     | [x] Fixed `22cae9f` |
| 🟡 Medium | `AuthInitializer` double-fires `init()` after `router.replace()` changes `searchParams`                        | [x] Fixed `ecf892a` |
| 🟡 Medium | `logout()` embeds non-allowlist-validated paths in the Auth0 returnTo URL                                      | [x] Fixed `cbf116c` |
| 🟢 Low    | `getValidStoredToken` / `cleanUrl` lack SSR guards                                                             | [x] Fixed `9eae94d` |
| 🟢 Low    | Dead-code ternary in `redirecting/page.tsx`                                                                    | [x] Fixed `4d4e8f4` |
| 🟢 Low    | `getSignInPath` redundant `window.location` read                                                               | [x] Fixed `d5dd8c5` |
| 🟢 Low    | `AuthGuard` carries error query params through `redirectTo`                                                    | N/A                 |
