import type { DonationFrequency } from '@/lib/types/donation';
import type { ShareSharer } from './caption';

import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import de from '../../../locales/de/share.json';
import en from '../../../locales/en/share.json';
import { captionKey } from './caption';

const name = 'Forests for Our Future';

const translate = (locale: 'en' | 'de') =>
  createTranslator({
    locale,
    messages: { en, de }[locale],
    namespace: 'Share',
  });

const caption = (locale: 'en' | 'de', sharer: ShareSharer) =>
  translate(locale)(
    `captions.${captionKey({ sharer, season: 'none', concluded: false })}`,
    { name }
  );

describe('captionKey', () => {
  it('lets only a donor who just gave say so', () => {
    expect(
      captionKey({ sharer: 'donor', season: 'none', concluded: false })
    ).toBe('donor');
    expect(
      captionKey({ sharer: 'supporter', season: 'none', concluded: false })
    ).toBe('supporter');
  });

  it("gives a host the season's caption", () => {
    expect(
      captionKey({ sharer: 'host', season: 'none', concluded: false })
    ).toBe('none');
    expect(
      captionKey({ sharer: 'host', season: 'birthday', concluded: false })
    ).toBe('birthday');
  });

  it.each<ShareSharer>(['host', 'donor', 'supporter'])(
    'thanks instead of asking once the fundraiser ended, for a %s',
    sharer => {
      expect(captionKey({ sharer, season: 'christmas', concluded: true })).toBe(
        'concluded'
      );
    }
  );

  it('asks without claiming a gift from the fundraiser page', () => {
    expect(caption('en', 'supporter')).toBe(
      'Please support Forests for Our Future. Every donation helps!'
    );
    expect(caption('de', 'supporter')).toBe(
      'Bitte unterstütze Forests for Our Future. Jede Spende hilft!'
    );
    expect(caption('en', 'host')).toBe(
      "I'm fundraising for Forests for Our Future. Every donation helps. Will you join me?"
    );
  });
});

describe('gift captions', () => {
  it.each<[DonationFrequency, string, string]>([
    [
      'once',
      'I just gave €50 to "Forests for Our Future". Join me:',
      'Ich habe gerade €50 für „Forests for Our Future“ gespendet. Mach mit:',
    ],
    [
      'monthly',
      'I give €50 every month to "Forests for Our Future". Join me:',
      'Ich spende jeden Monat €50 für „Forests for Our Future“. Mach mit:',
    ],
    [
      'yearly',
      'I give €50 every year to "Forests for Our Future". Join me:',
      'Ich spende jedes Jahr €50 für „Forests for Our Future“. Mach mit:',
    ],
  ])(
    'quotes the fundraiser name for a %s gift',
    (frequency, english, german) => {
      const gift = (locale: 'en' | 'de') =>
        translate(locale)(`captions.gift.${frequency}`, {
          amount: '€50',
          name,
        });
      expect(gift('en')).toBe(english);
      expect(gift('de')).toBe(german);
    }
  );
});
