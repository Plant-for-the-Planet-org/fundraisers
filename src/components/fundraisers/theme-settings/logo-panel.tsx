'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { SectionHeader } from '../typography';
import { LOGOS } from './constants';
import { OpacitySlider } from './primitives';

export function LogoPanel({
  logoId,
  opacity,
  onPick,
  onOpacity,
}: {
  logoId: string | null;
  opacity: number;
  onPick: (id: string | null) => void;
  onOpacity: (value: number) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  return (
    <>
      <OpacitySlider value={opacity} onChange={onOpacity} />
      <div>
        <SectionHeader showDivider={false}>{tTheme('labelLogo')}</SectionHeader>
        <div className='grid grid-cols-6 gap-1.5 mt-2'>
          {LOGOS.map(logo => {
            const active = logoId === logo.id;
            return (
              <button
                type='button'
                key={logo.id}
                onClick={() => onPick(active ? null : logo.id)}
                title={logo.label}
                aria-label={logo.label}
                aria-pressed={active}
                className={cn(
                  'h-12 rounded-md overflow-hidden border bg-white p-2 flex items-center justify-center',
                  active
                    ? 'border-foreground ring-2 ring-foreground/30'
                    : 'border-border hover:border-foreground/40'
                )}
              >
                <img
                  src={logo.src}
                  alt={logo.label}
                  className='max-w-full max-h-full object-contain'
                />
              </button>
            );
          })}
        </div>
        <p className='mt-3 text-[11px] text-muted-foreground leading-relaxed'>
          {tTheme.rich('logoContact', {
            mail: chunks => (
              <a
                href='mailto:info@plant-for-the-planet.org'
                className='underline'
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>
    </>
  );
}
