import type { DonationFormErrorKey } from '@/lib/types/donation-form-errors';
import type { DonationFormValues } from '@/components/donate/donation-form-context';

import { DONATION_FORM_ERRORS } from '@/lib/types/donation-form-errors';

/** Field errors the platform reported, keyed by form field name. */
export type DonationFieldErrors = Partial<
  Record<keyof DonationFormValues, DonationFormErrorKey>
>;

/**
 * Donor fields the platform can report errors on, keyed by the path segment it sends after `donor.`.
 *
 * The three naming schemes disagree, so each entry spells out both targets: `field` is the react-hook-form field name, `errorKeyPrefix` is the prefix of the key under `Donate.errors`. The API sends `companyname`, the form calls it `companyName`; the locale keys camel-case the name parts (`firstName`) while the form fields do not (`firstname`).
 */
const DONOR_FIELDS = {
  firstname: { field: 'firstname', errorKeyPrefix: 'firstName' },
  lastname: { field: 'lastname', errorKeyPrefix: 'lastName' },
  email: { field: 'email', errorKeyPrefix: 'email' },
  address: { field: 'address', errorKeyPrefix: 'address' },
  address2: { field: 'address2', errorKeyPrefix: 'address2' },
  zipCode: { field: 'zipCode', errorKeyPrefix: 'zipCode' },
  city: { field: 'city', errorKeyPrefix: 'city' },
  state: { field: 'state', errorKeyPrefix: 'state' },
  country: { field: 'country', errorKeyPrefix: 'country' },
  companyname: { field: 'companyName', errorKeyPrefix: 'companyName' },
  tin: { field: 'tin', errorKeyPrefix: 'tin' },
} as const satisfies Record<
  string,
  { field: keyof DonationFormValues; errorKeyPrefix: string }
>;

/**
 * Maps platform field errors onto form fields and local error keys.
 *
 * Only the donor fields in `DONOR_FIELDS` are mapped, and only where the reason resolves to a key we have a translation for. Anything else is dropped rather than guessed at: an unmarked field plus the generic banner beats marking the wrong field or printing a raw platform key at the donor.
 *
 * Returns `undefined` when nothing mapped, so callers can treat "no field errors" as one case.
 */
export function toDonationFieldErrors(
  raw: Record<string, string[]> | null | undefined
): DonationFieldErrors | undefined {
  if (!raw) return undefined;

  const mapped: DonationFieldErrors = {};
  for (const [path, messages] of Object.entries(raw)) {
    const [scope, name] = path.split('.');
    if (scope !== 'donor') continue;

    const target = DONOR_FIELDS[name as keyof typeof DONOR_FIELDS];
    if (!target) continue;

    // `form.city.invalid` -> `invalid`. A message that is prose rather than a key
    // yields no matching error key below and is dropped.
    const reason = messages[0]?.split('.').pop();
    const errorKey = `${target.errorKeyPrefix}.${reason}`;
    if (!(errorKey in DONATION_FORM_ERRORS)) continue;

    mapped[target.field] = errorKey as DonationFormErrorKey;
  }

  return Object.keys(mapped).length > 0 ? mapped : undefined;
}
