import { useTranslations } from 'next-intl';
import { ShovelIcon } from '@/components/ui/duotone-icons';
import { SeedlingIcon } from '@/components/ui/plant-icons';
import { ABOUT_IMAGES } from './about-images';

const RING =
  'absolute overflow-hidden rounded-full border-[3px] border-background shadow-md';

// Photo circles from three projects (Ghana, Mexico, Spain), one large and two small, with two stickers.
export function AboutForestGraphic() {
  const t = useTranslations('About.who.tabs.organizations.forest');

  return (
    <div
      className='relative mx-auto aspect-[5/4] w-full max-w-[400px]'
      role='img'
      aria-label={t('alt')}
    >
      <div
        className={`${RING} left-[8%] top-[6%] h-[70%] w-[56%] animate-bob motion-reduce:animate-none`}
      >
        <img
          src={ABOUT_IMAGES.ghana}
          alt=''
          loading='lazy'
          className='h-full w-full object-cover'
        />
      </div>
      <div
        className={`${RING} right-[6%] top-[4%] h-[38%] w-[30%] animate-bob motion-reduce:animate-none [animation-delay:1.2s]`}
      >
        <img
          src={ABOUT_IMAGES.yucatan}
          alt=''
          loading='lazy'
          className='h-full w-full object-cover'
        />
      </div>
      <div
        className={`${RING} bottom-[14%] right-[12%] h-[34%] w-[27%] animate-bob motion-reduce:animate-none [animation-delay:2.4s]`}
      >
        <img
          src={ABOUT_IMAGES.spain}
          alt=''
          loading='lazy'
          className='h-full w-full object-cover'
        />
      </div>

      <div
        className='absolute left-[58%] top-[40%] flex h-11 w-11 rotate-12 items-center justify-center rounded-xl bg-soft-gold text-amber-700 shadow-sm'
        aria-hidden='true'
      >
        <ShovelIcon className='h-5 w-5' />
      </div>
      <div
        className='absolute left-[2%] top-[62%] flex h-10 w-10 -rotate-6 items-center justify-center rounded-xl bg-planet-100 text-planet-600 shadow-sm'
        aria-hidden='true'
      >
        <SeedlingIcon className='h-5 w-5' />
      </div>
    </div>
  );
}
