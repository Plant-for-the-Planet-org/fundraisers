export function shouldBlurForPathname(pathname: string): boolean {
  return (
    pathname === '/fundraisers/create' ||
    // Browsing: the page's tree pattern is softened behind the content, so the text reads calmly.
    pathname === '/explore' ||
    pathname.startsWith('/explore/') ||
    pathname.startsWith('/dashboard/fundraisers/edit/')
  );
}
