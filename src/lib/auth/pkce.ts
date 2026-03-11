const PKCE_STORAGE_KEY = 'pkce_code_verifier';

export function storeCodeVerifier(verifier: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PKCE_STORAGE_KEY, verifier);
}

export function getStoredCodeVerifier(): string | null {
  return sessionStorage.getItem(PKCE_STORAGE_KEY);
}

export function clearStoredCodeVerifier(): void {
  return sessionStorage.removeItem(PKCE_STORAGE_KEY);
}

const PKCE_BYTE_LENGTH = 32;

function base64URLEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generateCodeVerifier(): string {
  if (typeof window === 'undefined' || !window.crypto) {
    throw new Error('Secure random generator not available');
  }

  const bytes = new Uint8Array(PKCE_BYTE_LENGTH);
  window.crypto.getRandomValues(bytes);

  return base64URLEncode(bytes);
}

export async function generateCodeChallenge(
  codeVerifier: string
): Promise<string> {
  const textEncoder = new TextEncoder();
  // Convert verifier string into bytes
  const verifierBytes = textEncoder.encode(codeVerifier);
  // Create SHA-256 hash from the bytes
  const sha256HashBuffer = await crypto.subtle.digest('SHA-256', verifierBytes);
  // Convert hash (ArrayBuffer) into Uint8Array
  const hashBytes = new Uint8Array(sha256HashBuffer);
  // Convert to Base64URL string (PKCE requirement)
  return base64URLEncode(hashBytes);
}
