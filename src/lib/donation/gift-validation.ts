import { z } from 'zod';

export interface DonationGiftValues {
  recipientName: string;
  recipientEmail: string;
  message: string;
}

export interface DonationGiftErrors {
  recipientName?: string;
  recipientEmail?: string;
}

export type DonationGiftErrorCode =
  | 'recipientName.required'
  | 'recipientEmail.invalid'
  | 'recipientEmail.requiredWithMessage';

const donationGiftSchema = z
  .object({
    recipientName: z
      .string()
      .trim()
      .min(1, { message: 'recipientName.required' }),
    recipientEmail: z.preprocess(
      value => (typeof value === 'string' ? value.trim() : value),
      z.union([z.literal(''), z.email({ message: 'recipientEmail.invalid' })])
    ),
    message: z.string().trim(),
  })
  .superRefine(({ recipientEmail, message }, ctx) => {
    if (message && !recipientEmail) {
      ctx.addIssue({
        code: 'custom',
        path: ['recipientEmail'],
        message: 'recipientEmail.requiredWithMessage',
      });
    }
  });

export type ValidatedDonationGiftValues = z.output<typeof donationGiftSchema>;

export function validateDonationGift(values: DonationGiftValues):
  | { success: true; data: ValidatedDonationGiftValues }
  | {
      success: false;
      errorCodes: {
        recipientName?: DonationGiftErrorCode;
        recipientEmail?: DonationGiftErrorCode;
      };
    } {
  const validationResult = donationGiftSchema.safeParse(values);

  if (validationResult.success) {
    return { success: true, data: validationResult.data };
  }

  const errorCodes: {
    recipientName?: DonationGiftErrorCode;
    recipientEmail?: DonationGiftErrorCode;
  } = {};

  for (const issue of validationResult.error.issues) {
    if (issue.path[0] === 'recipientName' && !errorCodes.recipientName) {
      errorCodes.recipientName = 'recipientName.required';
    }

    if (issue.path[0] === 'recipientEmail' && !errorCodes.recipientEmail) {
      if (issue.message === 'recipientEmail.requiredWithMessage') {
        errorCodes.recipientEmail = 'recipientEmail.requiredWithMessage';
      } else {
        errorCodes.recipientEmail = 'recipientEmail.invalid';
      }
    }
  }

  return { success: false, errorCodes };
}
