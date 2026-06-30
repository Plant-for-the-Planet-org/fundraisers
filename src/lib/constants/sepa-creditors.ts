interface SepaCreditor {
  name: string;
  id: string;
}

/**
 * SEPA Direct Debit creditor details per workspace, keyed by the workspace
 * country code. These are legal identifiers tied to the organization running
 * the workspace, not to the donor's locale, so they live here rather than in
 * translations.
 *
 * SEPA is only offered for EUR workspaces, so only DE and ES need entries. ROW
 * maps to the DE workspace and falls back to DE below; CH is CHF and never
 * shows SEPA.
 */
const SEPA_CREDITORS: Record<string, SepaCreditor> = {
  DE: { name: 'Plant-for-the-Planet Foundation', id: 'DE94ZZZ00000023303' },
  ES: { name: 'Fundación Plant-for-the-Planet España', id: 'ES34000G54754031' },
};

export function getSepaCreditor(country: string | undefined): SepaCreditor {
  return SEPA_CREDITORS[(country ?? '').toUpperCase()] ?? SEPA_CREDITORS.DE;
}
