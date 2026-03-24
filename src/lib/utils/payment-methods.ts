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
  'open-banking',
  'bank-transfer',
  'paypal',
  'card',
  'sepa-debit',
  'apple-pay',
  'google-pay',
];

// const METHOD_LABEL_KEYS: Record<PaymentMethodId, string> = {
//   'open-banking': 'methods.openBanking',
//   'bank-transfer': 'methods.bankTransfer',
//   paypal: 'methods.paypal',
//   card: 'methods.card',
//   'sepa-debit': 'methods.sepa',
//   'apple-pay': 'methods.applePay',
//   'google-pay': 'methods.googlePay',
// };

type RawMethodEntry = {
  methodId: string;
  gateway: string;
};

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
      resolvedMethodId = 'bank-transfer';
    } else if (normalizedGateway === 'open-banking') {
      resolvedMethodId = 'open-banking';
    }
  }

  if (!resolvedMethodId) {
    return null;
  }

  if (resolvedMethodId === 'open-banking') {
    return { methodId: resolvedMethodId, provider: 'open-banking' };
  }
  if (resolvedMethodId === 'paypal') {
    return { methodId: resolvedMethodId, provider: 'paypal' };
  }
  if (resolvedMethodId === 'bank-transfer') {
    return { methodId: resolvedMethodId, provider: 'offline' };
  }
  if (normalizedGateway === 'open-banking') {
    return { methodId: resolvedMethodId, provider: 'open-banking' };
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
  if (methodId === 'sepa-debit' && currency.toUpperCase() !== 'EUR') {
    return false;
  }
  return true;
}

function getRawMethodEntries(paymentOptions: PaymentOptions): RawMethodEntry[] {
  const entries: RawMethodEntry[] = [];

  for (const [gateway, config] of Object.entries(paymentOptions.gateways)) {
    const normalizedGateway = normalizePaymentToken(gateway);
    const methods = config?.methods;

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
      entries.push({ methodId: 'bank-transfer', gateway });
    } else if (normalizedGateway === 'open-banking') {
      entries.push({ methodId: 'open-banking', gateway });
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
