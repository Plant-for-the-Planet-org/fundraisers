import type {
  AddFundraiserHostRequest,
  FundraiserHost,
  UpdateFundraiserHostRequest,
} from '@/lib/types/fundraiser';

import { platformFetch } from './platform-fetch';

/**
 * Host management against the platform host sub-resource:
 * `/fundraisers/{id}/hosts`. Mutations are immediate and independent of the
 * fundraiser PUT — adding/updating/removing a host does not go through the
 * fundraiser form. See docs/fundraiser-hosts-management.md in treecounter-platform.
 */

function hostsPath(fundraiserId: string): string {
  return `/fundraisers/${encodeURIComponent(fundraiserId)}/hosts`;
}

function hostPath(fundraiserId: string, hostId: string): string {
  return `${hostsPath(fundraiserId)}/${encodeURIComponent(hostId)}`;
}

export async function listFundraiserHosts(
  fundraiserId: string,
  token: string
): Promise<FundraiserHost[]> {
  return platformFetch<FundraiserHost[]>(hostsPath(fundraiserId), { token });
}

export async function addFundraiserHost(
  fundraiserId: string,
  data: AddFundraiserHostRequest,
  token: string
): Promise<FundraiserHost> {
  return platformFetch<FundraiserHost>(hostsPath(fundraiserId), {
    method: 'POST',
    body: data,
    token,
  });
}

export async function updateFundraiserHost(
  fundraiserId: string,
  hostId: string,
  data: UpdateFundraiserHostRequest,
  token: string
): Promise<FundraiserHost> {
  return platformFetch<FundraiserHost>(hostPath(fundraiserId, hostId), {
    method: 'PATCH',
    body: data,
    token,
  });
}

export async function removeFundraiserHost(
  fundraiserId: string,
  hostId: string,
  token: string
): Promise<void> {
  await platformFetch<void>(hostPath(fundraiserId, hostId), {
    method: 'DELETE',
    token,
  });
}
