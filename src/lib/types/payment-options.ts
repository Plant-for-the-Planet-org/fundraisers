/** Unit a project's `unitCost` is denominated in. */
export type ProjectUnit = 'tree' | 'm2';

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
  /** Format: `gateway:method`. e.g. "stripe:card", "paypal:paypal", "offline:offline" */
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

/**
 * `GET /paymentOptions/{projectSlug}` response. The endpoint serves both
 * fundraisers and projects; for a project it also carries the project details
 * the single project page renders, so no second request is needed.
 *
 * Only the fields the page uses are typed here — the response also includes
 * `purpose`, `category`, `unitType`, `isGiftable`, `taxDeductionCountries`
 * and more.
 */
export interface ProjectPaymentOptions extends PaymentOptions {
  /** Discriminates a project payload from a fundraiser one. */
  destination: 'project';
  /** Organization running the project, shown as the project owner. */
  ownerName: string;
  /** CDN filename of the owner's logo, used for the avatar next to `ownerName`. */
  ownerAvatar: string | null;
  /** Plain text, may contain line breaks. */
  description: string | null;
  /** CDN filename or absolute URL of the project's hero image. */
  image: string | null;
  isTopProject: boolean;
  /** Cost of a single unit, in `currency`. */
  unitCost: number;
  /** The unit `unitCost` applies to. */
  unit: ProjectUnit;
}
