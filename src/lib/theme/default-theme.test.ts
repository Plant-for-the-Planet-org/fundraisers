import { describe, expect, it } from 'vitest';
import { FEATURED_THEMES } from '@/components/fundraisers/theme-settings/constants';
import { buildTheme } from './build-theme';
import { DEFAULT_THEME, THEMES } from './themes';

describe('the default theme', () => {
  it('looks like Spring Vibes without its pattern', () => {
    expect(DEFAULT_THEME.id).toBe('default');
    expect(DEFAULT_THEME.bg.decoration).toBe('none');
    expect(DEFAULT_THEME.bg.gradient).toBe(THEMES.spring.bg.gradient);
    expect(DEFAULT_THEME.accent).toBe(THEMES.spring.accent);
  });

  it('is not offered in the theme picker', () => {
    expect(FEATURED_THEMES.map(theme => theme.id)).not.toContain('default');
  });

  it('is what a fundraiser without theme settings gets', () => {
    expect(buildTheme(null).bg.decoration).toBe('none');
    expect(buildTheme({}).bg.decoration).toBe('none');
  });

  it('leaves Spring Vibes with its pattern for fundraisers that pick it', () => {
    expect(THEMES.spring.bg.decoration).toBe('pattern');
    expect(
      buildTheme({ base_id: 'spring', bg: THEMES.spring.bg }).bg.pattern_id
    ).toBe('bg-spring');
  });
});
