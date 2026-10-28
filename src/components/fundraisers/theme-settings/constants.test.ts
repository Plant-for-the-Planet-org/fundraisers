import { describe, expect, it } from 'vitest';
import { FEATURED_THEMES } from './constants';

describe('theme picker', () => {
  it('leaves out the retired themes', () => {
    const ids = FEATURED_THEMES.map(theme => theme.id);
    for (const retired of ['midnight', 'volcanic', 'sunset']) {
      expect(ids).not.toContain(retired);
    }
  });
});
