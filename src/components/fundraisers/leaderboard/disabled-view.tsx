import { useTranslations } from 'next-intl';
import { SectionOffNotice } from '../section-off-notice';

export function DisabledView() {
  const t = useTranslations('Leaderboard.form.disabledView');

  return <SectionOffNotice title={t('title')} description={t('description')} />;
}
