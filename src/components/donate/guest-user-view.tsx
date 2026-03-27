import { AddressForm } from './address-form';
import { AnonymousDonationField } from './anonymous-donation-field';
import { DonorIdentityFields } from './donor-identity-fields';

export const GuestUserView = () => {
  return (
    <>
      <DonorIdentityFields />
      <AnonymousDonationField />
      <AddressForm />
    </>
  );
};
