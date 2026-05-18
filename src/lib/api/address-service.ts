import { platformFetch } from './platform-fetch';

// Request interface for creating new addresses
export interface CreateAddressRequest {
  type: 'primary' | 'mailing' | 'other';
  name: string;
  address1: string;
  address2?: string;
  zipCode: string;
  city: string;
  country: string;
}

export interface CreateAddressResponse {
  id: string;
  type: string;
  name: string;
  address: string;
  address2?: string | null;
  city: string;
  zipCode: string;
  country: string;
  state?: string | null;
  isPrimary: boolean;
}

export class AddressService {
  /**
   * Create a new address for the authenticated user
   * POST /app/addresses
   */
  async createAddress(
    token: string,
    addressData: CreateAddressRequest
  ): Promise<CreateAddressResponse> {
    return platformFetch<CreateAddressResponse>('/addresses', {
      method: 'POST',
      body: addressData,
      token,
    });
  }
}

// Create a singleton instance
export const addressService = new AddressService();
