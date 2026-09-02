import { describe, expect, it } from 'vitest';
import { parseUtmParams } from './utm';

const fundraiser = { id: 'fr_GhHeVDCYkqsh', hid: '260MYJVQ2P' };

describe('parseUtmParams', () => {
  it('reads every campaign param off the query string', () => {
    expect(
      parseUtmParams(
        '?utm_source=stage&utm_medium=qr&utm_id=abc123&utm_content=panel&utm_term=trees',
        fundraiser
      )
    ).toEqual({
      utm_source: 'stage',
      utm_medium: 'qr',
      utm_id: 'abc123',
      utm_content: 'panel',
      utm_term: 'trees',
    });
  });

  it('keeps only the params that are present', () => {
    expect(parseUtmParams('?utm_source=newsletter&ref=x', fundraiser)).toEqual({
      utm_source: 'newsletter',
    });
  });

  it('returns undefined when there is no campaign, so the field is omitted', () => {
    expect(parseUtmParams('', fundraiser)).toBeUndefined();
    expect(
      parseUtmParams('?redirectTo=/raise/tree-drive', fundraiser)
    ).toBeUndefined();
  });

  it('ignores blank values', () => {
    expect(
      parseUtmParams('?utm_source=%20%20&utm_medium=qr', fundraiser)
    ).toEqual({ utm_medium: 'qr' });
  });

  // The platform still reserves `utm_campaign` for the fundraiser GUID, so the URL's
  // own campaign is left alone rather than stored under an invented key.
  it('does not capture utm_campaign yet', () => {
    expect(
      parseUtmParams('?utm_campaign=spring-drive', fundraiser)
    ).toBeUndefined();
    expect(
      parseUtmParams('?utm_source=qr&utm_campaign=spring-drive', fundraiser)
    ).toEqual({ utm_source: 'qr' });
  });

  it('keeps utm_id, which ad platforms and Planet widgets send', () => {
    expect(parseUtmParams('?utm_id=summer_2026', fundraiser)).toEqual({
      utm_id: 'summer_2026',
    });
  });

  it('drops a fundraiser reference arriving as utm_id', () => {
    expect(
      parseUtmParams(`?utm_id=${fundraiser.id}`, fundraiser)
    ).toBeUndefined();
    expect(
      parseUtmParams(`?utm_id=${fundraiser.hid}`, fundraiser)
    ).toBeUndefined();
    expect(
      parseUtmParams('?utm_id=fr_aBcDeFgHiJkL', fundraiser)
    ).toBeUndefined();
  });

  it('keeps a utm_id that merely looks like a legacy HID', () => {
    expect(parseUtmParams('?utm_id=24SPRING01', fundraiser)).toEqual({
      utm_id: '24SPRING01',
    });
  });

  it('keeps the other params when only utm_id is a fundraiser reference', () => {
    expect(
      parseUtmParams(`?utm_source=qr&utm_id=${fundraiser.hid}`, fundraiser)
    ).toEqual({ utm_source: 'qr' });
  });

  it('caps a value a crafted link could make arbitrarily long', () => {
    const result = parseUtmParams(`?utm_id=${'a'.repeat(500)}`, fundraiser);

    expect(result?.utm_id).toHaveLength(200);
  });
});
