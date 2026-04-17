import { AddressSection } from './address-section';
import { AnonymousDonationField } from './anonymous-donation-field';
import { ProfileCard } from './profile-card';
import { TinField } from './tin-field';

export const AuthenticatedUserView = () => {
  return (
    <>
      <ProfileCard />
      <AnonymousDonationField />
      <AddressSection />
      <TinField />
    </>
  );
};
