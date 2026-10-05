# Sign-in modal and popup

Sign-in on fundraiser pages opens a modal instead of leaving for `/login`. The Auth0 hosted page runs in a popup window, so the page underneath keeps its state. The same form is shown on `/login` next to a picture, for guarded routes and deep links.

## Pieces

- `src/components/auth/sign-in-card.tsx`: the one form. Header slot, email section, social buttons. `dialog` and `plain` variants.
- `src/components/auth/sign-in-modal.tsx`: mounts the card in a Dialog. Lives in the root layout, opened through `openSignInModal(returnTo)` from `src/stores/sign-in-modal-store.ts`.
- `src/components/auth/use-sign-in.ts`: decides popup or redirect and handles the outcome.
- `src/lib/auth/start-sign-in.ts`: builds the authorize URL for email, sign-up or a social connection, and runs either flow.
- `src/lib/auth/sign-in-popup.ts`: opens the popup, waits for it, and lets the popup hand its code to the opener.

## Popup flow

1. The click handler opens a blank popup synchronously, before any `await`, or the browser blocks it. If it is blocked, the redirect flow runs instead.
2. The authorize URL is built as before. The PKCE verifier and the `state` nonce land in the opener's sessionStorage.
3. The popup navigates to Auth0 and comes back through `/api/auth/callback` to `/redirecting?code=...&state=...`. No new callback URL is needed in the Auth0 tenant.
4. On `/redirecting`, the popup recognises itself by its window name, posts the code to the opener with `postMessage`, and closes. `AuthInitializer` stays idle in the popup, since a failed exchange there would clear the shared `access_token` in localStorage.
5. The opener checks the message origin and source, exchanges the code with its own verifier, and updates the auth store. The modal closes.

Error callbacks never reach `/redirecting`. The opener polls the popup URL, which is readable once it is back on our origin, and treats `/verify-email` and `?error=` as outcomes.

## Fallbacks

- On phones the popup opens as a new tab. It posts the code back and closes itself the same way. Only a blocked window falls back to the redirect flow, which loses page state such as an open donation overlay.
- Closing the popup keeps the modal open.
- After a popup sign-in the modal navigates to `returnTo` only when it differs from the current page and is an allowed path. The host-invite bar relies on this to resume an accept.

## Theming

Dialogs portal to `<body>`, outside the theme wrapper. `ThemeShell` mirrors `--accent-color` and `--cta-foreground` on the root element so the modal follows the fundraiser's accent.

## Donation nudge

The donor section of the donation overlay shows "Already have an account? Sign in" while signed out. It opens the same modal. Signing in swaps the typed donor details for the account's profile and saved addresses, and keeps amount, frequency and payment choice. The nudge hides once the donor has started typing card or IBAN details, tracked by `hasPaymentInput` in the donation form context.

## Switch account

While signed in, the same slot shows "Not {name}? Switch account" once the last interactive sign-in is more than four hours old (`RECENT_SIGN_IN_MAX_AGE_MS` in `src/lib/auth/auth-time.ts`, overridable with `NEXT_PUBLIC_SWITCH_ACCOUNT_AFTER_MS`, set it to `0` to always show the link while testing). A sign-in from minutes ago is almost always the right person. Hours later, on a shared laptop or an event tablet, it may not be. The link hides under the same `hasPaymentInput` rule as the nudge, and while impersonating.

The link opens the modal in `switch-account` mode. The authorize URL gets `prompt=login`, so Auth0 asks for credentials even though a session exists. The new token replaces the old one without a logout round trip, and the donor section swaps to the new profile. Closing the popup changes nothing. The modal does not auto-close on auth in this mode, since the person is signed in the whole time.

The sign-in time is our own timestamp, written when an interactive token exchange succeeds. It lives in localStorage as `auth_time` next to `access_token` and is mirrored as `authTime` in the auth store. Silent refreshes pass their PKCE verifier in memory, and that marker is what keeps them from touching it. A session that arrived only through silent auth, for example after signing in on another Planet app, has no value and counts as old. Sign-out clears it with the token.
