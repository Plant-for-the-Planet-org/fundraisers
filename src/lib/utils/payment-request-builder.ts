import type {
  PaymentData,
  PaymentMethod,
  PaymentRequest,
  StripePaymentMethod,
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

function getGatewayForPaymentMethod(
  paymentMethod: PaymentMethod
): 'stripe' | 'paypal' | 'offline' {
  switch (paymentMethod) {
    case 'card':
    case 'sepa_debit':
    case 'apple_pay':
    case 'google_pay':
      return 'stripe';
    case 'paypal':
      return 'paypal';
    case 'bank_transfer':
      return 'offline';
    default:
      throw new PaymentOptionsError(
        `Unknown payment method: ${paymentMethod}`,
        'UNKNOWN_PAYMENT_METHOD',
        400
      );
  }
}

export function buildPaymentRequest(
  paymentData: PaymentData,
  paymentOptionConfig: PaymentOptions
): PaymentRequest {
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
      // The offline gateway exposes its method as 'offline' (the gateway name),
      // not 'bank_transfer'. Stripe and PayPal use the same id we do.
      const apiMethodName =
        paymentMethod === 'bank_transfer' ? 'offline' : paymentMethod;
      if (!gatewayConfig.methods.includes(apiMethodName)) {
        throw new PaymentOptionsError(
          `Payment method '${paymentMethod}' is not supported for gateway '${gateway}'`,
          'PAYMENT_METHOD_NOT_SUPPORTED',
          400
        );
      }
    }

    switch (gateway) {
      case 'offline':
        return {
          gateway,
          account,
          method: 'offline',
          source: {},
        };

      case 'stripe': {
        const id = paymentDetails.paymentMethodId || paymentDetails.sourceId;
        if (!id) {
          throw new PaymentOptionsError(
            'Missing payment method ID for Stripe payment',
            'MISSING_PAYMENT_METHOD_ID',
            400
          );
        }
        return {
          gateway: 'stripe',
          account,
          // Internal ids align with `StripePaymentMethod` after the snake_case
          // migration; no remapping needed.
          method: paymentMethod as StripePaymentMethod,
          source: { id: String(id), object: 'payment_method' },
        };
      }

      case 'paypal': {
        const {
          orderID,
          payerID,
          paymentID,
          billingToken,
          facilitatorAccessToken,
          paymentSource,
        } = paymentDetails;
        if (!orderID) {
          throw new PaymentOptionsError(
            'Missing PayPal order ID',
            'MISSING_ORDER_ID',
            400
          );
        }
        return {
          gateway: 'paypal',
          account,
          method: 'paypal',
          source: {
            type: 'server_order',
            orderID: String(orderID),
            payerID: String(payerID ?? ''),
            paymentID: String(paymentID ?? ''),
            billingToken: billingToken ? String(billingToken) : null,
            facilitatorAccessToken: String(facilitatorAccessToken ?? ''),
            paymentSource: String(paymentSource ?? ''),
          },
        };
      }
    }
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
