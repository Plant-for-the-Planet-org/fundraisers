import type { RedirectPath } from '../types/auth';

import { DEFAULT_REDIRECT_PATH } from '../constants/auth';
import { storeOAuthState } from './oauth-state';
import {
  clearStoredCodeVerifier,
  generateCodeChallenge,
  generateCodeVerifier,
  getStoredCodeVerifier,
  storeCodeVerifier,
} from './pkce';

const AUTH0_DOMAIN = 'accounts.plant-for-the-planet.org';
const AUTH0_AUDIENCE = 'urn:plant-for-the-planet';

if (!process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID) {
  throw new Error(
    'Missing required environment variable: NEXT_PUBLIC_AUTH0_CLIENT_ID. ' +
      'Please add it to your .env file.'
  );
}

export const AUTH0_CONFIG = {
  domain: AUTH0_DOMAIN,
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
  audience: AUTH0_AUDIENCE,
  issuerBaseURL: `https://${AUTH0_DOMAIN}`,
  scope: 'openid profile email',
};

const SILENT_AUTH_TIMEOUT = 5000;

export interface Auth0TokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
}

/** Returns the OAuth callback URL based on current environment (browser vs server). */
function getRedirectUri(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/auth/callback`;
  }

  return `${process.env.BASE_URL}/api/auth/callback`;
}

/**
 * Builds the base URLSearchParams required for any Auth0 authorization request.
 * Generates a fresh PKCE verifier/challenge pair, stores the verifier in sessionStorage,
 * and merges in any extra params (e.g. prompt, connection, screen_hint).
 */
async function createBaseAuthorizeParams(
  redirectTo: RedirectPath = DEFAULT_REDIRECT_PATH,
  extraParams?: Record<string, string>
): Promise<URLSearchParams> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const nonce = crypto.randomUUID();

  // Persist PKCE verifier for token exchange
  storeCodeVerifier(codeVerifier);

  // Store redirect target mapped to nonce
  storeOAuthState(nonce, redirectTo);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH0_CONFIG.clientId,
    redirect_uri: getRedirectUri(),
    scope: AUTH0_CONFIG.scope,
    audience: AUTH0_CONFIG.audience,
    state: nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      params.append(key, value);
    });
  }

  return params;
}

/**
 * Constructs the full Auth0 /authorize URL from a given set of URLSearchParams.
 */
function buildAuthorizeUrl(params: URLSearchParams): string {
  return `${AUTH0_CONFIG.issuerBaseURL}/authorize?${params.toString()}`;
}

/**
 * Builds an authorization URL with prompt=none for silent authentication.
 * Auth0 will attempt to reuse an existing session without showing any UI.
 */
async function buildSilentAuthorizeUrl(
  inMemoryVerifier: string
): Promise<string> {
  const codeChallenge = await generateCodeChallenge(inMemoryVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH0_CONFIG.clientId,
    redirect_uri: getRedirectUri(),
    scope: AUTH0_CONFIG.scope,
    audience: AUTH0_CONFIG.audience,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'none',
  });

  return buildAuthorizeUrl(params);
}

/**
 * Attempts silent authentication with Auth0 using a hidden iframe.
 *
 * Flow:
 * 1. Loads the Auth0 `/authorize` endpoint with `prompt=none` in a hidden iframe.
 * 2. If the user already has an Auth0 session, Auth0 redirects to our callback
 *    and eventually lands on our domain with an authorization `code`.
 * 3. Once the iframe lands on our origin, we extract the `code` from the URL
 *    and exchange it for tokens.
 *
 * Safety mechanisms:
 * - A timeout (3s) prevents the app from waiting indefinitely if silent auth fails
 *   (e.g., no Auth0 session or blocked third-party cookies).
 * - `origin` check ensures we only read URLs from our own domain to avoid
 *   cross-origin access errors.
 * - `cleanup()` removes the iframe and clears timers once the flow completes.
 *
 * Returns:
 * - `access_token` if silent authentication succeeds
 * - `null` if no session exists or the operation times out
 */
export async function getAccessTokenSilently(): Promise<string | null> {
  try {
    const verifier = generateCodeVerifier();
    const silentUrl = await buildSilentAuthorizeUrl(verifier);

    const code = await new Promise<string | null>(resolve => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      const settled = { current: false };

      const timeout = setTimeout(() => {
        cleanup();
        resolve(null);
      }, SILENT_AUTH_TIMEOUT);

      function cleanup() {
        if (settled.current) return;
        settled.current = true;
        clearTimeout(timeout);
        iframe.remove();
      }

      iframe.onload = () => {
        if (settled.current) return;
        try {
          const urlStr = iframe.contentWindow?.location.href;

          if (!urlStr) return;

          const url = new URL(urlStr);

          if (url.origin !== window.location.origin) return;

          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (code) {
            cleanup();
            resolve(code);
          }

          if (error) {
            cleanup();
            resolve(null);
          }
        } catch {
          // Expected cross-origin error before redirect
        }
      };

      iframe.onerror = () => {
        cleanup();
        resolve(null);
      };
      iframe.src = silentUrl;
      document.body.appendChild(iframe);
    });

    if (!code) return null;

    const tokens = await exchangeCodeForTokens(code, verifier);
    return tokens.access_token;
  } catch (err) {
    console.error('Silent auth failed:', err);
    return null;
  }
}
/**
 * Builds the Auth0 authorize URL for the default Universal Login screen (email/password).
 * Optionally accepts a login_hint to pre-fill the email field.
 */
export async function buildUniversalLoginAuthorizeUrl(
  redirectTo: RedirectPath = DEFAULT_REDIRECT_PATH,
  loginHint?: string
): Promise<string> {
  const params = await createBaseAuthorizeParams(redirectTo);

  if (loginHint) {
    params.append('login_hint', loginHint);
  }

  return buildAuthorizeUrl(params);
}

/**
 * Builds the Auth0 authorize URL targeting the signup screen via screen_hint=signup.
 * Optionally accepts a login_hint to pre-fill the email field.
 */
export async function buildSignupAuthorizeUrl(
  redirectTo: RedirectPath = DEFAULT_REDIRECT_PATH,
  loginHint?: string
): Promise<string> {
  const params = await createBaseAuthorizeParams(redirectTo, {
    screen_hint: 'signup', // Tell Auth0 to open signup screen
  });

  if (loginHint) {
    params.append('login_hint', loginHint);
  }

  return buildAuthorizeUrl(params);
}

/**
 * Builds the Auth0 authorize URL for a specific social/enterprise connection (e.g. 'google-oauth2').
 * The connection param tells Auth0 to skip the login screen and go directly to the provider.
 */
export async function buildSocialAuthorizeUrl(
  connection: string,
  redirectTo: RedirectPath = DEFAULT_REDIRECT_PATH
): Promise<string> {
  const params = await createBaseAuthorizeParams(redirectTo, {
    connection,
  });

  return buildAuthorizeUrl(params);
}

/**
 * Exchanges an authorization code for access, ID, and optionally refresh tokens.
 * Retrieves the stored PKCE code verifier, sends a token request to Auth0,
 * and clears the verifier from sessionStorage once the exchange is complete (success or failure).
 */
export async function exchangeCodeForTokens(
  code: string,
  inMemoryVerifier?: string // optional verifier for silent auth
): Promise<Auth0TokenResponse> {
  // Use in-memory verifier if provided, otherwise fallback to sessionStorage
  const codeVerifier = inMemoryVerifier ?? getStoredCodeVerifier();

  if (!codeVerifier) {
    throw new Error(
      'Code verifier not found. Please restart the login process.'
    );
  }

  try {
    const response = await fetch(`${AUTH0_CONFIG.issuerBaseURL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: AUTH0_CONFIG.clientId,
        code,
        redirect_uri: getRedirectUri(),
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Token exchange failed: ${errorData.error_description || errorData.error}`
      );
    }

    const tokens: Auth0TokenResponse = await response.json();

    return tokens;
  } catch (error) {
    throw error;
  } finally {
    /**
     * Only clear sessionStorage verifier if we are using
     * the redirect-based login flow.
     *
     * Silent auth keeps the verifier in memory, so it
     * must NOT clear sessionStorage.
     */
    if (!inMemoryVerifier) {
      clearStoredCodeVerifier();
    }
  }
}
