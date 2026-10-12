import type { Metadata } from 'next';

import { getLocale, getTranslations } from 'next-intl/server';
import { FOOTER_LINKS, getFooterLinkHref } from '@/components/footer/config';
import { PageToc, type TocItem } from '@/components/ui/page-toc';

// Written out with [ at ] and no mailto link, to keep the address away from spam bots.
const COPYRIGHT_EMAIL = 'copyright+fundraiser [ at ] plant-for-the-planet.org';

const SEND_ITEMS = ['explanation', 'location', 'contact', 'goodFaith'] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'Copyright' });
  const title = t('meta.title');
  const description = t('meta.description');

  return {
    title,
    description,
    alternates: { canonical: '/copyright' },
    openGraph: { title, description, type: 'article' },
    twitter: { card: 'summary', title, description },
  };
}

function externalHref(labelKey: 'privacy' | 'terms', locale: string): string {
  const link = FOOTER_LINKS.find(l => l.labelKey === labelKey);
  return link ? getFooterLinkHref(link, locale) : '#';
}

const linkClass =
  'font-medium text-foreground underline-offset-4 hover:underline';

function mailText(chunks: React.ReactNode) {
  return <span className='font-medium text-foreground'>{chunks}</span>;
}

function extLink(href: string) {
  const RichLink = (chunks: React.ReactNode) => (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className={linkClass}
    >
      {chunks}
    </a>
  );
  RichLink.displayName = 'RichLink';
  return RichLink;
}

export default async function CopyrightPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'Copyright' });

  const tocItems: TocItem[] = [
    { id: 'send', label: t('toc.send') },
    { id: 'next', label: t('toc.next') },
    { id: 'other', label: t('toc.other') },
  ];

  return (
    <div className='lg:flex lg:gap-12'>
      <aside className='hidden w-44 shrink-0 lg:block'>
        <PageToc items={tocItems} label={t('toc.label')} />
      </aside>

      <article className='min-w-0 flex-1'>
        <header className='space-y-4'>
          <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
            {t('title')}
          </h1>
          <p className='text-lg leading-relaxed text-muted-foreground'>
            {t('lead')}
          </p>
        </header>

        <div className='mt-12 space-y-12'>
          <section id='send' className='scroll-mt-24 space-y-3'>
            <h2 className='text-xl font-semibold tracking-tight'>
              {t('send.title')}
            </h2>
            <p className='leading-relaxed text-muted-foreground'>
              {t.rich('send.intro', {
                email: COPYRIGHT_EMAIL,
                mail: mailText,
              })}
            </p>
            <ul className='list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground'>
              {SEND_ITEMS.map(key => (
                <li key={key}>{t(`send.items.${key}`)}</li>
              ))}
            </ul>
            <p className='leading-relaxed text-muted-foreground'>
              {t('misuse.body')}
            </p>
          </section>

          <section id='next' className='scroll-mt-24 space-y-3'>
            <h2 className='text-xl font-semibold tracking-tight'>
              {t('next.title')}
            </h2>
            <p className='leading-relaxed text-muted-foreground'>
              {t('next.review')}
            </p>
            <p className='leading-relaxed text-muted-foreground'>
              {t('next.counter')}
            </p>
            <p className='leading-relaxed text-muted-foreground'>
              {t('next.repeat')}
            </p>
          </section>

          <section id='other' className='scroll-mt-24 space-y-3'>
            <h2 className='text-xl font-semibold tracking-tight'>
              {t('other.title')}
            </h2>
            <p className='leading-relaxed text-muted-foreground'>
              {t('other.body')}
            </p>
          </section>
        </div>

        <p className='mt-12 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground'>
          {t.rich('legal.body', {
            privacy: extLink(externalHref('privacy', locale)),
            terms: extLink(externalHref('terms', locale)),
          })}
        </p>
      </article>
    </div>
  );
}
