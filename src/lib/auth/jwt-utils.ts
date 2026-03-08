type JwtPayload = {
  exp?: number;
};

export function isTokenExpired(token: string, bufferSeconds = 30): boolean {
  try {
    const [, base64Url] = token.split('.');
    if (!base64Url) return true;

    // JWT payload is Base64URL encoded, but atob() expects Base64.
    // Convert URL-safe chars and restore '=' padding before decoding.
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const payload: JwtPayload = JSON.parse(atob(padded));

    if (!payload.exp) return false;

    const now = Math.floor(Date.now() / 1000);

    return now >= payload.exp - bufferSeconds;
  } catch {
    return true;
  }
}
