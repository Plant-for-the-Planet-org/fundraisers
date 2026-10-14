import { describe, expect, it } from 'vitest';
import { shouldBlurForPathname } from './backdrop-blur-routes';
import { DEFAULT_PAGE_MAX, getPageMaxForPath } from './page-width';

describe('getPageMaxForPath', () => {
  it('gives the dashboard and the browsing pages the most room', () => {
    expect(getPageMaxForPath('/dashboard/fundraisers/x/share')).toBe('90rem');
    expect(getPageMaxForPath('/explore')).toBe('90rem');
    expect(getPageMaxForPath('/explore/climate-justice')).toBe('90rem');
    expect(getPageMaxForPath('/about')).toBe(DEFAULT_PAGE_MAX);
  });

  it('gives creating and editing a fundraiser the same wide width', () => {
    expect(getPageMaxForPath('/fundraisers/create')).toBe('90rem');
    expect(getPageMaxForPath('/dashboard/fundraisers/edit/x')).toBe('90rem');
  });
});

describe('shouldBlurForPathname', () => {
  it('softens the background behind Explore and its categories, and the create and edit pages', () => {
    expect(shouldBlurForPathname('/explore')).toBe(true);
    expect(shouldBlurForPathname('/explore/events')).toBe(true);
    expect(shouldBlurForPathname('/fundraisers/create')).toBe(true);
    expect(shouldBlurForPathname('/dashboard/fundraisers/edit/x')).toBe(true);
  });

  it('leaves other pages as they are', () => {
    expect(shouldBlurForPathname('/')).toBe(false);
    expect(shouldBlurForPathname('/dashboard')).toBe(false);
    expect(shouldBlurForPathname('/exploring')).toBe(false);
  });
});
