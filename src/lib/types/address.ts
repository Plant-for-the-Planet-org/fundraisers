export type AddressType = 'primary' | 'mailing' | 'other';

export type AddressPayloadInput = {
  address: string;
  address2?: string;
  city: string;
  zipCode: string;
  state?: string;
  country: string;
  addressType: AddressType;
};
