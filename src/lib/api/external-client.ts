/**
 * External Platform API Client
 * Handles HTTP requests to external platform APIs
 */

import { API_BASE_URL } from '../constants/app-config';

export class PlatformAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'PlatformAPIError';
  }
}

class PlatformAPIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'X-SESSION-ID': 'web-client',
      ...(options.headers as Record<string, string>),
    };

    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorResponse;

      try {
        errorResponse = await response.json();
        errorMessage = errorResponse.message || errorMessage;
      } catch {
        // If response is not JSON, use the status text
      }

      throw new PlatformAPIError(
        errorMessage,
        'HTTP_ERROR',
        response.status,
        errorResponse
      );
    }
    if (response.status === 204) {
      return undefined as T;
    }

    // Safe content-type check before parsing JSON
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return (await response.text()) as unknown as T;
  }

  async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' }, token);
  }

  async getAuthenticated<T>(endpoint: string, token: string): Promise<T> {
    if (!token) {
      throw new PlatformAPIError(
        'Authentication token required',
        'AUTH_TOKEN_MISSING',
        401
      );
    }
    return this.get<T>(endpoint, token);
  }

  async post<T>(endpoint: string, body: unknown, token?: string): Promise<T> {
    return this.makeRequest<T>(
      endpoint,
      { method: 'POST', body: JSON.stringify(body) },
      token
    );
  }

  async postAuthenticated<T>(
    endpoint: string,
    body: unknown,
    token: string
  ): Promise<T> {
    if (!token) {
      throw new PlatformAPIError(
        'Authentication token required',
        'AUTH_TOKEN_MISSING',
        401
      );
    }
    return this.post<T>(endpoint, body, token);
  }
}

// Create a singleton instance
export const platformAPIClient = new PlatformAPIClient();
