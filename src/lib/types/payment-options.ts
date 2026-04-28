export interface PaymentOptionItem {
  id: string;
  caption: string | null;
  description: string | null;
  icon: string | null;
  quantity: number | null; // null = custom amount
  isDefault: boolean;
}

export interface PaymentFrequency {
  minQuantity: number;
  options: PaymentOptionItem[];
}

export interface PaymentOptions {
  id: string;
  name: string;
  lastPaymentMethod?: string | null;
  currency: string;
  requestedCountry: string;
  effectiveCountry: string;
  frequencies: {
    once?: PaymentFrequency;
    monthly?: PaymentFrequency;
    yearly?: PaymentFrequency;
  };
  recurrency: {
    supported: boolean;
    methods: string[];
  };
  gateways: {
    paypal?: {
      methods: string[];
      account: string;
      authorization: { client_id: string };
    };
    offline?: {
      methods: string[];
      account: string;
    };
    stripe?: {
      methods: string[];
      account: string;
      authorization: {
        stripePublishableKey: string;
        accountId: string;
      };
    };
    'planet-cash'?: {
      account: string;
      balance: number;
      creditLimit: number;
      available: number;
    };
  };
}
