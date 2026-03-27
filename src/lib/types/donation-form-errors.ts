export const DONATION_FORM_ERRORS = {
  'firstName.required': 'firstName.required',
  'lastName.required': 'lastName.required',
  'email.required': 'email.required',
  'email.invalid': 'email.invalid',
  'companyName.required': 'companyName.required',
} as const;

export type DonationFormErrorKey = keyof typeof DONATION_FORM_ERRORS;
