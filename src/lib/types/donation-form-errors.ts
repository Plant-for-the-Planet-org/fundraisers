export const DONATION_FORM_ERRORS = {
  'firstName.required': 'firstName.required',
  'lastName.required': 'lastName.required',
  'country.required': 'country.required',
  'zipCode.required': 'zipCode.required',
  'address.required': 'address.required',
  'city.required': 'city.required',
  'email.required': 'email.required',
  'email.invalid': 'email.invalid',
  'companyName.required': 'companyName.required',
  'tin.required': 'tin.required',
  'paymentMethod.required': 'paymentMethod.required',
} as const;

export type DonationFormErrorKey = keyof typeof DONATION_FORM_ERRORS;
