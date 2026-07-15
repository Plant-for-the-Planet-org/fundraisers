import type {
  CreateFundraiserRequest,
  Fundraiser,
} from '@/lib/types/fundraiser';
import type { RawFundraiser } from './normalize-fundraiser';

import { normalizeFundraiser } from './normalize-fundraiser';
import { platformFetch } from './platform-fetch';

export async function createFundraiser(
  data: CreateFundraiserRequest,
  token: string
): Promise<Fundraiser> {
  return normalizeFundraiser(
    await platformFetch<RawFundraiser>('/fundraisers', {
      method: 'POST',
      body: data,
      token,
    })
  );
}
