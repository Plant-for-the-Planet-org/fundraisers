import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function SignInHeroImage() {
  const tAuth = useTranslations('Auth');
  return (
    <section className='hidden lg:flex flex-1 relative'>
      <Image
        src='/sign-in-hero.jpg'
        alt={tAuth('heroImageAlt')}
        fill
        className='object-cover rounded-3xl'
        priority
      />
      {/* Dark Overlay */}
      <div className='absolute inset-0 bg-black/30 rounded-none lg:rounded-3xl' />

      {/* Content Overlay */}
      <div className='relative z-10 flex flex-col justify-center items-center h-full px-6 py-12 text-center'>
        <div className='max-w-lg'>
          {/* TODO: Maybe in future some text can go here */}
        </div>
      </div>
    </section>
  );
}
