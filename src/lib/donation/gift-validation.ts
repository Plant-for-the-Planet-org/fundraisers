import { z } from 'zod';

export const RECIPIENT_NAME_MAX_LENGTH = 35;
export const RECIPIENT_EMAIL_MAX_LENGTH = 254;
export const GIFT_MESSAGE_MAX_LENGTH = 250;

export interface DonationGiftValues {
  recipientName: string;
  recipientEmail: string;
  message: string;
}

export interface DonationGiftErrors {
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
}

export type DonationGiftErrorCode =
  | 'recipientName.required'
  | 'recipientName.tooLong'
  | 'recipientEmail.invalid'
  | 'recipientEmail.tooLong'
  | 'recipientEmail.requiredWithMessage'
  | 'message.tooLong';

const donationGiftSchema = z
  .object({
    recipientName: z
      .string()
      .trim()
      .min(1, { message: 'recipientName.required' })
      .max(RECIPIENT_NAME_MAX_LENGTH, { message: 'recipientName.tooLong' }),
    recipientEmail: z.preprocess(
      value => (typeof value === 'string' ? value.trim() : value),
      z.union([
        z.literal(''),
        z
          .email({ message: 'recipientEmail.invalid' })
          .max(RECIPIENT_EMAIL_MAX_LENGTH, {
            message: 'recipientEmail.tooLong',
          }),
      ])
    ),
    message: z
      .string()
      .trim()
      .max(GIFT_MESSAGE_MAX_LENGTH, { message: 'message.tooLong' }),
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
        message?: DonationGiftErrorCode;
      };
    } {
  const validationResult = donationGiftSchema.safeParse(values);

  if (validationResult.success) {
    return { success: true, data: validationResult.data };
  }

  const errorCodes: {
    recipientName?: DonationGiftErrorCode;
    recipientEmail?: DonationGiftErrorCode;
    message?: DonationGiftErrorCode;
  } = {};

  for (const issue of validationResult.error.issues) {
    if (issue.path[0] === 'recipientName' && !errorCodes.recipientName) {
      errorCodes.recipientName =
        issue.message === 'recipientName.tooLong'
          ? 'recipientName.tooLong'
          : 'recipientName.required';
    }

    if (issue.path[0] === 'recipientEmail' && !errorCodes.recipientEmail) {
      if (issue.message === 'recipientEmail.tooLong') {
        errorCodes.recipientEmail = 'recipientEmail.tooLong';
      } else if (issue.message === 'recipientEmail.requiredWithMessage') {
        errorCodes.recipientEmail = 'recipientEmail.requiredWithMessage';
      } else {
        errorCodes.recipientEmail = 'recipientEmail.invalid';
      }
    }

    if (issue.path[0] === 'message' && !errorCodes.message) {
      errorCodes.message = 'message.tooLong';
    }
  }

  return { success: false, errorCodes };
}
