/**
 * Centralized mapping from service-layer error codes to translation keys.
 *
 * Keys   = codes thrown by DonationError, PaymentError, PaymentOptionsError
 * Values = keys under `Donate.submissionErrors` in locale JSON
 */
export const SUBMISSION_ERROR_CODES = {
  // Auth / access
  AUTH_ERROR: 'authRequired',
  ACCESS_DENIED: 'accessDenied',

  // Validation / business
  VALIDATION_ERROR: 'validation',
  BUSINESS_LOGIC_ERROR: 'businessLogic',

  // Infrastructure
  RATE_LIMIT_ERROR: 'rateLimit',
  SERVER_ERROR: 'server',
  NETWORK_ERROR: 'network',
  TIMEOUT_ERROR: 'timeout',
  INVALID_RESPONSE: 'server',
  HTTP_ERROR: 'server',

  // Payment-request builder
  MISSING_PAYMENT_METHOD_ID: 'validation',
  MISSING_ORDER_ID: 'validation',
  UNKNOWN_PAYMENT_METHOD: 'validation',
  PAYMENT_METHOD_NOT_SUPPORTED: 'validation',
  PAYMENT_REQUEST_BUILD_ERROR: 'server',

  // Payment-options
  GATEWAY_NOT_CONFIGURED: 'validation',
  METHODS_NOT_SUPPORTED: 'validation',

  // 3-D Secure
  THREE_DS_MISSING_SECRET: 'threeDsMissingSecret',

  // Donation creation
  DONATION_CREATION_ERROR: 'donationCreation',

  // PayPal
  PAYPAL_ORDER_ERROR: 'paypalOrderCreationError',
  PAYPAL_CAPTURE_ERROR: 'paypalCaptureError',
  PAYPAL_SDK_ERROR: 'paypalPaymentError',

  // Payment response status
  PAYMENT_FAILED: 'paymentFailed',

  // Stripe error/decline codes (sent directly as errorCode by server)
  card_declined: 'cardDeclined',
  generic_decline: 'cardDeclined',
  do_not_honor: 'cardDeclined',
  insufficient_funds: 'insufficientFunds',
  lost_card: 'cardRestricted',
  stolen_card: 'cardRestricted',
  fraudulent: 'cardRestricted',
  expired_card: 'expiredCard',
  incorrect_cvc: 'cardDeclined',
  incorrect_number: 'cardDeclined',
  processing_error: 'processingError',
  card_velocity_exceeded: 'cardDeclined',
  authentication_required: 'authenticationFailed',
} as const;

export type ServiceErrorCode = keyof typeof SUBMISSION_ERROR_CODES;

export type SubmissionErrorKey =
  | (typeof SUBMISSION_ERROR_CODES)[ServiceErrorCode]
  | 'paymentCancelled'
  | 'unexpected';
