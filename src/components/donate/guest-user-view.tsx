import { AddressForm } from './address-form';
import { AnonymousDonationField } from './anonymous-donation-field';
import { DonorIdentityForm } from './donor-identity-form';

export const GuestUserView = () => {
  return (
    <>
      <DonorIdentityForm />
      <AnonymousDonationField />
      <AddressForm />
    </>
  );
};
