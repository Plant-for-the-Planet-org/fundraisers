import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Footnote: the people and fundraisers above are samples, so it points visitors to the real ones.
export function AboutDisclaimer() {
  const t = useTranslations('About');

  return (
    <p className='mx-auto max-w-2xl text-center text-xs leading-relaxed text-muted-foreground'>
      {t.rich('disclaimer', {
        exploreLink: chunks => (
          <Link
            href='/explore'
            className='underline underline-offset-2 hover:text-foreground'
          >
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}
