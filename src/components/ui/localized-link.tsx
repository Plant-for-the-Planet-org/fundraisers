'use client';

import type { ComponentProps } from 'react';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { localizeHref } from '@/i18n/localized-paths';

/** `next/link` that keeps the visitor in their language: `/explore` becomes `/de/explore` on a German page. Other hrefs pass through unchanged. */
export function LocalizedLink({ href, ...props }: ComponentProps<typeof Link>) {
  const locale = useLocale();
  return (
    <Link
      href={typeof href === 'string' ? localizeHref(href, locale) : href}
      {...props}
    />
  );
}
