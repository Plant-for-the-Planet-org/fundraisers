import { describe, expect, it } from 'vitest';
import { groupReferrers } from './referrer-sources';

describe('groupReferrers', () => {
  it('folds app ids and redirectors into one platform', () => {
    const result = groupReferrers(
      [
        { x: 'linkedin.com', y: 9 },
        { x: 'com.linkedin.android', y: 8 },
        { x: 'l.instagram.com', y: 7 },
        { x: 'facebook.com', y: 5 },
      ],
      10
    );
    expect(result).toEqual([
      { source: 'linkedin', known: true, visitors: 17 },
      { source: 'instagram', known: true, visitors: 7 },
      { source: 'facebook', known: true, visitors: 5 },
    ]);
  });

  it('drops sign-in redirects and our own domains', () => {
    const result = groupReferrers(
      [
        { x: 'accounts.google.com', y: 4 },
        { x: 'startplanting.org', y: 3 },
        { x: 'google.com', y: 2 },
      ],
      10
    );
    expect(result).toEqual([{ source: 'google', known: true, visitors: 2 }]);
  });

  it('counts webmail as email, not search', () => {
    expect(
      groupReferrers([{ x: 'mail.google.com', y: 1 }], 10)[0]?.source
    ).toBe('email');
  });

  it('keeps unknown sites by domain and respects the limit', () => {
    const result = groupReferrers(
      [
        { x: 'www.blog.example', y: 3 },
        { x: 'news.example', y: 2 },
        { x: 'other.example', y: 1 },
      ],
      2
    );
    expect(result).toEqual([
      { source: 'blog.example', known: false, visitors: 3 },
      { source: 'news.example', known: false, visitors: 2 },
    ]);
  });
});
