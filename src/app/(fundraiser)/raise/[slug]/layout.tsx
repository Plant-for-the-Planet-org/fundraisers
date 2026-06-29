import type { ReactNode } from 'react';

import { getLocale } from 'next-intl/server';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { PlatformAPIError } from '@/lib/api/platform-fetch';
import { buildTheme } from '@/lib/theme/build-theme';
import { DEFAULT_THEME } from '@/lib/theme/themes';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { ThemeShell } from '@/components/theme/theme-shell';
import { MainContent } from '@/components/ui/main-content';

export default async function FundraiserLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();

  let theme;
  try {
    const fundraiser = await getCachedFundraiser(slug, locale);
    theme = buildTheme(fundraiser.settings?.theme ?? null);
  } catch (e) {
    if (
      e instanceof PlatformAPIError &&
      e.status &&
      [401, 403, 404, 405].includes(e.status)
    ) {
      theme = DEFAULT_THEME;
    } else {
      throw e;
    }
  }

  return (
    <ThemeShell initialTheme={theme} blurMainContentBackdrop>
      <Header />
      <MainContent>{children}</MainContent>
      <Footer />
    </ThemeShell>
  );
}
