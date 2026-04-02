import type { PaymentProvider } from '../types/payment';

import { getPaymentOptions } from '../api/payment-options-service';

export class PaymentOptionsError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PaymentOptionsError';
  }
}

/**
 * Get account ID for a specific gateway
 */
export async function getAccountForGateway(
  gateway: PaymentProvider,
  fundraiserId: string
): Promise<string> {
  const config = await getPaymentOptions(fundraiserId);

  const gatewayConfig = config.gateways[gateway];

  if (!gatewayConfig) {
    throw new PaymentOptionsError(
      `No configuration found for gateway: ${gateway}`,
      'GATEWAY_NOT_CONFIGURED',
      400
    );
  }

  return gatewayConfig.account;
}

/**
 * Get all available payment methods for a gateway
 */
async function getMethodsForGateway(
  gateway: PaymentProvider,
  fundraiserId: string
): Promise<string[]> {
  const config = await getPaymentOptions(fundraiserId);
  const gatewayConfig = config.gateways[gateway];

  if (!gatewayConfig) {
    throw new PaymentOptionsError(
      `No configuration found for gateway: ${gateway}`,
      'GATEWAY_NOT_CONFIGURED',
      400
    );
  }

  if (!('methods' in gatewayConfig)) {
    throw new PaymentOptionsError(
      `Gateway ${gateway} does not support methods`,
      'METHODS_NOT_SUPPORTED',
      400
    );
  }

  return gatewayConfig.methods;
}

/**
 * Check if a payment method is supported
 */
export async function isMethodSupported(
  gateway: PaymentProvider,
  method: string,
  fundraiserId: string
): Promise<boolean> {
  try {
    const methods = await getMethodsForGateway(gateway, fundraiserId);
    return methods.includes(method);
  } catch (error) {
    if (error instanceof PaymentOptionsError) {
      // If gateway is not configured, method is not supported
      return false;
    }
    throw error;
  }
}
