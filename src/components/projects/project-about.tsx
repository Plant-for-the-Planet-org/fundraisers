import { useTranslations } from 'next-intl';
import { SectionHeader } from '@/components/fundraisers/typography';

interface ProjectAboutProps {
  description: string | null;
}

/**
 * About section for the project page.
 *
 * The API returns plain text with line breaks, so `whitespace-pre-line`
 * preserves the formatting without rendering HTML.
 *
 * Renders nothing if the description is empty.
 */
export function ProjectAbout({ description }: ProjectAboutProps) {
  const t = useTranslations('Projects.about');
  const text = description?.trim();

  if (!text) {
    return null;
  }

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('title')}</SectionHeader>
      <p className='whitespace-pre-line leading-relaxed text-foreground'>
        {text}
      </p>
    </div>
  );
}
