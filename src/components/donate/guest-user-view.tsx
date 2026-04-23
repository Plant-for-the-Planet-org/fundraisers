import { AddressForm } from './address-form';
import { AnonymousDonationField } from './anonymous-donation-field';
import { DonorIdentityFields } from './donor-identity-fields';
import { TinField } from './tin-field';

export const GuestUserView = () => {
  return (
    <>
      <DonorIdentityFields />
      <AnonymousDonationField />
      <AddressForm />
      <TinField />
    </>
  );
};
