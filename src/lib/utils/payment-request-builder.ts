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
    case 'sepa-debit':
    case 'apple-pay':
    case 'google-pay':
      return 'stripe';
    case 'paypal':
      return 'paypal';
    case 'bank-transfer':
      return 'offline';
    default:
      throw new PaymentOptionsError(
        `Unknown payment method: ${paymentMethod}`,
        'UNKNOWN_PAYMENT_METHOD',
        400
      );
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
      const mappedMethod = mapPaymentMethodName(paymentMethod);
      if (!gatewayConfig.methods.includes(mappedMethod)) {
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
          method: mapPaymentMethodName(paymentMethod) as StripePaymentMethod,
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
