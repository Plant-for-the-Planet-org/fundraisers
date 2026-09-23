import type { ComponentType } from 'react';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { BriefcaseIcon, CakeCandlesIcon } from '@/components/ui/duotone-icons';
import { SeedlingIcon } from '@/components/ui/plant-icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AboutExampleCard } from './about-example-card';
import { AboutForestGraphic } from './about-forest-graphic';
import { ABOUT_IMAGES } from './about-images';
import { FORESTCLOUD_URL } from './about-links';
import { AboutStorySlider } from './about-story-slider';

type TabKey = 'celebrations' | 'companies' | 'organizations';
type CardKey = 'c1' | 'c2' | 'c3';

interface IconTile {
  Icon: ComponentType<{ className?: string }>;
  tile: string;
}

const STICKER: Record<TabKey, IconTile & { rotate: string }> = {
  celebrations: {
    Icon: CakeCandlesIcon,
    tile: 'bg-soft-gold text-amber-700',
    rotate: '-rotate-6',
  },
  companies: {
    Icon: BriefcaseIcon,
    tile: 'bg-soft-blue text-blue-700',
    rotate: 'rotate-6',
  },
  organizations: {
    Icon: SeedlingIcon,
    tile: 'bg-planet-100 text-planet-600',
    rotate: '-rotate-3',
  },
};

const CARD_IMAGES: Record<'celebrations' | 'companies', string[]> = {
  celebrations: [
    ABOUT_IMAGES.child,
    ABOUT_IMAGES.monitoring,
    ABOUT_IMAGES.planting,
  ],
  companies: [
    ABOUT_IMAGES.monitoring,
    ABOUT_IMAGES.ambassadors,
    ABOUT_IMAGES.ghana,
  ],
};

// Sample numbers for the example cards, so they read exactly like the Explore list.
const CARD_STATS: Record<
  'celebrations' | 'companies',
  { raised?: number; donations?: number }[]
> = {
  celebrations: [
    { raised: 1240, donations: 38 },
    { raised: 3650, donations: 71 },
    { raised: 860, donations: 24 },
  ],
  companies: [
    { raised: 11200, donations: 184 },
    { raised: 9400, donations: 142 },
    { raised: 9750, donations: 318 },
  ],
};

const TABS: TabKey[] = ['celebrations', 'companies', 'organizations'];
const CARDS: CardKey[] = ['c1', 'c2', 'c3'];
const STORIES = ['s1', 's2', 's3'] as const;
const MOMENTS = ['m1', 'm2', 'm3'] as const;

export function AboutWhoFor() {
  const t = useTranslations('About.who');

  // The panel tint follows the active tab through :has() on the active panel, so no client state is needed.
  return (
    <section className='-mx-4 space-y-6 bg-soft-gold px-4 py-8 transition-colors duration-500 sm:rounded-3xl sm:py-10 lg:-mx-8 lg:px-8 has-[[role=tabpanel][id$=companies][data-state=active]]:bg-soft-blue has-[[role=tabpanel][id$=organizations][data-state=active]]:bg-planet-50 dark:bg-muted dark:has-[[role=tabpanel][id$=companies][data-state=active]]:bg-muted dark:has-[[role=tabpanel][id$=organizations][data-state=active]]:bg-muted'>
      <div className='space-y-2'>
        <h2 className='text-2xl font-semibold tracking-tight text-accent-color sm:text-3xl'>
          {t('title')}
        </h2>
        <p className='text-lg leading-relaxed text-muted-foreground'>
          {t('lead')}
        </p>
      </div>

      <Tabs defaultValue='celebrations' className='gap-6'>
        <TabsList
          aria-label={t('title')}
          className='w-fit max-w-full gap-1.5 rounded-full border border-accent-color/20 bg-background/80 p-1.5 group-data-[orientation=horizontal]/tabs:h-12 sm:gap-2 sm:group-data-[orientation=horizontal]/tabs:h-14'
        >
          {TABS.map(key => {
            const TabIcon = STICKER[key].Icon;
            return (
              <TabsTrigger
                key={key}
                value={key}
                className='h-full gap-2 rounded-full px-4 text-foreground/70 sm:px-5 sm:text-[15px] data-[state=active]:bg-accent-color data-[state=active]:text-[var(--cta-foreground,#fff)] data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-accent-color dark:data-[state=active]:text-[var(--cta-foreground,#fff)]'
              >
                <TabIcon className='hidden sm:block' />
                <span
                  className={key === 'organizations' ? 'hidden sm:inline' : ''}
                >
                  {t(`tabs.${key}.label`)}
                </span>
                {key === 'organizations' && (
                  <span className='sm:hidden'>
                    {t('tabs.organizations.shortLabel')}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {TABS.map(key => {
          const sticker = STICKER[key];
          return (
            <TabsContent key={key} value={key} className='space-y-5'>
              <div className='flex items-center gap-3'>
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${sticker.tile} ${sticker.rotate}`}
                  aria-hidden='true'
                >
                  <sticker.Icon className='h-5 w-5' />
                </span>
                <h3 className='text-xl font-semibold tracking-tight sm:text-2xl'>
                  {t(`tabs.${key}.heading`)}
                </h3>
              </div>
              <AboutStorySlider
                stories={STORIES.map(story => ({
                  scene: t(`tabs.${key}.stories.${story}.scene`),
                  moments: MOMENTS.map(moment => ({
                    label: t(
                      `tabs.${key}.stories.${story}.moments.${moment}.label`
                    ),
                    text: t(
                      `tabs.${key}.stories.${story}.moments.${moment}.text`
                    ),
                  })),
                }))}
                dotLabels={STORIES.map((_, index) =>
                  t('storyDot', {
                    number: String(index + 1),
                    total: String(STORIES.length),
                  })
                )}
                aside={
                  key === 'organizations'
                    ? undefined
                    : CARDS.map((card, index) => (
                        <AboutExampleCard
                          key={card}
                          title={t(`tabs.${key}.cards.${card}.title`)}
                          host={t(`tabs.${key}.cards.${card}.host`)}
                          image={CARD_IMAGES[key][index]}
                          {...CARD_STATS[key][index]}
                        />
                      ))
                }
                staticAside={<AboutForestGraphic />}
                footer={
                  key === 'organizations' ? (
                    <a
                      href={FORESTCLOUD_URL}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-1.5 text-sm font-semibold text-accent-color hover:opacity-80'
                    >
                      {t('tabs.organizations.learnMore')}
                      <ArrowRight className='h-4 w-4' aria-hidden='true' />
                    </a>
                  ) : null
                }
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </section>
  );
}
