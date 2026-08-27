import type { Auth0TokenClaims, Auth0UserInfo } from '../types/auth';

import { describe, expect, it } from 'vitest';
import { deriveIdentity } from './auth0-identity';

const EMAIL_CLAIM = 'https://app.plant-for-the-planet.org/email';
const VERIFIED_CLAIM = 'https://app.plant-for-the-planet.org/email_verified';

const claims = (over: Auth0TokenClaims = {}): Auth0TokenClaims => ({
  sub: 'auth0|123',
  [EMAIL_CLAIM]: 'ana.silva@example.org',
  [VERIFIED_CLAIM]: true,
  ...over,
});

const userInfo = (over: Auth0UserInfo = {}): Auth0UserInfo => ({
  sub: 'auth0|123',
  ...over,
});

describe('deriveIdentity: email', () => {
  it('prefers the namespaced claim, as the platform does', () => {
    const result = deriveIdentity(
      claims({ email: 'standard@example.org' }),
      null
    );

    expect(result.email).toBe('ana.silva@example.org');
  });

  it('falls back to the standard claim', () => {
    const result = deriveIdentity(
      { [EMAIL_CLAIM]: undefined, email: 'standard@example.org' },
      null
    );

    expect(result.email).toBe('standard@example.org');
  });

  it('falls back to /userinfo when the token carries no email', () => {
    const result = deriveIdentity(
      {},
      userInfo({ email: 'from-userinfo@example.org' })
    );

    expect(result.email).toBe('from-userinfo@example.org');
  });

  it('reports no email rather than an empty string', () => {
    expect(deriveIdentity({}, null).email).toBeNull();
  });
});

describe('deriveIdentity: emailVerified', () => {
  it('accepts a boolean', () => {
    expect(
      deriveIdentity(claims({ [VERIFIED_CLAIM]: true }), null).emailVerified
    ).toBe(true);
  });

  // Auth0 sends a string on some connections and the platform parses both.
  it("accepts the string 'true'", () => {
    expect(
      deriveIdentity(claims({ [VERIFIED_CLAIM]: 'true' }), null).emailVerified
    ).toBe(true);
  });

  it('treats a missing claim as unverified', () => {
    expect(deriveIdentity({}, null).emailVerified).toBe(false);
  });

  it('treats false as unverified', () => {
    expect(
      deriveIdentity(claims({ [VERIFIED_CLAIM]: false }), null).emailVerified
    ).toBe(false);
  });
});

describe('deriveIdentity: name from /userinfo', () => {
  it('uses given_name and family_name when Auth0 has them', () => {
    const result = deriveIdentity(
      claims(),
      userInfo({ given_name: 'Ana', family_name: 'Silva' })
    );

    expect(result).toMatchObject({ firstname: 'Ana', lastname: 'Silva' });
  });

  it('splits a full name when only `name` is set', () => {
    const result = deriveIdentity(claims(), userInfo({ name: 'Ana Silva' }));

    expect(result).toMatchObject({ firstname: 'Ana', lastname: 'Silva' });
  });

  it('keeps every trailing word as the last name', () => {
    const result = deriveIdentity(
      claims(),
      userInfo({ name: 'Ana Maria da Silva' })
    );

    expect(result).toMatchObject({
      firstname: 'Ana',
      lastname: 'Maria da Silva',
    });
  });

  // Auth0 fills `name` with the email address for email and password signups.
  it('ignores a `name` that is just the email address', () => {
    const result = deriveIdentity(
      claims(),
      userInfo({ name: 'ana.silva@example.org' })
    );

    expect(result).toMatchObject({ firstname: 'Ana', lastname: 'Silva' });
  });

  it('falls back to the email when /userinfo is unavailable', () => {
    const result = deriveIdentity(claims(), null);

    expect(result).toMatchObject({ firstname: 'Ana', lastname: 'Silva' });
  });
});

describe('deriveIdentity: name from the email address', () => {
  it('splits on dots, underscores, plus and hyphen', () => {
    const result = deriveIdentity(
      { [EMAIL_CLAIM]: 'ana_maria-silva@example.org' },
      null
    );

    expect(result).toMatchObject({ firstname: 'Ana', lastname: 'Maria Silva' });
  });

  it('drops a tag and digit-only parts', () => {
    const result = deriveIdentity(
      { [EMAIL_CLAIM]: 'ana.silva+newsletter.2024@example.org' },
      null
    );

    expect(result).toMatchObject({
      firstname: 'Ana',
      lastname: 'Silva Newsletter',
    });
  });

  it('keeps digits attached to a word', () => {
    const result = deriveIdentity(
      { [EMAIL_CLAIM]: 'ana.silva35@example.org' },
      null
    );

    expect(result).toMatchObject({ firstname: 'Ana', lastname: 'Silva35' });
  });

  it('keeps digit-only parts when dropping them would leave nothing', () => {
    const result = deriveIdentity({ [EMAIL_CLAIM]: '12345@example.org' }, null);

    expect(result).toMatchObject({ firstname: '12345', lastname: '-' });
  });

  it('uses the placeholder when there is no surname to derive', () => {
    const result = deriveIdentity({ [EMAIL_CLAIM]: 'ana@example.org' }, null);

    expect(result).toMatchObject({ firstname: 'Ana', lastname: '-' });
  });
});

describe('deriveIdentity: sanitising for the platform', () => {
  // The platform's last name regex allows no dot, its first name regex does.
  it('keeps a dot in the first name and strips it from the last name', () => {
    const result = deriveIdentity(
      claims(),
      userInfo({ given_name: 'J. Ana', family_name: 'Silva Jr.' })
    );

    expect(result).toMatchObject({
      firstname: 'J. Ana',
      lastname: 'Silva Jr',
    });
  });

  it('strips characters the platform rejects', () => {
    const result = deriveIdentity(
      claims(),
      userInfo({ given_name: 'Ana <script>', family_name: 'Silva (dev)' })
    );

    expect(result).toMatchObject({
      firstname: 'Ana script',
      lastname: 'Silva dev',
    });
  });

  it('keeps accents, apostrophes, hyphens and ß', () => {
    const result = deriveIdentity(
      claims(),
      userInfo({ given_name: "Ana-Maria O'Brien", family_name: 'Gießen Śliwa' })
    );

    expect(result).toMatchObject({
      firstname: "Ana-Maria O'Brien",
      lastname: 'Gießen Śliwa',
    });
  });

  it('falls back to the placeholder when sanitising empties the last name', () => {
    const result = deriveIdentity(
      claims(),
      userInfo({ given_name: 'Ana', family_name: '...' })
    );

    expect(result.lastname).toBe('-');
  });
});

// A 303 body observed on staging, with the account identifiers replaced. The claim set is verbatim: it is the proof that an access token carries no name claims.
describe('deriveIdentity: an observed 303 payload', () => {
  const observed = {
    'https://app.plant-for-the-planet.org/email': 'testuser@example.com',
    'https://app.plant-for-the-planet.org/email_verified': true,
    iss: 'https://accounts.plant-for-the-planet.org/',
    sub: 'auth0|000000000000000000000000',
    aud: [
      'urn:plant-for-the-planet',
      'https://planetapp.eu.auth0.com/userinfo',
    ],
    scope: 'openid profile email offline_access',
  };

  it('reads the email and verified flag', () => {
    const result = deriveIdentity(observed, null);

    expect(result.email).toBe('testuser@example.com');
    expect(result.emailVerified).toBe(true);
  });

  it('falls back to the email for the name, since the token has none', () => {
    const result = deriveIdentity(observed, null);

    expect(result).toMatchObject({
      firstname: 'Testuser',
      lastname: '-',
    });
  });
});
