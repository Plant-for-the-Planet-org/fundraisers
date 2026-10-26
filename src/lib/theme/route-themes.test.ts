import { describe, expect, it } from 'vitest';
import { getThemeForPath } from './route-themes';

describe('getThemeForPath', () => {
  it('gives the home page its own theme', () => {
    expect(getThemeForPath('/').id).toBe('stratospheric');
  });

  it('keeps the default theme for unknown paths, including an empty one', () => {
    expect(getThemeForPath('').id).toBe('default');
    expect(getThemeForPath('/raise/some-fundraiser').id).toBe('default');
  });

  it('keeps fallback pages and the editor loading state on the plain default', () => {
    // The id check also catches '/' matching as a prefix, which would give these pages the home theme.
    for (const path of [
      '/copyright',
      '/cookies',
      '/dashboard/fundraisers/edit/x',
    ]) {
      const theme = getThemeForPath(path);
      expect(theme.id, path).toBe('default');
      expect(theme.bg.decoration, path).toBe('none');
    }
  });

  it('starts a new fundraiser on the full Spring Vibes, as the picker shows it', () => {
    expect(getThemeForPath('/fundraisers/create').bg.decoration).toBe(
      'pattern'
    );
  });

  it('matches the longest prefix', () => {
    expect(getThemeForPath('/explore/birthdays').id).toBe('explore');
    expect(getThemeForPath('/login').id).toBe('sunset');
  });
});
