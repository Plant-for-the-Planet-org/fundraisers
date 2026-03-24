import type {
  DerivedPaymentMethod,
  PaymentMethodId,
  PaymentMethodProvider,
} from '@/lib/types/payment-methods';
import type { PaymentOptions } from '@/lib/types/payment-options';

import { getProcessingFee } from '@/lib/utils/processing-fees';

interface PaymentMethodContext {
  country: string;
  currency: string;
  donationAmountCents: number;
}

const LEGACY_METHOD_ORDER: PaymentMethodId[] = [
  'open-banking',
  'bank-transfer',
  'paypal',
  'card',
  'sepa-debit',
  'apple-pay',
  'google-pay',
];

const METHOD_LABEL_KEYS: Record<PaymentMethodId, string> = {
  'open-banking': 'methods.openBanking',
  'bank-transfer': 'methods.bankTransfer',
  paypal: 'methods.paypal',
  card: 'methods.card',
  'sepa-debit': 'methods.sepa',
  'apple-pay': 'methods.applePay',
  'google-pay': 'methods.googlePay',
};

type RawMethodEntry = {
  methodId: string;
  gateway: string;
};

function normalizePaymentMethodId(
  methodId: string,
  gateway: string
): PaymentMethodId | null {
  const normalized = methodId.toLowerCase().trim().replaceAll('_', '-');
  const normalizedGateway = gateway.toLowerCase().trim().replaceAll('_', '-');

  if (
    normalized === 'card' ||
    normalized === 'credit-card' ||
    normalized === 'debit-card'
  ) {
    return 'card';
  }
  if (normalized === 'sepa' || normalized === 'sepa-debit') {
    return 'sepa-debit';
  }
  if (normalized === 'paypal') {
    return 'paypal';
  }
  if (normalized === 'bank-transfer' || normalized === 'offline') {
    return 'bank-transfer';
  }
  if (normalized === 'open-banking' || normalized === 'openbanking') {
    return 'open-banking';
  }
  if (normalized === 'apple-pay' || normalized === 'applepay') {
    return 'apple-pay';
  }
  if (normalized === 'google-pay' || normalized === 'googlepay') {
    return 'google-pay';
  }
  if (gateway === 'paypal') {
    return 'paypal';
  }
  if (gateway === 'offline') {
    return 'bank-transfer';
  }
  if (normalizedGateway === 'open-banking') {
    return 'open-banking';
  }

  return null;
}

function providerForMethod(
  methodId: PaymentMethodId,
  gateway: string
): PaymentMethodProvider {
  const normalizedGateway = gateway.toLowerCase().trim().replaceAll('_', '-');

  if (methodId === 'open-banking') {
    return 'open-banking';
  }
  if (methodId === 'paypal') {
    return 'paypal';
  }
  if (methodId === 'bank-transfer') {
    return 'offline';
  }
  if (normalizedGateway === 'open-banking') {
    return 'open-banking';
  }
  if (normalizedGateway === 'planetcash') {
    return 'planetcash';
  }
  if (gateway === 'paypal') {
    return 'paypal';
  }
  if (gateway === 'offline') {
    return 'offline';
  }
  return 'stripe';
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
    const methods = config?.methods;

    if (Array.isArray(methods) && methods.length > 0) {
      for (const method of methods) {
        if (typeof method === 'string') {
          entries.push({ methodId: method, gateway });
        }
      }
      continue;
    }

    if (gateway === 'paypal') {
      entries.push({ methodId: 'paypal', gateway });
    } else if (gateway === 'offline') {
      entries.push({ methodId: 'bank-transfer', gateway });
    } else if (gateway === 'open-banking') {
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
    const methodId = normalizePaymentMethodId(entry.methodId, entry.gateway);

    if (!methodId || deduped.has(methodId)) {
      continue;
    }
    if (!isMethodAllowedForCurrency(methodId, context.currency)) {
      continue;
    }

    const provider = providerForMethod(methodId, entry.gateway);
    const fee = getProcessingFee(
      provider,
      methodId,
      context.donationAmountCents,
      context.country
    );

    deduped.set(methodId, {
      id: methodId,
      provider,
      labelKey: METHOD_LABEL_KEYS[methodId],
      disabled: false,
      hasFee: fee.hasFee,
      feeAmountCents: fee.feeAmountCents,
      feeRegion: fee.region,
    });
  }

  return Array.from(deduped.values()).sort((a, b) => {
    const aIndex = LEGACY_METHOD_ORDER.indexOf(a.id);
    const bIndex = LEGACY_METHOD_ORDER.indexOf(b.id);
    const normalizedAIndex = aIndex >= 0 ? aIndex : Number.MAX_SAFE_INTEGER;
    const normalizedBIndex = bIndex >= 0 ? bIndex : Number.MAX_SAFE_INTEGER;
    return normalizedAIndex - normalizedBIndex;
  });
}
