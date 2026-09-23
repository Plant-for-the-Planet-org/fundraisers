import { describe, expect, it } from 'vitest';
import { routeLocale } from './locale-routing';
import {
  isLocalizedPath,
  localizeHref,
  localizePath,
  splitLocalePrefix,
} from './localized-paths';

describe('isLocalizedPath', () => {
  it.each(['/', '/explore', '/explore/berlin'])('localizes %s', path => {
    expect(isLocalizedPath(path)).toBe(true);
  });

  it.each(['/raise/abc', '/dashboard', '/explorer', '/login'])(
    'does not localize %s',
    path => {
      expect(isLocalizedPath(path)).toBe(false);
    }
  );
});

describe('splitLocalePrefix', () => {
  it('splits a prefixed path', () => {
    expect(splitLocalePrefix('/de/explore/berlin')).toEqual({
      locale: 'de',
      pathname: '/explore/berlin',
    });
  });

  it('maps a bare prefix to the root', () => {
    expect(splitLocalePrefix('/de')).toEqual({ locale: 'de', pathname: '/' });
  });

  it('leaves other first segments alone', () => {
    expect(splitLocalePrefix('/dashboard')).toEqual({ pathname: '/dashboard' });
  });
});

describe('localizePath', () => {
  it('adds a prefix for German', () => {
    expect(localizePath('/', 'de')).toBe('/de');
    expect(localizePath('/explore/berlin', 'de')).toBe('/de/explore/berlin');
  });

  it('removes the prefix for English', () => {
    expect(localizePath('/de/explore', 'en')).toBe('/explore');
    expect(localizePath('/de', 'en')).toBe('/');
  });

  it('never prefixes pages that are not localized', () => {
    expect(localizePath('/raise/abc', 'de')).toBe('/raise/abc');
  });
});

describe('routeLocale', () => {
  it('serves /de pages in German', () => {
    expect(routeLocale({ pathname: '/de' })).toEqual({
      type: 'rewrite',
      pathname: '/',
      locale: 'de',
    });
  });

  it('lets the URL win over a saved English choice', () => {
    expect(
      routeLocale({ pathname: '/de/explore', cookieLocale: 'en.explicit' })
    ).toEqual({ type: 'rewrite', pathname: '/explore', locale: 'de' });
  });

  it('redirects the default locale prefix away', () => {
    expect(routeLocale({ pathname: '/en/explore' })).toEqual({
      type: 'redirect',
      pathname: '/explore',
    });
  });

  it('redirects a prefix on a page that is not localized', () => {
    expect(routeLocale({ pathname: '/de/raise/abc' })).toEqual({
      type: 'redirect',
      pathname: '/raise/abc',
    });
  });

  it('serves unprefixed pages in English when there is no cookie', () => {
    expect(routeLocale({ pathname: '/explore' })).toEqual({
      type: 'next',
      locale: 'en',
    });
  });

  it.each(['de.explicit', 'de.profile', 'de'])(
    'redirects to German for cookie %s',
    cookieLocale => {
      expect(
        routeLocale({ pathname: '/explore/berlin', cookieLocale })
      ).toEqual({
        type: 'redirect',
        pathname: '/de/explore/berlin',
      });
    }
  );

  it('leaves pages that are not localized to the cookie and browser', () => {
    expect(
      routeLocale({ pathname: '/raise/abc', cookieLocale: 'de.explicit' })
    ).toEqual({ type: 'next' });
  });
});

describe('localizeHref', () => {
  it('keeps the query string', () => {
    expect(localizeHref('/explore/berlin?sort=new', 'de')).toBe(
      '/de/explore/berlin?sort=new'
    );
  });

  it('leaves external and relative hrefs alone', () => {
    expect(localizeHref('https://example.org', 'de')).toBe(
      'https://example.org'
    );
    expect(localizeHref('#top', 'de')).toBe('#top');
  });
});
