import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function SignInHeroImage() {
  const tAuth = useTranslations('Auth');
  return (
    <section className='relative hidden flex-1 overflow-hidden rounded-3xl lg:block'>
      <Image
        src='/sign-in-hero.jpg'
        alt={tAuth('heroImageAlt')}
        fill
        sizes='50vw'
        className='object-cover'
        priority
      />
    </section>
  );
}
