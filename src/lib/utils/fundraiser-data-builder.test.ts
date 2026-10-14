import { describe, expect, it } from 'vitest';
import { buildDefaultCreateValues } from '@/components/fundraisers/fundraiser-form-schema';
import {
  buildCreateFundraiserRequest,
  buildUpdateFundraiserRequest,
} from './fundraiser-data-builder';

const values = () => buildDefaultCreateValues('/fundraisers/create');

describe('the contribution settings in a request', () => {
  it('start as the platform own amounts, so a new fundraiser changes nothing', () => {
    expect(values().settings.modules.contribution).toEqual({
      options: [],
      allow_dedication: true,
      allow_recurrency: true,
    });
  });

  it('are sent when a fundraiser is created', () => {
    const chosen = values();
    chosen.settings.modules.contribution = {
      options: [{ unit: 5, default: true }, { min: 4 }],
      allow_dedication: false,
      allow_recurrency: true,
      recurrency_options: ['once', 'monthly'],
      default_recurrency: 'monthly',
    };
    expect(
      buildCreateFundraiserRequest(chosen).settings.modules.contribution
    ).toEqual(chosen.settings.modules.contribution);
  });

  it('are sent on update only when they were changed', () => {
    const edited = values();
    edited.settings.modules.contribution = {
      options: [{ unit: 5 }],
      allow_dedication: true,
      allow_recurrency: false,
    };
    const untouched = buildUpdateFundraiserRequest(edited, {});
    expect(untouched.settings).toBeUndefined();

    const changed = buildUpdateFundraiserRequest(edited, {
      settings: { modules: { contribution: { options: [{ unit: true }] } } },
    } as never);
    expect(changed.settings?.modules?.contribution).toEqual(
      edited.settings.modules.contribution
    );
  });
});
