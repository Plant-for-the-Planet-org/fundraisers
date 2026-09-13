/**
 * Popup-based sign-in. The opener stays on the fundraiser page, the Auth0 hosted page runs in a small window.
 *
 * The popup is opened with a fixed window name. That name survives the round trip to Auth0 and back, so the popup can recognise itself on /redirecting and hand the authorization code to the opener instead of exchanging it.
 * Only the opener may exchange the code: it holds the PKCE verifier in its sessionStorage, and a failed exchange in the popup would wipe the shared access_token in localStorage.
 */

export const SIGN_IN_POPUP_NAME = 'planet-sign-in';
const RESULT_MESSAGE_TYPE = 'planet-sign-in-result';
const POLL_INTERVAL_MS = 300;

export type SignInPopupResult =
  | { status: 'code'; code: string; state: string | null }
  | { status: 'cancelled' }
  | { status: 'error'; reason: string; destination?: '/verify-email' };

export function isSignInPopupWindow(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.name === SIGN_IN_POPUP_NAME &&
    window.opener != null &&
    window.opener !== window
  );
}

/**
 * Must be called synchronously inside the click handler, before any await, or the browser treats the popup as unrequested and blocks it.
 * Returns null when blocked; callers fall back to the redirect flow.
 */
export function openSignInPopup(): Window | null {
  const width = 480;
  const height = 680;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
  const features = `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)}`;

  try {
    return window.open('', SIGN_IN_POPUP_NAME, features);
  } catch {
    return null;
  }
}

/** Runs inside the popup. Returns false when there is no opener to hand the code to. */
export function postSignInCodeToOpener(
  code: string,
  state: string | null
): boolean {
  const opener = window.opener as Window | null;
  if (!opener) return false;

  opener.postMessage(
    { type: RESULT_MESSAGE_TYPE, status: 'code', code, state },
    window.location.origin
  );
  return true;
}

/**
 * Runs in the opener. Resolves once the popup posts a code, closes, or lands on one of our error pages.
 * Error callbacks never reach /redirecting (the callback route sends them to / or /verify-email), so those are detected by reading the popup URL, which is allowed once it is back on our origin.
 */
export function waitForSignInPopup(popup: Window): Promise<SignInPopupResult> {
  return new Promise(resolve => {
    let settled = false;

    const finish = (result: SignInPopupResult) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      clearInterval(poll);
      if (!popup.closed) popup.close();
      resolve(result);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== popup) return;
      const data = event.data;
      if (!data || data.type !== RESULT_MESSAGE_TYPE) return;
      if (data.status !== 'code' || typeof data.code !== 'string') return;

      finish({
        status: 'code',
        code: data.code,
        state: typeof data.state === 'string' ? data.state : null,
      });
    };

    const poll = setInterval(() => {
      if (popup.closed) {
        finish({ status: 'cancelled' });
        return;
      }

      try {
        const url = new URL(popup.location.href);
        if (url.origin !== window.location.origin) return;

        if (url.pathname === '/verify-email') {
          finish({
            status: 'error',
            reason: 'email_not_verified',
            destination: '/verify-email',
          });
          return;
        }

        const error = url.searchParams.get('error');
        if (error) {
          finish({
            status: 'error',
            reason: url.searchParams.get('reason') ?? error,
          });
        }
      } catch {
        // Cross-origin while the popup is on Auth0. Expected.
      }
    }, POLL_INTERVAL_MS);

    window.addEventListener('message', onMessage);
  });
}
