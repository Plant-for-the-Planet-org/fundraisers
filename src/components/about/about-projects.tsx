import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AboutGlobeLazy } from './about-globe-lazy';
import {
  FORESTCLOUD_URL,
  PROJECT_VERIFICATION_URL,
  RESTORATION_STANDARDS_URL,
} from './about-links';

// Bouquets from the create flow, so the names match what people pick later.
const BOUQUETS = [
  'close-to-the-sea',
  'amazon-route',
  'ancestral-lands',
  'where-your-coffee-grows',
] as const;

const STATS = ['projects', 'countries', 'organizations'] as const;

const LINK_CLASS =
  'font-medium text-foreground underline underline-offset-4 hover:text-accent-color';

// A graph-paper grid behind this block only, with no fill, so the page background shows through. Drawn from the border colour, so it follows light and dark mode.
export function AboutProjects() {
  const t = useTranslations('About.projects');
  const tBundles = useTranslations('Bundles.entries');

  const externalLink = (href: string) =>
    function ExternalLink(chunks: React.ReactNode) {
      return (
        <a
          href={href}
          target='_blank'
          rel='noopener noreferrer'
          className={LINK_CLASS}
        >
          {chunks}
        </a>
      );
    };

  return (
    <section className='-mx-4 border-y border-border/60 px-4 py-8 [background-image:linear-gradient(hsl(var(--border)/0.6)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.6)_1px,transparent_1px)] [background-size:28px_28px] sm:rounded-3xl sm:border lg:-mx-8 lg:px-8 md:grid md:grid-cols-[minmax(0,1fr)_260px] md:items-center md:gap-8 lg:grid-cols-[minmax(0,1fr)_300px]'>
      <div className='space-y-5'>
        <div className='space-y-3'>
          <p className='text-xs font-semibold uppercase tracking-wider text-accent-color'>
            {t('eyebrow')}
          </p>
          <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
            {t('title')}
          </h2>
          <p className='leading-relaxed text-muted-foreground'>
            {t.rich('lead', {
              standards: externalLink(RESTORATION_STANDARDS_URL),
              verification: externalLink(PROJECT_VERIFICATION_URL),
            })}
          </p>
        </div>

        <dl className='flex flex-wrap gap-x-8 gap-y-3'>
          {STATS.map(key => (
            <div key={key} className='flex flex-col-reverse'>
              <dt className='text-xs text-muted-foreground'>
                {t(`stats.${key}.label`)}
              </dt>
              <dd className='text-2xl font-semibold tracking-tight text-accent-color'>
                {t(`stats.${key}.value`)}
              </dd>
            </div>
          ))}
        </dl>

        <div className='space-y-2'>
          <p className='text-sm font-medium'>{t('bouquets')}</p>
          <ul className='flex list-none flex-wrap gap-2 p-0'>
            {BOUQUETS.map(slug => (
              <li key={slug}>
                <Link
                  href='/fundraisers/create'
                  className='inline-flex h-8 items-center rounded-full border border-accent-color/20 bg-accent-color/10 px-3 text-sm text-accent-color transition-colors hover:bg-accent-color/20'
                >
                  {tBundles(`${slug}.label`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className='text-xs text-muted-foreground'>
          {t.rich('poweredBy', { link: externalLink(FORESTCLOUD_URL) })}
        </p>
      </div>

      <div className='mx-auto mt-8 w-full max-w-[280px] md:mt-0 md:max-w-none'>
        <AboutGlobeLazy label={t('globeAlt')} />
      </div>
    </section>
  );
}
