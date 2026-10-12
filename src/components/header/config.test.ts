import { describe, expect, it } from 'vitest';
import { getHeaderLinks } from './config';

const labels = (pathname: string) =>
  getHeaderLinks(pathname).map(link => link.labelKey);

describe('getHeaderLinks', () => {
  it('shows both links on an ordinary page', () => {
    expect(labels('/about')).toEqual(['explore', 'startFundraiser']);
  });

  it('leaves out Explore on the Explore page, where the visitor already is', () => {
    expect(labels('/explore')).toEqual(['startFundraiser']);
  });

  it('keeps Explore on a category page, where it leads back to the list', () => {
    expect(labels('/explore/events')).toEqual(['explore', 'startFundraiser']);
  });

  it('leaves out Start Fundraiser while starting or editing one', () => {
    expect(labels('/fundraisers/create')).toEqual(['explore']);
    expect(labels('/dashboard/fundraisers/edit/x')).toEqual(['explore']);
  });
});
