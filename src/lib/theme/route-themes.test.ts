import { describe, expect, it } from 'vitest';
import { getThemeForPath } from './route-themes';

describe('getThemeForPath', () => {
  it('gives the home page its own theme', () => {
    expect(getThemeForPath('/').id).toBe('stratospheric');
  });

  it('keeps the default theme for unknown paths, including an empty one', () => {
    expect(getThemeForPath('').id).toBe('spring');
    expect(getThemeForPath('/raise/some-fundraiser').id).toBe('spring');
  });

  it('matches the longest prefix', () => {
    expect(getThemeForPath('/explore/birthdays').id).toBe('stratospheric');
    expect(getThemeForPath('/login').id).toBe('sunset');
  });
});
