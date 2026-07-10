import { useTranslations } from 'next-intl';

export function Logos() {
  const t = useTranslations('Common.partners');

  return (
    <div className='logos flex items-center justify-center md:justify-start gap-4 h-[34px]'>
      <a
        href='https://www.plant-for-the-planet.org'
        target='_blank'
        rel='noopener noreferrer'
        className='hover:opacity-80'
      >
        <img
          src='https://cdn.plant-for-the-planet.org/logo/svg/planet.svg'
          alt={t('plantForThePlanetAlt')}
          className='h-[34px] w-[33px]'
        />
      </a>
    </div>
  );
}
