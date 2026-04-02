import type {
  OfflinePaymentSource,
  PaymentData,
  PaymentMethod,
  PaymentProvider,
  PaymentRequest,
  PaymentSource,
} from '../types/payment';
import type { PaymentOptions } from '../types/payment-options';

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
 * Build payment source based on payment method
 */
function buildPaymentSource(
  paymentMethod: PaymentMethod,
  paymentDetails: PaymentData['paymentDetails']
): PaymentSource {
  switch (paymentMethod) {
    case 'card':
    case 'sepa-debit':
    case 'apple-pay':
    case 'google-pay': {
      const id = paymentDetails.paymentMethodId || paymentDetails.sourceId;
      if (!id) {
        throw new PaymentOptionsError(
          'Missing payment method ID for Stripe payment',
          'MISSING_PAYMENT_METHOD_ID',
          400
        );
      }
      return { kind: 'stripe', id, object: 'payment_method' };
    }

    case 'paypal': {
      const orderId = paymentDetails.orderId || paymentDetails.orderID;
      if (!orderId) {
        throw new PaymentOptionsError(
          'Missing order ID for PayPal payment',
          'MISSING_ORDER_ID',
          400
        );
      }
      return { type: 'server_order', orderId: String(orderId) };
    }

    case 'bank-transfer':
      return {} as OfflinePaymentSource;
    default:
      throw new PaymentOptionsError(
        `Unknown payment method: ${paymentMethod}`,
        'UNKNOWN_PAYMENT_METHOD',
        400
      );
  }
}

function getGatewayForPaymentMethod(
  paymentMethod: PaymentMethod
): PaymentProvider {
  switch (paymentMethod) {
    case 'card':
    case 'sepa-debit':
    case 'apple-pay':
    case 'google-pay':
      return 'stripe';
    case 'paypal':
      return 'paypal';
    case 'bank-transfer':
      return 'offline';
    default:
      return 'stripe';
  }
}

function mapPaymentMethodName(paymentMethod: PaymentMethod): string {
  switch (paymentMethod) {
    case 'sepa-debit':
      return 'sepa_debit';
    case 'apple-pay':
      return 'apple_pay';
    case 'google-pay':
      return 'google_pay';
    case 'paypal':
      return 'paypal';
    case 'bank-transfer':
      return 'offline';
    default:
      return paymentMethod;
  }
}

export async function buildPaymentRequest(
  paymentData: PaymentData,
  paymentOptionConfig: PaymentOptions
): Promise<PaymentRequest> {
  const { paymentMethod, paymentDetails } = paymentData;

  try {
    const gateway = getGatewayForPaymentMethod(paymentMethod);
    const gatewayConfig = paymentOptionConfig.gateways[gateway];

    if (!gatewayConfig) {
      throw new PaymentOptionsError(
        `No configuration found for gateway: ${gateway}`,
        'GATEWAY_NOT_CONFIGURED',
        400
      );
    }

    const account = (paymentDetails.account as string) || gatewayConfig.account;

    if ('methods' in gatewayConfig) {
      const mappedMethod = mapPaymentMethodName(paymentMethod);
      if (!gatewayConfig.methods.includes(mappedMethod)) {
        throw new PaymentOptionsError(
          `Payment method '${paymentMethod}' is not supported for gateway '${gateway}'`,
          'PAYMENT_METHOD_NOT_SUPPORTED',
          400
        );
      }
    }

    // Handle saved payment methods
    if (paymentDetails.savedMethodId) {
      return {
        account,
        gateway,
        method: mapPaymentMethodName(paymentMethod),
        source: {}, // Source not needed for saved methods
        savedMethod: paymentDetails.savedMethodId,
      };
    }

    // Handle new payment methods
    const baseRequest = {
      account,
      gateway,
      method: mapPaymentMethodName(paymentMethod),
    };

    // Add source based on payment method
    const source = buildPaymentSource(paymentMethod, paymentDetails);

    return {
      ...baseRequest,
      source,
    };
  } catch (error) {
    if (error instanceof PaymentOptionsError) {
      throw error;
    }

    throw new PaymentOptionsError(
      `Failed to build payment request: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PAYMENT_REQUEST_BUILD_ERROR',
      500,
      { originalError: error }
    );
  }
}
