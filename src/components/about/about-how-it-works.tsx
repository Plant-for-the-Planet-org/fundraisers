import { useTranslations } from 'next-intl';

const STEPS = ['start', 'make', 'share', 'grow'] as const;

export function AboutHowItWorks() {
  const t = useTranslations('About.how');

  return (
    <section className='space-y-6'>
      <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
        {t('title')}
      </h2>
      <ol className='grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4'>
        {STEPS.map((key, index) => (
          <li
            key={key}
            className='space-y-2 rounded-3xl border border-border/60 bg-mode-base/60 p-5'
          >
            <span
              className='flex h-9 w-9 items-center justify-center rounded-tl-[70%] rounded-br-[70%] rounded-tr-md rounded-bl-md bg-accent-color/10 text-sm font-bold text-accent-color'
              aria-hidden='true'
            >
              {index + 1}
            </span>
            <h3 className='text-base font-semibold'>
              {t(`steps.${key}.title`)}
            </h3>
            <p className='text-sm leading-relaxed text-muted-foreground'>
              {t(`steps.${key}.text`)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
