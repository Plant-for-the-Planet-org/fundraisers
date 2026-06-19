import type { StageFormValue } from './schema';
import type { StageModuleSettings } from './settings';

// Normalizes persisted stage settings into the form value shape, filling
// defaults for fields that may be missing on older/loose API records.
export function parseStageFormValue(
  raw: StageModuleSettings | null | undefined
): StageFormValue | null {
  if (!raw) return null;
  return {
    enabled: raw.enabled ?? true,
    locale: (['en', 'de'] as const).includes(raw.locale as 'en' | 'de')
      ? (raw.locale as 'en' | 'de')
      : ('en' as const),
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
