import type {
  DerivedPaymentMethod,
  PaymentMethodId,
  PaymentMethodProvider,
} from '@/lib/types/payment-methods';
import type { PaymentOptions } from '@/lib/types/payment-options';

import {
  normalizePaymentMethodId,
  normalizePaymentToken,
} from '@/lib/utils/payment-method-normalizer';
import { getProcessingFee } from '@/lib/utils/processing-fees';

interface PaymentMethodContext {
  country: string;
  currency: string;
  donationAmountCents: number;
}

const PAYMENT_METHOD_ORDER: PaymentMethodId[] = [
  'planet_cash',
  'paypal',
  'sepa_debit',
  'card',
  'bank_transfer',
  'apple_pay',
  'google_pay',
];

// const METHOD_LABEL_KEYS: Record<PaymentMethodId, string> = {
//   bank_transfer: 'methods.bankTransfer',
//   paypal: 'methods.paypal',
//   card: 'methods.card',
//   sepa_debit: 'methods.sepa',
//   apple_pay: 'methods.applePay',
//   google_pay: 'methods.googlePay',
// };

type RawMethodEntry = {
  methodId: string;
  gateway: string;
};

type GatewayConfig =
  PaymentOptions['gateways'][keyof PaymentOptions['gateways']];
type GatewayConfigWithMethods = Extract<GatewayConfig, { methods: string[] }>;

function hasGatewayMethods(
  config: GatewayConfig
): config is GatewayConfigWithMethods {
  return (
    typeof config === 'object' &&
    config !== null &&
    'methods' in config &&
    Array.isArray(config.methods)
  );
}

function resolveMethod(
  methodId: string,
  gateway: string
): { methodId: PaymentMethodId; provider: PaymentMethodProvider } | null {
  const normalizedMethodId = normalizePaymentMethodId(methodId);
  const normalizedGateway = normalizePaymentToken(gateway);

  let resolvedMethodId: PaymentMethodId | null = normalizedMethodId;

  if (!resolvedMethodId) {
    if (normalizedGateway === 'paypal') {
      resolvedMethodId = 'paypal';
    } else if (normalizedGateway === 'offline') {
      resolvedMethodId = 'bank_transfer';
    } else if (normalizedGateway === 'planet-cash') {
      resolvedMethodId = 'planet_cash';
    }
  }

  if (!resolvedMethodId) {
    return null;
  }

  if (resolvedMethodId === 'paypal') {
    return { methodId: resolvedMethodId, provider: 'paypal' };
  }
  if (resolvedMethodId === 'bank_transfer') {
    return { methodId: resolvedMethodId, provider: 'offline' };
  }
  if (resolvedMethodId === 'planet_cash') {
    return { methodId: resolvedMethodId, provider: 'planetcash' };
  }
  if (normalizedGateway === 'planetcash') {
    return { methodId: resolvedMethodId, provider: 'planetcash' };
  }
  if (normalizedGateway === 'paypal') {
    return { methodId: resolvedMethodId, provider: 'paypal' };
  }
  if (normalizedGateway === 'offline') {
    return { methodId: resolvedMethodId, provider: 'offline' };
  }
  return { methodId: resolvedMethodId, provider: 'stripe' };
}

function isMethodAllowedForCurrency(
  methodId: PaymentMethodId,
  currency: string
) {
  if (methodId === 'sepa_debit' && currency.toUpperCase() !== 'EUR') {
    return false;
  }
  return true;
}

function getRawMethodEntries(paymentOptions: PaymentOptions): RawMethodEntry[] {
  const entries: RawMethodEntry[] = [];

  for (const [gateway, config] of Object.entries(paymentOptions.gateways)) {
    const normalizedGateway = normalizePaymentToken(gateway);
    const methods = hasGatewayMethods(config) ? config.methods : null;

    if (Array.isArray(methods) && methods.length > 0) {
      for (const method of methods) {
        if (typeof method === 'string') {
          entries.push({ methodId: method, gateway });
        }
      }
      continue;
    }

    if (normalizedGateway === 'paypal') {
      entries.push({ methodId: 'paypal', gateway });
    } else if (normalizedGateway === 'offline') {
      entries.push({ methodId: 'bank_transfer', gateway });
    } else if (normalizedGateway === 'planet-cash') {
      entries.push({ methodId: 'planet_cash', gateway });
    }
  }

  return entries;
}

export function derivePaymentMethods(
  paymentOptions: PaymentOptions,
  context: PaymentMethodContext
): DerivedPaymentMethod[] {
  const deduped = new Map<PaymentMethodId, DerivedPaymentMethod>();
  const rawEntries = getRawMethodEntries(paymentOptions);

  for (const entry of rawEntries) {
    const resolvedMethod = resolveMethod(entry.methodId, entry.gateway);

    if (!resolvedMethod || deduped.has(resolvedMethod.methodId)) {
      continue;
    }
    if (
      !isMethodAllowedForCurrency(resolvedMethod.methodId, context.currency)
    ) {
      continue;
    }

    const fee = getProcessingFee(
      resolvedMethod.provider,
      resolvedMethod.methodId,
      context.donationAmountCents,
      context.country
    );

    deduped.set(
      resolvedMethod.methodId,
      fee.hasFee
        ? {
            id: resolvedMethod.methodId,
            provider: resolvedMethod.provider,
            hasFee: true,
            feeAmountCents: fee.feeAmountCents,
            feeRegion: fee.region,
          }
        : {
            id: resolvedMethod.methodId,
            provider: resolvedMethod.provider,
            hasFee: false,
          }
    );
  }

  return Array.from(deduped.values()).sort((a, b) => {
    const aIndex = PAYMENT_METHOD_ORDER.indexOf(a.id);
    const bIndex = PAYMENT_METHOD_ORDER.indexOf(b.id);
    const normalizedAIndex = aIndex >= 0 ? aIndex : Number.MAX_SAFE_INTEGER;
    const normalizedBIndex = bIndex >= 0 ? bIndex : Number.MAX_SAFE_INTEGER;
    return normalizedAIndex - normalizedBIndex;
  });
}
