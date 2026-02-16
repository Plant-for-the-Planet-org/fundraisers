import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { Geist, Geist_Mono } from 'next/font/google';
import { LocaleInitializer } from '@/components/locale-initializer';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Fundraisers',
  description: 'Fundraising platform',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get locale from cookie (via request.ts)
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <LocaleInitializer initialLocale={locale} />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
