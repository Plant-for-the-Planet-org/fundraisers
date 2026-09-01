import type { ComponentType } from 'react';
import type { Metadata } from 'next';

import { getLocale, getTranslations } from 'next-intl/server';
import {
  Activity,
  BarChart3,
  HeartHandshake,
  KeyRound,
  Languages,
  PlayCircle,
  Scale,
  Sparkles,
} from 'lucide-react';
import { FOOTER_LINKS, getFooterLinkHref } from '@/components/footer/config';
import { CookiesToc, type TocItem } from './cookies-toc';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'Cookies' });
  const title = t('meta.title');
  const description = t('meta.description');

  return {
    title,
    description,
    alternates: { canonical: '/cookies' },
    openGraph: { title, description, type: 'article' },
    twitter: { card: 'summary', title, description },
  };
}

// Strictly-necessary items we store, paired with an icon. Copy lives in
// translations under `Cookies.store.items.<key>`. The key is a literal union so
// next-intl can type-check the `store.items.${key}.*` message paths.
const STORE_ITEMS: {
  key: 'session' | 'language' | 'consent';
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { key: 'session', Icon: KeyRound },
  { key: 'language', Icon: Languages },
  { key: 'consent', Icon: PlayCircle },
];

function externalHref(labelKey: 'privacy' | 'terms', locale: string): string {
  const link = FOOTER_LINKS.find(l => l.labelKey === labelKey);
  return link ? getFooterLinkHref(link, locale) : '#';
}

// CELEX ids of the EU instruments we cite.
const EU_LAW = {
  gdpr: '32016R0679', // Regulation (EU) 2016/679 (GDPR)
  eprivacy: '32002L0058', // Directive 2002/58/EC (ePrivacy)
} as const;

// Link to the official EUR-Lex text, served in the reader's language.
function euLawHref(law: keyof typeof EU_LAW, locale: string): string {
  const lang = locale === 'de' ? 'DE' : 'EN';
  return `https://eur-lex.europa.eu/legal-content/${lang}/TXT/?uri=CELEX:${EU_LAW[law]}`;
}

// Chunk renderer for an external link inside a t.rich(...) translation.
function extLink(href: string) {
  const RichLink = (chunks: React.ReactNode) => (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className='font-medium text-foreground underline-offset-4 hover:underline'
    >
      {chunks}
    </a>
  );
  RichLink.displayName = 'RichLink';
  return RichLink;
}

export default async function CookiesPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'Cookies' });

  const privacyHref = externalHref('privacy', locale);
  const termsHref = externalHref('terms', locale);
  const gdprHref = euLawHref('gdpr', locale);
  const eprivacyHref = euLawHref('eprivacy', locale);

  const tocItems: TocItem[] = [
    { id: 'law', label: t('toc.law') },
    { id: 'store', label: t('toc.store') },
    { id: 'visits', label: t('toc.visits') },
    { id: 'video', label: t('toc.video') },
    { id: 'monitoring', label: t('toc.monitoring') },
    { id: 'payments', label: t('toc.payments') },
    { id: 'manifesto', label: t('toc.manifesto') },
  ];

  return (
    <div className='lg:flex lg:gap-12'>
      <aside className='hidden w-44 shrink-0 lg:block'>
        <CookiesToc items={tocItems} label={t('toc.label')} />
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

        <p className='mt-8 rounded-xl border border-border bg-muted/50 p-5 text-base font-medium leading-relaxed'>
          {t('summary')}
        </p>

        <div className='mt-12 space-y-12'>
          <Section id='law' icon={Scale} title={t('law.title')}>
            <p className='leading-relaxed text-muted-foreground'>
              {t.rich('law.p1', {
                gdpr: extLink(gdprHref),
                eprivacy: extLink(eprivacyHref),
              })}
            </p>
            <p className='leading-relaxed text-muted-foreground'>
              {t('law.p2')}
            </p>
          </Section>

          <Section id='store' icon={KeyRound} title={t('store.title')}>
            <p className='leading-relaxed text-muted-foreground'>
              {t('store.intro')}
            </p>
            <ul className='mt-2 divide-y divide-border rounded-xl border border-border'>
              {STORE_ITEMS.map(({ key, Icon }) => (
                <li key={key} className='flex gap-4 p-4'>
                  <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted'>
                    <Icon className='h-4 w-4 text-muted-foreground' />
                  </span>
                  <div className='space-y-1'>
                    <p className='font-medium'>
                      {t(`store.items.${key}.title`)}
                    </p>
                    <p className='text-sm leading-relaxed text-muted-foreground'>
                      {t(`store.items.${key}.body`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section id='visits' icon={BarChart3} title={t('visits.title')}>
            <p className='leading-relaxed text-muted-foreground'>
              {t('visits.body')}
            </p>
          </Section>

          <Section id='video' icon={PlayCircle} title={t('video.title')}>
            <p className='leading-relaxed text-muted-foreground'>
              {t('video.body')}
            </p>
          </Section>

          <Section
            id='monitoring'
            icon={Activity}
            title={t('monitoring.title')}
          >
            <p className='leading-relaxed text-muted-foreground'>
              {t('monitoring.body')}
            </p>
          </Section>

          <Section
            id='payments'
            icon={HeartHandshake}
            title={t('payments.title')}
          >
            <p className='leading-relaxed text-muted-foreground'>
              {t('payments.body')}
            </p>
          </Section>
        </div>

        <section
          id='manifesto'
          className='mt-12 scroll-mt-24 space-y-4 rounded-2xl bg-muted/40 p-6 sm:p-8'
        >
          <h2 className='flex items-center gap-2 text-xl font-semibold tracking-tight'>
            <Sparkles className='h-5 w-5 text-foreground' aria-hidden='true' />
            {t('manifesto.title')}
          </h2>
          <p className='leading-relaxed text-muted-foreground'>
            {t('manifesto.p1')}
          </p>
          <p className='leading-relaxed text-muted-foreground'>
            {t('manifesto.p2')}
          </p>
          <p className='font-medium leading-relaxed text-foreground'>
            {t('manifesto.cta')}
          </p>
        </section>

        <p className='mt-12 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground'>
          {t.rich('legal.body', {
            privacy: extLink(privacyHref),
            terms: extLink(termsHref),
          })}
        </p>
      </article>
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className='scroll-mt-24 space-y-3'>
      <h2 className='flex items-center gap-2 text-xl font-semibold tracking-tight'>
        <Icon className='h-5 w-5 text-muted-foreground' aria-hidden={true} />
        {title}
      </h2>
      {children}
    </section>
  );
}
