import { describe, expect, it } from 'vitest';
import { platformUserMessage } from './http-error-classifier';
import { PlatformAPIError } from './platform-fetch';

function conflict(body: unknown) {
  return new PlatformAPIError('http', 409, body);
}

describe('platformUserMessage', () => {
  it('returns the sentence the platform wrote for a refusal', () => {
    // Three different refusals all arrive as 409 with the same `state_conflict` code, so the
    // sentence is the only thing that says which one happened.
    const error = conflict({
      error_type: 'conflict_error',
      error_code: 'state_conflict',
      status: 409,
      message:
        'A fundraiser can only invite hosts once it has been published. Publish it first, then invite.',
    });

    expect(platformUserMessage(error)).toBe(
      'A fundraiser can only invite hosts once it has been published. Publish it first, then invite.'
    );
  });

  it('returns null for a validation failure, whose text is not written for a reader', () => {
    // How a duplicate host arrives: the text sits under parameters.errors and reads like an
    // assertion. The caller falls back to its own copy for this one.
    const error = new PlatformAPIError('http', 400, {
      error_type: 'validation_failed',
      error_code: 'validation_error',
      parameters: {
        errors: 'A host with this email already exists for this fundraiser.',
      },
      status: 400,
    });

    expect(platformUserMessage(error)).toBeNull();
  });

  it('ignores a message that is missing, empty or not a string', () => {
    expect(
      platformUserMessage(conflict({ error_code: 'state_conflict' }))
    ).toBeNull();
    expect(platformUserMessage(conflict({ message: '' }))).toBeNull();
    expect(platformUserMessage(conflict({ message: '   ' }))).toBeNull();
    expect(platformUserMessage(conflict({ message: 42 }))).toBeNull();
    expect(platformUserMessage(conflict({ message: null }))).toBeNull();
  });

  it('trims what it returns', () => {
    expect(
      platformUserMessage(conflict({ message: '  Try again tomorrow.  ' }))
    ).toBe('Try again tomorrow.');
  });

  it('ignores bodies that are not objects, and errors that are not platform errors', () => {
    expect(platformUserMessage(conflict(null))).toBeNull();
    expect(platformUserMessage(conflict('plain text body'))).toBeNull();
    expect(platformUserMessage(new Error('boom'))).toBeNull();
    expect(platformUserMessage(undefined)).toBeNull();
  });
});
