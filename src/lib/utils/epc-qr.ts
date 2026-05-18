// Builds the payload string encoded in an EPC QR code (also known as
// GiroCode). Spec: EPC069-12 "Quick Response Code: Guidelines to Enable Data
// Capture for the Initiation of a SEPA Credit Transfer".
//
// The QR payload is plain text, not a URL — banking apps with a built-in
// scanner parse the line-delimited fields below and pre-fill a SEPA transfer.

// Country codes whose IBANs are valid SEPA Credit Transfer endpoints. The EPC
// spec only guarantees prefill in banking apps for SEPA-zone IBANs, so we use
// this list to gate whether to even render the QR. Includes EEA + EFTA + the
// non-EU SEPA participants (CH, GB, MC, SM, VA, AD, GI).
const SEPA_COUNTRIES = new Set([
  'AT','BE','BG','CH','CY','CZ','DE','DK','EE','ES','FI','FR','GB','GI','GR',
  'HR','HU','IE','IS','IT','LI','LT','LU','LV','MC','MT','NL','NO','PL','PT',
  'RO','SE','SI','SK','SM','VA','AD',
]);

interface BuildEpcPayloadInput {
  beneficiary: string;
  iban: string;
  bic?: string | null;
  amount: number;
  currency: string;
  reference?: string | null;
}

// Returns true only when an EPC QR can be safely generated and is likely to
// work in the donor's banking app. Called from the UI to decide whether to
// show the QR tab at all.
export function isEpcEligible(
  currency: string,
  iban: string | undefined | null,
  amount: number
): boolean {
  // EPC SCT is EUR-only. Other currencies would scan but the bank would
  // reject the transfer.
  if (currency.toUpperCase() !== 'EUR') return false;
  if (!iban) return false;
  // Spec bounds for the Amount field (EUR0.01 to EUR999999999.99). Outside
  // this range the QR would be syntactically invalid.
  if (!Number.isFinite(amount) || amount < 0.01 || amount > 999999999.99) {
    return false;
  }
  const normalized = iban.replace(/\s+/g, '').toUpperCase();
  // IBAN length bounds per ISO 13616 (country-dependent, capped at 34).
  if (normalized.length < 15 || normalized.length > 34) return false;
  return SEPA_COUNTRIES.has(normalized.slice(0, 2));
}

export function buildEpcPayload({
  beneficiary,
  iban,
  bic,
  amount,
  currency,
  reference,
}: BuildEpcPayloadInput): string {
  // Strip whitespace and upper-case so the payload matches the canonical form
  // banks compare against — donors sometimes get IBANs with spaces from
  // copy/paste, but the encoded form must be compact.
  const normalizedIban = iban.replace(/\s+/g, '').toUpperCase();
  const normalizedBic = bic ? bic.replace(/\s+/g, '').toUpperCase() : '';
  // Amount field format: ISO 4217 currency code + amount with `.` decimal
  // separator and exactly two fraction digits (e.g. `EUR12.34`).
  const amountStr = `${currency.toUpperCase()}${amount.toFixed(2)}`;
  // Hard length caps from the spec. Truncating silently is acceptable here
  // because beneficiary names and donation references stay well under these.
  const name = beneficiary.slice(0, 70);
  const remittance = (reference ?? '').slice(0, 140);

  // Field order is positional and fixed by EPC069-12 v002. Each field is on
  // its own line; empty lines hold optional fields we don't supply.
  //
  //  1. Service tag         BCD
  //  2. Version             002 (allows omitting BIC for SEPA-zone IBANs)
  //  3. Character set       1 = UTF-8
  //  4. Identification      SCT = SEPA Credit Transfer
  //  5. BIC                 optional in v002
  //  6. Beneficiary name    max 70 chars
  //  7. IBAN
  //  8. Amount              `EUR` + decimal
  //  9. Purpose             ISO 20022 ExternalPurposeCode; CHAR = Charity
  // 10. Structured ref      (mutually exclusive with field 11)
  // 11. Unstructured ref    max 140 chars; we use this for the donation uid
  // 12. Beneficiary info    free text, omitted
  return [
    'BCD',
    '002',
    '1',
    'SCT',
    normalizedBic,
    name,
    normalizedIban,
    amountStr,
    'CHAR',
    '',
    remittance,
  ].join('\n');
}
