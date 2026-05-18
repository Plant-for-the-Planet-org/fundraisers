import type {
  CreateFundraiserRequest,
  Fundraiser,
} from '@/lib/types/fundraiser';

import { platformFetch } from './platform-fetch';

export async function createFundraiser(
  data: CreateFundraiserRequest,
  token: string
): Promise<Fundraiser> {
  return platformFetch<Fundraiser>('/fundraisers', {
    method: 'POST',
    body: data,
    token,
  });
}
