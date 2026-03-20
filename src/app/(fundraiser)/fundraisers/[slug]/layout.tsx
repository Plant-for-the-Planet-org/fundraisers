import type { ReactNode } from 'react';
import { ThemeShell } from '@/components/theme/theme-shell';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MainContent } from '@/components/ui/main-content';
import { Toaster } from 'sonner';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { buildTheme } from '@/lib/theme/build-theme';
import { DEFAULT_THEME } from '@/lib/theme/themes';
import { PlatformAPIError } from '@/lib/api/external-client';

export default async function FundraiserLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let theme;
  try {
    const fundraiser = await getCachedFundraiser(slug);
    theme = buildTheme(fundraiser.settings?.theme ?? null);
  } catch (e) {
    if (e instanceof PlatformAPIError && e.status === 404) {
      theme = DEFAULT_THEME;
    } else {
      throw e;
    }
  }

  return (
    <ThemeShell initialTheme={theme}>
      <Header />
      <MainContent>{children}</MainContent>
      <Footer />
      <Toaster richColors />
    </ThemeShell>
  );
}
