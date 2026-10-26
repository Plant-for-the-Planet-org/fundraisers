import { describe, expect, it } from 'vitest';
import { isSameAccent } from './accent-utils';

describe('isSameAccent', () => {
  it('treats a hex accent as the same colour in any case', () => {
    // The colour picker returns lowercase; theme presets use uppercase.
    expect(isSameAccent('#6FCF97', '#6fcf97')).toBe(true);
  });

  it('matches palette names and tells different accents apart', () => {
    expect(isSameAccent('emerald', 'emerald')).toBe(true);
    expect(isSameAccent('#6FCF97', '#6FCF98')).toBe(false);
    expect(isSameAccent('emerald', '#047857')).toBe(false);
  });
});
