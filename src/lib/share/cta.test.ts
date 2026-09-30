import { describe, expect, it } from 'vitest';
import { seasonalCta } from './cta';

describe('seasonalCta', () => {
  it('follows what the projects do at Christmas', () => {
    expect(seasonalCta('christmas', ['trees'])).toBe('giftTree');
    expect(seasonalCta('christmas', ['trees', 'reforestation'])).toBe(
      'giftTree'
    );
    expect(seasonalCta('christmas', ['conservation'])).toBe('protectForest');
    expect(seasonalCta('christmas', ['academy'])).toBe('youngVoices');
  });

  it('falls back to neutral wording for mixed or unknown projects', () => {
    expect(seasonalCta('christmas', ['trees', 'conservation'])).toBe(
      'giftForPlanet'
    );
    expect(seasonalCta('christmas', ['funds'])).toBe('giftForPlanet');
    expect(seasonalCta('christmas', [])).toBe('giftForPlanet');
  });

  it('uses one wording for the other seasons', () => {
    expect(seasonalCta('halloween', ['trees'])).toBe('treatPlanet');
    expect(seasonalCta('birthday', [])).toBe('celebrateWithMe');
    expect(seasonalCta('none', ['trees'])).toBe('joinMe');
  });

  it('thanks people once the fundraiser has ended', () => {
    expect(seasonalCta('none', ['trees'], true)).toBe('thankYou');
    expect(seasonalCta('christmas', ['trees'], true)).toBe('thankYou');
  });
});
