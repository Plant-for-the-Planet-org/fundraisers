'use client';

import type { FundraiserFormValues } from './fundraiser-form-schema';

import { useWatch } from 'react-hook-form';
import { getDaysLeft } from '@/lib/utils/fundraiser';
import { GoalProgressDisplay } from '@/components/fundraisers/goal-progress-display';

const PREVIEW_PROGRESS_PERCENTAGE = 40;
const PREVIEW_DAYS_LEFT = 42;

interface GoalPreviewProps {
  isEditMode: boolean;
  /** Server-reported raised amount. Required for edit mode; ignored otherwise. */
  totalRaised?: number;
  /** Fundraiser end date (ISO string). Required for edit mode; ignored otherwise. */
  endDate?: string;
}

function toSafeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function GoalPreview({
  isEditMode,
  totalRaised,
  endDate,
}: GoalPreviewProps) {
  const goalAmount = useWatch<FundraiserFormValues, 'goalAmount'>({
    name: 'goalAmount',
  });
  const currency = useWatch<FundraiserFormValues, 'currency'>({
    name: 'currency',
  });

  const safeGoalAmount = toSafeNumber(goalAmount);

  const raisedAmount = isEditMode
    ? toSafeNumber(totalRaised)
    : Math.round((safeGoalAmount * PREVIEW_PROGRESS_PERCENTAGE) / 100);

  const progressPercentage = isEditMode
    ? safeGoalAmount > 0
      ? Math.min(100, Math.round((raisedAmount / safeGoalAmount) * 100))
      : 0
    : PREVIEW_PROGRESS_PERCENTAGE;

  const daysLeft =
    isEditMode && endDate ? getDaysLeft(endDate) : PREVIEW_DAYS_LEFT;

  return (
    <GoalProgressDisplay
      raisedAmount={raisedAmount}
      goalAmount={safeGoalAmount}
      currency={currency ?? 'EUR'}
      progressPercentage={progressPercentage}
      daysLeft={daysLeft}
    />
  );
}
