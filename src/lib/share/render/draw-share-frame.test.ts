import type { ShareFormatId } from '../formats';
import type { SeasonId } from './seasons';
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
  giftLine: null,
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

const withGift: ShareRenderData = { ...data, giftLine: 'I just gave €50!' };

// The most a column has to hold: a name that wraps to three lines and a long gift line.
const crowded: ShareRenderData = {
  ...data,
  name: 'Forests for Our Future: one million trees for the Yucatán Peninsula and its people',
  giftLine: 'Ich spende jeden Monat 1.000.000 €!',
};

// Text with no space to break at, and single lines longer than any column.
const japanese: ShareRenderData = {
  ...data,
  name: '未来の森のために一緒に木を植えましょう百万本の木をユカタン半島とそこに暮らす人々へ届けるための募金活動',
  byLine:
    'by 株式会社プラント・フォー・ザ・プラネット・ジャパン東京本社サステナビリティ推進部',
  // A custom button text at its longest (CUSTOM_CTA_MAX_LENGTH).
  cta: '一緒に木を植えて未来の森を守りましょう今すぐ参加',
};

const german: ShareRenderData = {
  ...data,
  name: 'Geburtstagsspendenaktion',
  byLine:
    'von Plant-for-the-Planet Foundation Deutschland gemeinnützige GmbH und alle Freundinnen und Freunde',
  raisedLine: (raised, goal) =>
    goal ? `${raised} von ${goal} gesammelt` : `${raised} gesammelt`,
  formatMoney: amount => `${Math.round(amount).toLocaleString('de-DE')} €`,
  raised: 123_456_789,
  goal: 987_654_321,
  donors: ['Maximilian-Alexander', 'Bartholomäus'],
  donorsLine:
    'Maximilian-Alexander, Bartholomäus und 1.046 weitere haben gespendet',
  url: 'startplanting.org/raise/geburtstagsspendenaktion-fuer-oma-und-opa-im-schwarzwald-2026',
  cta: 'MACH MIT FÜR MEHR WÄLDER',
};

const FORMATS = Object.keys(SHARE_FORMATS) as ShareFormatId[];

interface Box {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface TextBox extends Box {
  text: string;
}

const overlaps = (a: Box, b: Box) =>
  a.top < b.bottom && b.top < a.bottom && a.left < b.right && b.left < a.right;

const contains = (outer: Box, inner: Box) =>
  outer.top <= inner.top &&
  outer.bottom >= inner.bottom &&
  outer.left <= inner.left &&
  outer.right >= inner.right;

/** Every line of text the final frame draws, and every rounded box it fills (badge, gift pill, button), in canvas pixels. */
function drawnFrame(
  format: ShareFormatId,
  frameData: ShareRenderData,
  season: SeasonId
): { boxes: TextBox[]; shapes: Box[] } {
  const { w, h } = SHARE_FORMATS[format];
  const target = createCanvas(w, h).getContext(
    '2d'
  ) as unknown as CanvasRenderingContext2D;
  const boxes: TextBox[] = [];
  const shapes: Box[] = [];
  let corners: Array<[number, number]> = [];
  const toCanvas = (x: number, y: number): [number, number] => {
    const m = target.getTransform();
    return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  };
  const g = new Proxy(target, {
    get(obj, key) {
      if (key === 'beginPath') {
        return () => {
          corners = [];
          obj.beginPath();
        };
      }
      // Only roundRect draws with arcTo, and its control points are the corners of its box.
      if (key === 'arcTo') {
        return (x1: number, y1: number, x2: number, y2: number, r: number) => {
          corners.push(toCanvas(x1, y1), toCanvas(x2, y2));
          obj.arcTo(x1, y1, x2, y2, r);
        };
      }
      if (key === 'fill') {
        return () => {
          if (corners.length) {
            const xs = corners.map(([x]) => x);
            const ys = corners.map(([, y]) => y);
            shapes.push({
              top: Math.min(...ys),
              bottom: Math.max(...ys),
              left: Math.min(...xs),
              right: Math.max(...xs),
            });
          }
          obj.fill();
        };
      }
      if (key === 'fillText') {
        return (text: string, x: number, y: number, maxWidth?: number) => {
          obj.fillText(text, x, y, maxWidth);
          if (!text) return;
          const m = obj.getTransform();
          const scale = Math.hypot(m.a, m.b);
          const size = Number(/([\d.]+)px/.exec(obj.font)?.[1]) * scale;
          // With a maxWidth, the canvas narrows the text to fit it.
          const width =
            Math.min(obj.measureText(text).width, maxWidth ?? Infinity) * scale;
          const cx = m.a * x + m.c * y + m.e;
          const cy = m.b * x + m.d * y + m.f;
          const left = obj.textAlign === 'center' ? cx - width / 2 : cx;
          boxes.push({
            text,
            top: cy - size / 2,
            bottom: cy + size / 2,
            left,
            right: left + width,
          });
        };
      }
      const value = Reflect.get(obj, key, obj);
      return typeof value === 'function' ? value.bind(obj) : value;
    },
    set: (obj, key, value) => Reflect.set(obj, key, value, obj),
  });
  drawShareFrame(g, SHARE_VIDEO_SECONDS, {
    format,
    data: frameData,
    theme: {
      accent: '#007a49',
      mode: 'light',
      titleFont: 'sans-serif',
      bodyFont: 'sans-serif',
      season,
    },
    photo: null,
  });
  return { boxes, shapes };
}

describe('drawShareFrame', () => {
  for (const format of FORMATS) {
    for (const season of SEASON_IDS) {
      it(`draws ${format} in the ${season} style, with and without a gift`, () => {
        const { w, h } = SHARE_FORMATS[format];
        const canvas = createCanvas(w, h);
        const g = canvas.getContext(
          '2d'
        ) as unknown as CanvasRenderingContext2D;
        for (const frameData of [data, withGift]) {
          for (const t of [0, 1.5, SHARE_VIDEO_SECONDS]) {
            drawShareFrame(g, t, {
              format,
              data: frameData,
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

  it('scales the photo shadow with a denser canvas, since shadows ignore the canvas scale', () => {
    const shadows = (scale: number) => {
      const { w, h } = SHARE_FORMATS.story;
      const target = createCanvas(w * scale, h * scale).getContext(
        '2d'
      ) as unknown as CanvasRenderingContext2D;
      const set: Array<[string, number]> = [];
      const g = new Proxy(target, {
        get(obj, key) {
          const value = Reflect.get(obj, key, obj);
          return typeof value === 'function' ? value.bind(obj) : value;
        },
        set(obj, key, value) {
          if (key === 'shadowBlur' || key === 'shadowOffsetY')
            set.push([key, value]);
          return Reflect.set(obj, key, value, obj);
        },
      });
      drawShareFrame(g, SHARE_VIDEO_SECONDS, {
        format: 'story',
        data,
        theme: {
          accent: '#007a49',
          mode: 'light',
          titleFont: 'sans-serif',
          bodyFont: 'sans-serif',
          season: 'none',
        },
        photo: null,
        scale,
      });
      return set;
    };
    const single = shadows(1);

    expect(single.length).toBeGreaterThan(0);
    expect(shadows(2)).toEqual(single.map(([key, value]) => [key, value * 2]));
  });

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

  describe('layout', () => {
    for (const format of FORMATS) {
      for (const season of SEASON_IDS) {
        for (const [label, frameData, fullSize] of [
          ['no gift', data, true],
          ['a gift', withGift, true],
          // The gift may shrink to fit the column.
          ['a long name and gift', crowded, false],
          ['a Japanese name, host and button text', japanese, true],
          [
            'a long German word, host, amount, donors, link and button text',
            german,
            true,
          ],
        ] as const) {
          it(`keeps ${format} in the ${season} style with ${label} inside the safe zone, without overlap`, () => {
            const z = SHARE_FORMATS[format].zone;
            const { boxes, shapes } = drawnFrame(format, frameData, season);
            const inZone = (box: Box, name: string) => {
              expect(box.top, name).toBeGreaterThanOrEqual(z.y);
              expect(box.bottom, name).toBeLessThanOrEqual(z.y + z.h);
              expect(box.left, name).toBeGreaterThanOrEqual(z.x);
              expect(box.right, name).toBeLessThanOrEqual(z.x + z.w);
            };
            for (const box of boxes) inZone(box, box.text);
            boxes.forEach((a, i) => {
              for (const b of boxes.slice(i + 1)) {
                expect(overlaps(a, b), `${a.text} / ${b.text}`).toBe(false);
              }
            });
            const button = boxes.find(box => box.text === frameData.cta)!;
            expect(
              shapes.some(shape => contains(shape, button)),
              'button text inside the button'
            ).toBe(true);
            const gift = boxes.find(box => box.text === frameData.giftLine);
            expect(Boolean(gift)).toBe(frameData.giftLine !== null);
            if (!gift) return;

            const pill = shapes.find(shape => contains(shape, gift));
            expect(pill, 'a pill around the gift').toBeDefined();
            inZone(pill!, 'gift pill');
            for (const box of boxes) {
              if (box !== gift)
                expect(overlaps(pill!, box), `gift pill / ${box.text}`).toBe(
                  false
                );
            }
            for (const shape of shapes) {
              if (shape !== pill)
                expect(
                  overlaps(pill!, shape),
                  'gift pill / badge or button'
                ).toBe(false);
            }
            const raised = boxes.find(box => box.text.includes('raised'))!;
            // Directly under the amount.
            expect(pill!.top).toBeGreaterThanOrEqual(raised.bottom);
            expect(pill!.top - raised.bottom).toBeLessThan(
              raised.bottom - raised.top
            );
            // A fifth larger than the amount, unless it had to shrink.
            if (fullSize) {
              expect(
                (gift.bottom - gift.top) / (raised.bottom - raised.top)
              ).toBeCloseTo(1.2, 1);
            }
          });
        }
      }
    }
  });
});
