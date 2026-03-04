import {
  clearStoredCodeVerifier,
  generateCodeChallenge,
  generateCodeVerifier,
  getStoredCodeVerifier,
  storeCodeVerifier,
} from './pkce';

export const AUTH0_CONFIG = {
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN!,
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!,
  audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE!,
  issuerBaseURL: `https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}`,
  scope: 'openid profile email',
};

export interface Auth0TokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
}

const DEFAULT_REDIRECT_PATH = '/dash';

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
  redirectTo: string = '/dash',
  extraParams?: Record<string, string>
): Promise<URLSearchParams> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Persist PKCE verifier for token exchange
  storeCodeVerifier(codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH0_CONFIG.clientId,
    redirect_uri: getRedirectUri(),
    scope: AUTH0_CONFIG.scope,
    audience: AUTH0_CONFIG.audience,
    state: redirectTo, // (Can later be upgraded to secure state handling)
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
  redirectTo: string = DEFAULT_REDIRECT_PATH
): Promise<string> {
  const params = await createBaseAuthorizeParams(redirectTo, {
    prompt: 'none',
  });

  return buildAuthorizeUrl(params);
}

/**
 * Attempts silent sign-in by loading the Auth0 silent auth URL inside a hidden iframe.
 * Resolves to true if the iframe is redirected to the callback URL (session reuse succeeded),
 * or false if Auth0 requires interaction, the request times out (5s), or a cross-origin error occurs.
 */
export async function trySignInSilently(
  redirectTo: string = DEFAULT_REDIRECT_PATH
): Promise<boolean> {
  try {
    const silentUrl = await buildSilentAuthorizeUrl(redirectTo);

    // Create a hidden iframe to attempt silent auth
    return new Promise(resolve => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = silentUrl;

      const cleanup = () => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      };

      const timeout = setTimeout(() => {
        cleanup();
        resolve(false);
      }, 5000);

      iframe.onload = () => {
        try {
          // Check if we got redirected to callback (success)
          if (
            iframe.contentWindow?.location.href.includes('/api/auth/callback')
          ) {
            clearTimeout(timeout);
            const callbackUrl = iframe.contentWindow.location.href;

            cleanup();

            window.location.href = callbackUrl;
            resolve(true);
          } else {
            clearTimeout(timeout);
            cleanup();
            resolve(false);
          }
        } catch {
          // Cross-origin error → still on Auth0 domain
          clearTimeout(timeout);
          cleanup();
          resolve(false);
        }
      };

      iframe.onerror = () => {
        clearTimeout(timeout);
        cleanup();
        resolve(false);
      };

      document.body.appendChild(iframe);
    });
  } catch (error) {
    console.error('Silent auth failed:', error);
    return false;
  }
}

/**
 * Builds the Auth0 authorize URL for the default Universal Login screen (email/password).
 * Optionally accepts a login_hint to pre-fill the email field.
 */
export async function buildUniversalLoginAuthorizeUrl(
  redirectTo: string = DEFAULT_REDIRECT_PATH,
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
  redirectTo: string = DEFAULT_REDIRECT_PATH,
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
  redirectTo: string = DEFAULT_REDIRECT_PATH
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
  code: string
): Promise<Auth0TokenResponse> {
  const codeVerifier = getStoredCodeVerifier();

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
    clearStoredCodeVerifier();
  }
}
