import type { EndDateBounds } from '@/lib/constants/fundraiser-creation';

import { z } from 'zod';
import { isValidDateInput } from '@/lib/utils/date';

export interface ExtendFundraiserValues {
  endDate: string;
}

// Reuses the create/edit end-date validation rules.
// The new end date must be later than the current end date.
export function createExtendFundraiserSchema(bounds: EndDateBounds) {
  return z
    .object({
      endDate: z.string().trim().min(1, 'required'),
    })
    .refine(data => isValidDateInput(data.endDate), {
      message: 'invalid',
      path: ['endDate'],
    })
    .refine(
      data => !(isValidDateInput(data.endDate) && data.endDate < bounds.min),
      { message: 'minDate', path: ['endDate'] }
    )
    .refine(
      data => !(isValidDateInput(data.endDate) && data.endDate > bounds.max),
      { message: 'maxDate', path: ['endDate'] }
    );
}
