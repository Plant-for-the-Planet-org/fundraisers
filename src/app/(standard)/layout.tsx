import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { getFontStack } from '@/lib/theme/font-utils';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default async function StandardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Note: theme is also resolved in root layout for <html> class.
  // getThemeForPath is a pure in-memory lookup so duplication is harmless.
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '/';
  const theme = getThemeForPath(pathname);

  return (
    <ThemeProvider theme={theme}>
      <div
        className={`${theme.mode} relative min-h-screen flex flex-col`}
        style={
          {
            fontFamily: getFontStack(theme.bodyFont),
            '--theme-title-font': getFontStack(theme.titleFont),
            '--accent-color': getAccentColor(theme.accent),
          } as React.CSSProperties
        }
      >
        <div
          className={`fixed inset-0 ${theme.background} transition-colors duration-300`}
        />
        <div className='relative z-10 flex flex-col min-h-screen'>
          <Header />
          <main className='flex-1'>
            <div className='max-w-[960px] rounded-2xl backdrop-blur-[10px] w-full mx-auto my-8 px-4 py-4'>
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </ThemeProvider>
  );
}
