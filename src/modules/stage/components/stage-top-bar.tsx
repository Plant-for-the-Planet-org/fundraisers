'use client';

import { useTranslations } from 'next-intl';

interface StageTopBarProps {
  title: string;
  description?: string;
  logoUrl?: string;
  className?: string;
}

export function StageTopBar({
  title,
  description,
  logoUrl,
  className,
}: StageTopBarProps) {
  const t = useTranslations('Stage.topBar');

  return (
    <div className={className}>
      <div className='flex flex-col gap-5'>
        {/* Logo row */}
        <div
          className='flex items-center gap-[18px]'
          style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,.45))' }}
        >
          <div className='flex h-16 items-center'>
            <img
              src='https://cdn.plant-for-the-planet.org/logo/svg/planet.svg'
              alt={t('brandAlt')}
              className='h-16 w-auto brightness-0 invert'
            />
          </div>

          {logoUrl && (
            <>
              <div className='h-10 w-px bg-white/45' />
              <div className='flex h-16 items-center'>
                <img
                  src={logoUrl}
                  alt={t('partnerAlt')}
                  className='h-full w-auto object-contain'
                />
              </div>
            </>
          )}
        </div>

        {/* Event info */}
        <div className='flex flex-col gap-2 pl-1'>
          <div
            className='text-[36px] font-bold leading-tight tracking-tight text-white'
            style={{
              fontFamily: 'var(--theme-title-font)',
              textShadow: '0 4px 20px rgba(0,0,0,.55)',
            }}
          >
            {title}
          </div>
          {description && (
            <div
              className='text-[22px] leading-snug text-white/70'
              style={{
                maxWidth: 600,
                textShadow: '0 2px 12px rgba(0,0,0,.45)',
              }}
            >
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
