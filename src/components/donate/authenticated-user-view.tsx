import { AddressSection } from './address-section';
import { AnonymousDonationField } from './anonymous-donation-field';
import { ProfileCard } from './profile-card';

export const AuthenticatedUserView = () => {
  return (
    <>
      <ProfileCard />
      <AnonymousDonationField />
      <AddressSection />
    </>
  );
};
