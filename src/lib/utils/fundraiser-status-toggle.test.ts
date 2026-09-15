import { describe, expect, it } from 'vitest';
import { transitionForStatusToggle } from './fundraiser';

describe('transitionForStatusToggle', () => {
  it('publishes a draft and resumes a paused fundraiser', () => {
    expect(transitionForStatusToggle('draft', 'active')).toBe('publish');
    expect(transitionForStatusToggle('paused', 'active')).toBe('resume');
  });

  it('pauses a live fundraiser, because there is no way back to draft', () => {
    expect(transitionForStatusToggle('active', 'draft')).toBe('pause');
  });

  it('asks for nothing when the fundraiser is already where the switch points', () => {
    expect(transitionForStatusToggle('active', 'active')).toBeNull();
    expect(transitionForStatusToggle('paused', 'draft')).toBeNull();
    expect(transitionForStatusToggle('draft', 'draft')).toBeNull();
  });

  it('leaves finished fundraisers alone', () => {
    // Reopening a completed fundraiser is `reactivate`, which needs a new end date.
    expect(transitionForStatusToggle('completed', 'active')).toBeNull();
    expect(transitionForStatusToggle('cancelled', 'active')).toBeNull();
    expect(transitionForStatusToggle('archived', 'active')).toBeNull();
  });
});
