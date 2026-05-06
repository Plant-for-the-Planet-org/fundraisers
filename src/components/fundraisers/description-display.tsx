import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { sanitizeDescriptionHtml } from '@/lib/utils/sanitize-html';
import { SectionHeader } from '@/components/fundraisers/typography';

interface DescriptionDisplayProps {
  value: string | null;
  className?: string;
}

export default function DescriptionDisplay({
  value,
  className,
}: DescriptionDisplayProps) {
  const t = useTranslations('Fundraisers.form.description');

  if (!value) {
    return null;
  }

  const safeValue =
    typeof value === 'string' ? sanitizeDescriptionHtml(value) : null;

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('label')}</SectionHeader>
      <div
        className={cn(
          'text-sm text-foreground leading-relaxed [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:pl-6 [&_ul]:list-disc [&_ol]:my-2 [&_ol]:pl-6 [&_ol]:list-decimal [&_li]:my-1 [&_blockquote]:pl-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_s]:line-through',
          className
        )}
        dangerouslySetInnerHTML={{ __html: safeValue as TrustedHTML }}
      />
    </div>
  );
}
