import { describe, expect, it } from 'vitest';
import { parseUtmParams } from './utm';

const fundraiser = { id: 'fr_GhHeVDCYkqsh', hid: '260MYJVQ2P' };

describe('parseUtmParams', () => {
  it('reads every campaign param off the query string', () => {
    expect(
      parseUtmParams(
        '?utm_source=stage&utm_medium=qr&utm_campaign=stage-mode&utm_content=panel&utm_term=trees',
        fundraiser
      )
    ).toEqual({
      utm_source: 'stage',
      utm_medium: 'qr',
      utm_content: 'panel',
      utm_term: 'trees',
      utm_campaign_name: 'stage-mode',
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
    ).toEqual({
      utm_medium: 'qr',
    });
  });

  it('keeps the URL campaign clear of the reserved utm_campaign key', () => {
    expect(parseUtmParams('?utm_campaign=spring-drive', fundraiser)).toEqual({
      utm_campaign_name: 'spring-drive',
    });
  });

  it('drops a legacy link that repeats this fundraiser back at us', () => {
    expect(
      parseUtmParams(`?utm_campaign=${fundraiser.id}`, fundraiser)
    ).toBeUndefined();
    expect(
      parseUtmParams(`?utm_campaign=${fundraiser.hid}`, fundraiser)
    ).toBeUndefined();
  });

  it('drops any fundraiser GUID, since the donation already belongs to one', () => {
    expect(
      parseUtmParams('?utm_campaign=fr_aBcDeFgHiJkL', fundraiser)
    ).toBeUndefined();
  });

  it('keeps a campaign that merely looks like a legacy HID', () => {
    expect(parseUtmParams('?utm_campaign=24SPRING01', fundraiser)).toEqual({
      utm_campaign_name: '24SPRING01',
    });
  });

  it('keeps the other params when only the campaign is a fundraiser reference', () => {
    expect(
      parseUtmParams(
        `?utm_source=qr&utm_campaign=${fundraiser.hid}`,
        fundraiser
      )
    ).toEqual({ utm_source: 'qr' });
  });

  it('caps a value a crafted link could make arbitrarily long', () => {
    const result = parseUtmParams(
      `?utm_campaign=${'a'.repeat(500)}`,
      fundraiser
    );

    expect(result?.utm_campaign_name).toHaveLength(200);
  });
});
