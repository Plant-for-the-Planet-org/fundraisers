/**
 * Constants related to application config
 */

import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.url(),
  NEXT_PUBLIC_CDN_URL: z.url(),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  NEXT_PUBLIC_ENABLE_FUNDRAISER_CITIES: z.boolean().optional().default(false),
});

const env = envSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_ENABLE_FUNDRAISER_CITIES:
    process.env.NEXT_PUBLIC_ENABLE_FUNDRAISER_CITIES === 'true' ? true : false,
});

export const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;
export const PLATFORM_BASE_URL = 'https://web.plant-for-the-planet.org';
export const CDN_BASE_URL = env.NEXT_PUBLIC_CDN_URL;
/** Public origin for OG/canonical URLs; falls back to request headers when unset. */
export const SITE_URL = env.NEXT_PUBLIC_SITE_URL;

export const ENABLE_FUNDRAISER_CITIES =
  process.env.NEXT_PUBLIC_ENABLE_FUNDRAISER_CITIES === 'true' ? true : false;
