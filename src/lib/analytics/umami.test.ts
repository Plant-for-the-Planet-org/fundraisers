import { describe, expect, it } from 'vitest';
import {
  isCollectingInsights,
  isTrackedPath,
  resolveUmamiConfig,
} from './umami';

const base = {
  baseUrl: 'https://umami.example',
  websiteId: 'website-id',
  pathname: '/raise/tree-drive',
};

describe('isTrackedPath', () => {
  it('tracks ordinary pages', () => {
    expect(isTrackedPath('/')).toBe(true);
    expect(isTrackedPath('/raise/tree-drive')).toBe(true);
    expect(isTrackedPath('/explore')).toBe(true);
  });

  it('skips the auth hand-off, which carries an OAuth nonce in the query', () => {
    expect(isTrackedPath('/login')).toBe(false);
    expect(isTrackedPath('/redirecting')).toBe(false);
  });

  it('does not skip a page that merely starts with an untracked name', () => {
    expect(isTrackedPath('/logins')).toBe(true);
  });

  it('skips Stage Mode, which sits on a projector for hours', () => {
    expect(isTrackedPath('/raise/tree-drive/stage')).toBe(false);
  });
});

describe('resolveUmamiConfig', () => {
  it('loads the tracker and the heatmap recorder when configured', () => {
    expect(resolveUmamiConfig(base)).toEqual({
      src: 'https://umami.example/script.js',
      recorderSrc: 'https://umami.example/recorder.js',
      websiteId: 'website-id',
    });
  });

  it('tolerates a trailing slash on the instance url', () => {
    expect(
      resolveUmamiConfig({ ...base, baseUrl: 'https://umami.example//' })
    ).toMatchObject({ src: 'https://umami.example/script.js' });
  });

  it('accepts a same-origin path, for when the scripts are proxied', () => {
    expect(resolveUmamiConfig({ ...base, baseUrl: '/x' })).toMatchObject({
      src: '/x/script.js',
      recorderSrc: '/x/recorder.js',
    });
  });

  it('stays off when no instance is configured', () => {
    expect(resolveUmamiConfig({ ...base, baseUrl: undefined })).toBeNull();
    expect(resolveUmamiConfig({ ...base, baseUrl: '   ' })).toBeNull();
  });

  it('stays off without a website id', () => {
    expect(resolveUmamiConfig({ ...base, websiteId: undefined })).toBeNull();
  });

  it('stays off on untracked paths', () => {
    expect(resolveUmamiConfig({ ...base, pathname: '/login' })).toBeNull();
  });
});

describe('COLLECT_INSIGHTS', () => {
  it('collects by default when the variable is not set', () => {
    expect(isCollectingInsights(undefined)).toBe(true);
    expect(resolveUmamiConfig(base)).not.toBeNull();
  });

  it('turns collection off with false (or 0, off, no), in any case', () => {
    for (const value of ['false', 'FALSE', '0', 'off', 'no', ' False ']) {
      expect(isCollectingInsights(value)).toBe(false);
      expect(
        resolveUmamiConfig({ ...base, collectInsights: value })
      ).toBeNull();
    }
  });

  it('keeps collecting for true or any other value', () => {
    expect(isCollectingInsights('on')).toBe(true);
    expect(isCollectingInsights('true')).toBe(true);
  });
});
