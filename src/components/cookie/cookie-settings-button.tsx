import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { cookieConsent } from '@/lib/cookie-consent';

interface CookieSettingsButtonProps {
  variant?: 'default' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function CookieSettingsButton({
  variant = 'ghost',
  size = 'sm',
  className,
}: CookieSettingsButtonProps) {
  const t = useTranslations('Common');

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => cookieConsent.showPreferences()}
      className={className}
    >
      {t('cookieSettings')}
    </Button>
  );
}
