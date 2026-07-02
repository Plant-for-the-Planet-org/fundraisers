import type { StageFormValue } from './schema';
import type { StageModuleSettings } from './settings';

import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';

// Normalizes persisted stage settings into the form value shape, filling
// defaults for fields that may be missing on older/loose API records.
export function parseStageFormValue(
  raw: StageModuleSettings | null | undefined
): StageFormValue | null {
  if (!raw) return null;
  return {
    enabled: raw.enabled ?? true,
    locale: hasLocale(routing.locales, raw.locale) ? raw.locale : 'en',
    title: raw.title ?? '',
    description: raw.description ?? '',
    partner_logo_url: raw.partner_logo_url ?? '',
    slides: (raw.slides ?? []).map((slide, i) => ({
      position: slide.position ?? i + 1,
      title: slide.title ?? '',
      description: slide.description ?? '',
      image: slide.image ?? '',
      duration:
        typeof slide.duration === 'number' && Number.isFinite(slide.duration)
          ? Math.min(60, Math.max(1, Math.round(slide.duration)))
          : 8,
    })),
  };
}
