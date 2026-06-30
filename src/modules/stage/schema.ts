import { z } from 'zod';
import { isAllowedImageUrl } from '@/lib/utils/image-url';
import { routing } from '@/i18n/routing';
import { STAGE_LIMITS } from './constants';

const stageImageUrlSchema = z
  .string()
  .refine(isAllowedImageUrl, { message: 'imageUrlNotAllowed' });

const stageSlideSchema = z.object({
  position: z.number().int().min(1),
  title: z.string().max(STAGE_LIMITS.slideTitle),
  description: z.string().max(STAGE_LIMITS.slideDescription),
  image: stageImageUrlSchema,
  duration: z.number().int().min(1).max(60),
});

export const stageModeSchema = z.object({
  enabled: z.boolean(),
  locale: z.enum(routing.locales),
  title: z.string().max(STAGE_LIMITS.stageTitle),
  description: z.string().max(STAGE_LIMITS.stageDescription),
  partner_logo_url: stageImageUrlSchema,
  slides: z.array(stageSlideSchema).max(STAGE_LIMITS.maxSlides),
});

export type StageFormValue = z.infer<typeof stageModeSchema>;
