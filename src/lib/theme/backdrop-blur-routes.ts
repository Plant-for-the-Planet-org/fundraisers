export function shouldBlurForPathname(pathname: string): boolean {
  return (
    pathname === '/fundraisers/create' ||
    pathname.startsWith('/dashboard/fundraisers/edit/')
  );
}
