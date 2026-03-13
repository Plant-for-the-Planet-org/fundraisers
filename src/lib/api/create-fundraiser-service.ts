import type {
  CreateFundraiserRequest,
  Fundraiser,
} from '@/lib/types/fundraiser';

import { platformAPIClient } from './external-client';

export async function createFundraiser(
  data: CreateFundraiserRequest,
  token: string
): Promise<Fundraiser> {
  return platformAPIClient.postAuthenticated<Fundraiser>(
    '/fundraisers',
    data,
    token
  );
}
