import type { Locale } from '@/i18n/routing';

export interface StageSlide {
  position: number;
  title: string;
  description: string;
  image: string;
  duration: number;
}

export interface StageModuleSettings {
  enabled: boolean;
  locale: Locale;
  title: string;
  description: string;
  partner_logo_url: string;
  slides: StageSlide[];
  show_impact?: boolean;
  show_progress_bar?: boolean;
}
