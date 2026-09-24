import { describe, expect, it } from 'vitest';
import { hexToHslTriplet } from './color-utils';

describe('hexToHslTriplet', () => {
  it('turns a hex accent into the triplet the shadcn tokens hold', () => {
    expect(hexToHslTriplet('#4f46e5')).toBe('243 75% 59%');
    expect(hexToHslTriplet('#007a49')).toBe('156 100% 24%');
  });

  it('handles greys, which have no hue', () => {
    expect(hexToHslTriplet('#808080')).toBe('0 0% 50%');
  });
});
