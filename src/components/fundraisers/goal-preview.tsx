'use client';

import type { CreateFundraiserFormValues } from './create-fundraiser-form-context';

import { useWatch } from 'react-hook-form';
import { GoalProgressDisplay } from '@/components/fundraisers/goal-progress-display';

const PREVIEW_PROGRESS_PERCENTAGE = 40;
const PREVIEW_DAYS_LEFT = 42;

interface GoalPreviewProps {
  mode: 'create' | 'edit';
  /** Server-reported raised amount. Required for edit mode; ignored otherwise. */
  totalRaised?: number;
}

function toSafeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function GoalPreview({ mode, totalRaised }: GoalPreviewProps) {
  const goalAmount = useWatch<CreateFundraiserFormValues, 'goalAmount'>({
    name: 'goalAmount',
  });
  const currency = useWatch<CreateFundraiserFormValues, 'currency'>({
    name: 'currency',
  });

  const safeGoalAmount = toSafeNumber(goalAmount);
  const isEdit = mode === 'edit';

  const raisedAmount = isEdit
    ? toSafeNumber(totalRaised)
    : Math.round((safeGoalAmount * PREVIEW_PROGRESS_PERCENTAGE) / 100);

  const progressPercentage = isEdit
    ? safeGoalAmount > 0
      ? Math.min(100, Math.round((raisedAmount / safeGoalAmount) * 100))
      : 0
    : PREVIEW_PROGRESS_PERCENTAGE;

  return (
    <GoalProgressDisplay
      raisedAmount={raisedAmount}
      goalAmount={safeGoalAmount}
      currency={currency ?? 'EUR'}
      progressPercentage={progressPercentage}
      daysLeft={PREVIEW_DAYS_LEFT}
    />
  );
}
