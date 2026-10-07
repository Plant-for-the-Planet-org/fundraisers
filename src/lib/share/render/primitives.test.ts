import type { Ctx } from './types';

import { describe, expect, it } from 'vitest';
import { fitFont, wrapBalanced } from './primitives';

/** A context whose text is as wide as its code points times its font size, so each test can count widths. */
function fakeContext(): Ctx {
  const g = {
    font: '10px sans-serif',
    measureText: (text: string) => ({
      width:
        Array.from(text).length * Number(/([\d.]+)px/.exec(g.font)?.[1] ?? 10),
    }),
  };
  return g as unknown as Ctx;
}

describe('wrapBalanced', () => {
  it('wraps at spaces and keeps words whole', () => {
    expect(
      wrapBalanced(fakeContext(), 'Forests for Our Future', 120, 3)
    ).toEqual(['Forests for', 'Our Future']);
  });

  it('breaks a word wider than the line between characters', () => {
    const lines = wrapBalanced(
      fakeContext(),
      '未来の森のために一緒に木を植えよう',
      60,
      3
    );

    expect(lines).toEqual(['未来の森のた', 'めに一緒に木', 'を植えよう']);
  });

  it('never splits a character made of several code points', () => {
    // Each "é" is an "e" and a combining accent: two code points, one character.
    const lines = wrapBalanced(fakeContext(), 'é'.repeat(3), 30, 3);

    expect(lines).toEqual(['é', 'é', 'é']);
  });

  it('cuts text past the last line, with an ellipsis that still fits', () => {
    const g = fakeContext();
    const lines = wrapBalanced(
      g,
      'one two three four five six seven eight',
      100,
      2
    );

    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
    for (const line of lines)
      expect(g.measureText(line).width).toBeLessThanOrEqual(100);
  });

  it('does not break a word that fits just to even out the lines', () => {
    expect(
      wrapBalanced(fakeContext(), 'Supercalifragilistic wow', 200, 3)
    ).toEqual(['Supercalifragilistic', 'wow']);
  });
});

describe('fitFont', () => {
  const font = (size: number) => `${size}px sans-serif`;

  it('keeps the size when the text fits', () => {
    const g = fakeContext();

    expect(fitFont(g, 'short', 100, 20, font)).toBe(20);
    expect(g.font).toBe('20px sans-serif');
  });

  it('shrinks the font until the text fits', () => {
    const g = fakeContext();
    const size = fitFont(g, 'twelve chars', 200, 20, font);

    expect(size).toBe(16);
    expect(g.font).toBe('16px sans-serif');
  });

  it('stops at the smallest size, for fillText to narrow the rest', () => {
    const g = fakeContext();

    expect(fitFont(g, 'a very long line of text', 100, 20, font)).toBe(14);
    expect(g.font).toBe('14px sans-serif');
  });
});
