export function isApplePayEnabled(): boolean {
  const val = process.env.NEXT_PUBLIC_DISABLE_APPLE_PAY;
  if (val === undefined) return true;
  return val.toLowerCase() !== 'true';
}

export function isGooglePayEnabled(): boolean {
  const val = process.env.NEXT_PUBLIC_DISABLE_GOOGLE_PAY;
  if (val === undefined) return true;
  return val.toLowerCase() !== 'true';
}
