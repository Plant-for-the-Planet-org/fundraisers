import type { ShareRenderData } from './types';

import { describe, expect, it } from 'vitest';
import { createCanvas } from '@napi-rs/canvas';
import { SHARE_FORMATS, SHARE_VIDEO_SECONDS } from '../formats';
import { drawShareFrame } from './draw-share-frame';
import { SEASON_IDS } from './seasons';

const data: ShareRenderData = {
  name: 'Forests for Our Future',
  byLine: 'by Maya Schneider',
  raised: 3400,
  goal: 5000,
  formatMoney: amount => `€${Math.round(amount)}`,
  raisedLine: (raised, goal) =>
    goal ? `${raised} raised of ${goal}` : `${raised} raised`,
  donors: ['Anna', 'Ben', 'Chloé', 'David', 'Emre'],
  donorsLine: 'Anna, Ben and 46 others have given',
  cta: 'Join me',
  concluded: false,
  firstLine: null,
  badge: null,
  url: 'startplanting.org/raise/forests',
};

/** How many pixels in a strip differ from the background colour at its top-left corner. */
function busyPixels(pixels: Uint8ClampedArray) {
  let busy = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (
      Math.abs(pixels[i] - pixels[0]) +
        Math.abs(pixels[i + 1] - pixels[1]) +
        Math.abs(pixels[i + 2] - pixels[2]) >
      60
    )
      busy++;
  }
  return busy;
}

describe('drawShareFrame', () => {
  for (const format of Object.keys(SHARE_FORMATS) as Array<
    keyof typeof SHARE_FORMATS
  >) {
    for (const season of SEASON_IDS) {
      it(`draws ${format} in the ${season} style`, () => {
        const { w, h } = SHARE_FORMATS[format];
        const canvas = createCanvas(w, h);
        const g = canvas.getContext(
          '2d'
        ) as unknown as CanvasRenderingContext2D;
        for (const t of [0, 1.5, SHARE_VIDEO_SECONDS]) {
          drawShareFrame(g, t, {
            format,
            data,
            theme: {
              accent: '#007a49',
              mode: 'dark',
              titleFont: 'sans-serif',
              bodyFont: 'sans-serif',
              season,
            },
            photo: null,
          });
        }
        // The end frame has content: something other than background across the middle rows.
        const busy = [0.3, 0.4, 0.5, 0.6].reduce(
          (sum, at) =>
            sum + busyPixels(g.getImageData(0, Math.round(h * at), w, 4).data),
          0
        );
        expect(busy).toBeGreaterThan(0);
      });
    }
  }

  it('draws without a goal or donors', () => {
    const canvas = createCanvas(1080, 1920);
    const g = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
    expect(() =>
      drawShareFrame(g, SHARE_VIDEO_SECONDS, {
        format: 'story',
        data: { ...data, goal: null, donors: [], donorsLine: null },
        theme: {
          accent: '#e11d48',
          mode: 'light',
          titleFont: 'sans-serif',
          bodyFont: 'sans-serif',
          season: 'none',
        },
        photo: null,
      })
    ).not.toThrow();
  });
});
