import { getDateOffsetFromToday } from '@/lib/utils/date';

// Link this to workspace country if we want different values for different currencies
export const GOAL_AMOUNT_MIN = 50;

export const DEFAULT_FUNDRAISER_DURATION_DAYS = 60;

export const DESCRIPTION_MAX_LENGTH = 2500;

/**
 * Configurable end date range relative to the publish date.
 * Used by both the date picker and validation.
 */
export const END_DATE_CONSTRAINTS = {
  minOffsetDays: 1, // Earliest: tomorrow
  maxOffsetDays: 365, // Latest: one year from today
} as const;

export interface EndDateBounds {
  /** Earliest allowed date (YYYY-MM-DD). */
  min: string;
  /** Latest allowed date (YYYY-MM-DD). */
  max: string;
}

/**
 * Returns the allowed end date range as YYYY-MM-DD values.
 */
export function getEndDateBounds(): EndDateBounds {
  return {
    min: getDateOffsetFromToday(END_DATE_CONSTRAINTS.minOffsetDays),
    max: getDateOffsetFromToday(END_DATE_CONSTRAINTS.maxOffsetDays),
  };
}
