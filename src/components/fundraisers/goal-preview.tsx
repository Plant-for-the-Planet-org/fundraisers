'use client';

import type { CreateFundraiserFormValues } from './create-fundraiser-form-context';

import { GoalProgressDisplay } from '@/components/fundraisers/goal-progress-display';
import { useWatch } from 'react-hook-form';

const PREVIEW_PROGRESS_PERCENTAGE = 40;
const PREVIEW_DAYS_LEFT = 42;

export function GoalPreview() {
  const goalAmount = useWatch<CreateFundraiserFormValues, 'goalAmount'>({
    name: 'goalAmount',
  });
  const currency = useWatch<CreateFundraiserFormValues, 'currency'>({
    name: 'currency',
  });

  const safeGoalAmount =
    typeof goalAmount === 'number' && Number.isFinite(goalAmount)
      ? goalAmount
      : 0;
  const raisedAmount = Math.round(
    (safeGoalAmount * PREVIEW_PROGRESS_PERCENTAGE) / 100
  );

  return (
    <GoalProgressDisplay
      raisedAmount={raisedAmount}
      goalAmount={safeGoalAmount}
      currency={currency ?? 'EUR'}
      progressPercentage={PREVIEW_PROGRESS_PERCENTAGE}
      daysLeft={PREVIEW_DAYS_LEFT}
    />
  );
}
