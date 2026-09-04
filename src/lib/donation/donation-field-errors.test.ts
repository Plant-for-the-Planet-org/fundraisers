import { describe, expect, it } from 'vitest';
import { readPlatformFieldErrors } from '../api/platform-field-errors';
import { toDonationFieldErrors } from './donation-field-errors';

describe('readPlatformFieldErrors', () => {
  it('reads the map the platform sends under parameters.errors', () => {
    expect(
      readPlatformFieldErrors({
        error_type: 'validation_failed',
        error_code: 'field_validation_failed',
        message: 'Validation failed with field errors.',
        parameters: { errors: { 'donor.city': ['form.city.invalid'] } },
      })
    ).toEqual({ 'donor.city': ['form.city.invalid'] });
  });

  it('wraps a bare string message in a list', () => {
    expect(
      readPlatformFieldErrors({
        parameters: { errors: { 'donor.city': 'form.city.invalid' } },
      })
    ).toEqual({ 'donor.city': ['form.city.invalid'] });
  });

  it('returns null for bodies without the map', () => {
    expect(readPlatformFieldErrors(null)).toBeNull();
    expect(readPlatformFieldErrors('nope')).toBeNull();
    expect(readPlatformFieldErrors({})).toBeNull();
    expect(readPlatformFieldErrors({ parameters: {} })).toBeNull();
    expect(readPlatformFieldErrors({ parameters: { errors: [] } })).toBeNull();
    expect(
      readPlatformFieldErrors({ parameters: { errors: { 'donor.city': [] } } })
    ).toBeNull();
    // The shape the old extraction looked for, which the platform never sends.
    expect(
      readPlatformFieldErrors({ errors: { 'donor.city': ['x'] } })
    ).toBeNull();
  });
});

describe('toDonationFieldErrors', () => {
  it('maps a donor path onto its form field and error key', () => {
    expect(
      toDonationFieldErrors({ 'donor.city': ['form.city.invalid'] })
    ).toEqual({ city: 'city.invalid' });
  });

  it('bridges the three naming schemes', () => {
    expect(
      toDonationFieldErrors({
        'donor.firstname': ['form.firstname.invalid'],
        'donor.companyname': ['form.companyname.invalid'],
      })
    ).toEqual({
      firstname: 'firstName.invalid',
      companyName: 'companyName.invalid',
    });
  });

  it('maps every reason that has a translation', () => {
    expect(
      toDonationFieldErrors({ 'donor.email': ['form.email.required'] })
    ).toEqual({ email: 'email.required' });
  });

  it('drops paths and reasons it cannot resolve', () => {
    expect(
      toDonationFieldErrors({
        'donor.unknownField': ['form.unknownField.invalid'],
        'metadata.utm_campaign': ['form.utm.invalid'],
        'donor.city': ['City looks wrong'],
        'donor.state': ['form.state.required'],
      })
    ).toBeUndefined();
  });

  it('keeps what maps when only some entries resolve', () => {
    expect(
      toDonationFieldErrors({
        'donor.city': ['form.city.invalid'],
        'donor.unknownField': ['form.unknownField.invalid'],
      })
    ).toEqual({ city: 'city.invalid' });
  });

  it('returns undefined for no input', () => {
    expect(toDonationFieldErrors(null)).toBeUndefined();
    expect(toDonationFieldErrors(undefined)).toBeUndefined();
    expect(toDonationFieldErrors({})).toBeUndefined();
  });
});
