'use client';

import type { CustomGradient } from '@/lib/theme/types';
import type { BgFormValue } from './constants';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { SectionHeader } from '../typography';
import { ColorTrigger } from './color-trigger';
import { DEFAULT_SOLID_COLOR, defaultCustomGradient } from './constants';

type Base = 'none' | 'solid' | 'gradient';

// A legacy preset gradient (a Tailwind class) also counts as "gradient" here,
// so picking a preset lights up the Gradient segment.
function deriveBase(bg: BgFormValue): Base {
  if (bg.background_color) return 'solid';
  if (bg.custom_gradient || bg.gradient) return 'gradient';
  return 'none';
}

export function BackgroundBaseSelector({
  bg,
  accentColor,
  onSelectNone,
  onSolidColor,
  onGradientChange,
}: {
  bg: BgFormValue;
  accentColor: string;
  onSelectNone: () => void;
  onSolidColor: (hex: string) => void;
  onGradientChange: (next: CustomGradient) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  // Derived straight from data — each selection writes synchronously (seeding a
  // default where needed), so the active segment always reflects the stored bg.
  const base = deriveBase(bg);

  const selectBase = (next: Base) => {
    if (next === 'none') onSelectNone();
    else if (next === 'solid')
      onSolidColor(bg.background_color ?? DEFAULT_SOLID_COLOR);
    else
      onGradientChange(
        bg.custom_gradient ?? defaultCustomGradient(accentColor)
      );
  };

  const gradient = bg.custom_gradient ?? defaultCustomGradient(accentColor);
  const patchStop = (
    index: number,
    patch: Partial<CustomGradient['stops'][number]>
  ) =>
    onGradientChange({
      ...gradient,
      stops: gradient.stops.map((s, i) =>
        i === index ? { ...s, ...patch } : s
      ),
    });

  const options: Array<{ id: Base; label: string }> = [
    { id: 'none', label: tTheme('baseNone') },
    { id: 'solid', label: tTheme('baseSolid') },
    { id: 'gradient', label: tTheme('baseGradient') },
  ];

  return (
    <div>
      <SectionHeader showDivider={false}>
        {tTheme('labelBackgroundColor')}
      </SectionHeader>

      <div className='mt-2 inline-flex overflow-hidden rounded-md border border-border'>
        {options.map((opt, i) => (
          <button
            key={opt.id}
            type='button'
            onClick={() => selectBase(opt.id)}
            aria-pressed={base === opt.id}
            className={cn(
              'px-3 py-1 text-xs font-semibold',
              i > 0 && 'border-l border-border',
              base === opt.id
                ? 'bg-muted/40 text-foreground'
                : 'text-muted-foreground hover:bg-muted/20'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {base === 'solid' && (
        <div className='mt-3'>
          <ColorTrigger
            value={bg.background_color}
            onChange={onSolidColor}
            label={tTheme('selectColor')}
          />
        </div>
      )}

      {base === 'gradient' && (
        <div className='mt-3 flex flex-col gap-2'>
          {gradient.stops.slice(0, 2).map((stop, i) => {
            const label = tTheme(i === 0 ? 'gradientStart' : 'gradientEnd');
            return (
              <div key={i} className='flex items-center gap-2'>
                <span className='w-10 text-xs text-muted-foreground'>
                  {label}
                </span>
                <ColorTrigger
                  value={stop.color}
                  onChange={color => patchStop(i, { color })}
                  label={label}
                />
                <span className='flex-1' />
                <input
                  type='number'
                  min={0}
                  max={100}
                  value={stop.position}
                  onChange={e =>
                    patchStop(i, { position: clampPercent(e.target.value) })
                  }
                  aria-label={label}
                  className='h-8 w-14 rounded-md border border-border bg-background px-2 text-right text-xs'
                />
                <span className='text-xs text-muted-foreground'>%</span>
              </div>
            );
          })}
          <div
            className='h-8 rounded-md border border-border'
            style={{
              backgroundImage: `linear-gradient(${gradient.angle}deg, ${gradient.stops
                .map(s => `${s.color} ${s.position}%`)
                .join(', ')})`,
            }}
          />
        </div>
      )}
    </div>
  );
}

function clampPercent(raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}
