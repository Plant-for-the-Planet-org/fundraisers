import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { sanitizeDescriptionHtml } from '@/lib/utils/sanitize-html';
import { SectionHeader } from '@/components/fundraisers/typography';
import { RichTextContent } from '@/components/rich-text/rich-text-content';

interface DescriptionDisplayProps {
  value: string | null;
  className?: string;
}

export default function DescriptionDisplay({
  value,
  className,
}: DescriptionDisplayProps) {
  const t = useTranslations('Fundraisers.form.description');

  if (!value || typeof value !== 'string') {
    return null;
  }

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('label')}</SectionHeader>
      <RichTextContent
        html={value}
        sanitize={sanitizeDescriptionHtml}
        className={cn(
          'rich-quote rich-links text-foreground leading-relaxed ',
          '[&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 ',
          '[&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_s]:line-through ',
          '[&_ul]:my-3 [&_ul]:pl-6 [&_ul]:list-disc ',
          '[&_ol]:my-3 [&_ol]:pl-6 [&_ol]:list-decimal ',
          '[&_li]:my-1 ',
          '[&_hr]:border-t [&_hr]:border-t-section-divider',
          className
        )}
      />
    </div>
  );
}
