/**
 * List of supported currencies on the platform
 */
export const SUPPORTED_CURRENCIES = ['EUR', 'CHF'] as const;

/**
 * Type for Supported currencies on the platform
 */
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Allowed countries for fundraiser creation
 * These countries have full platform support including tax deductibility
 * Plus "Rest of the World" option
 */
export const ALLOWED_COUNTRIES = ['DE', 'ES', 'CH', 'ROW'] as const;

/**
 * Type for Allowed countries for fundraiser creation
 */
export type AllowedCountry = (typeof ALLOWED_COUNTRIES)[number];
