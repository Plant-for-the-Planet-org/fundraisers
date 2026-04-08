import { ProfileCard } from './profile-card';

import { AnonymousDonationField } from './anonymous-donation-field';
import { AddressSection } from './address-section';

export const AuthenticatedUserView = () => {
  return (
    <>
      <ProfileCard />
      <AnonymousDonationField />
      <AddressSection />
    </>
  );
};
