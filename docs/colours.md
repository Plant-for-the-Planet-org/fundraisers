# Picking colours

Read this before you add or change a colour. It keeps text readable and keeps the app in line with the Planet brand.

Brand values (hex, names, Pantone) come from the Planet styleguide in `planet-skills/branding` ([colors.md](https://github.com/Plant-for-the-Planet-org/planet-skills/blob/main/branding/colors.md), `tokens.css`). Do not copy hex values from there into components. Use the tokens in `src/app/globals.css`.

## The rule

- Text needs **4.5:1** against what is behind it.
- Large text needs **3:1**: 24px and up, or 18.66px and up when bold.
- Icons and other shapes that carry meaning (an arrow on a button, a chart bar) need **3:1**.
- Decorative bits are exempt: icons marked `aria-hidden`, separators, background shapes.
- Hover, focus and selected states count too. Check them, not just the resting state.

## Brand pairings

The Planet palette gives each colour a strong version and a pale "Soft" version for backgrounds. Pair them the way the styleguide does:

| Use | Token | Notes |
|---|---|---|
| Card or section background | `bg-planet-50` (Soft Green), `bg-soft-gold` (Soft Yellow), `bg-soft-blue` (Soft Blue), `bg-planet-100` (Mint) | Pale on purpose, so text sits on them |
| Icon tile on that card | a step darker in the same family, for example `bg-planet-100` on Soft Green | |
| Icon colour | the strong colour of the same family: `text-planet-600`, `text-amber-700`, `text-blue-700` | |
| Brand CTA, outside a fundraiser theme | `bg-planet-600` (Planet Green) with white text | 5.4:1 |

## Text colours

| Text | Use | On white | On a Soft background |
|---|---|---|---|
| Headings and body | `text-foreground` (close to CI Core Text `#333333`) | 12:1 | 10:1 and up |
| Secondary text on white or the page | `text-muted-foreground` | 4.8:1 | Fails on Mint (4.1) and Soft Blue (4.4) |
| Secondary text on a Soft or coloured background | `text-gray-600 dark:text-muted-foreground` (close to CI Soft Text `#4F4F4F`) | 7.6:1 | 6.3:1 and up |
| Disabled or placeholder only | CI Soft Text 2 `#828282`, Hint `#BDBDBD` | 3.8:1, 1.9:1 | Never for text people need to read |

## Accent colours

A fundraiser's accent is picked by the host, and every theme has one. Use these tokens, never a fixed hex:

| You want | Use | Why |
|---|---|---|
| A solid accent button or fill | `bg-accent-color` with `text-[var(--cta-foreground,#fff)]` | `--cta-foreground` is white when white reaches 4.5:1 on the accent, black otherwise (`getOnColorText`) |
| Accent text or a link on the page | `text-accent-text` | It falls back to the normal text colour when the accent is too light for the page, in light and dark mode |
| Accent text on a light accent tint (`bg-accent-color/10` or `/20`) | `text-accent-ink` | The accent darkened to 85%. The plain accent falls just short on its own tint (4.4:1 on 10%) |
| Large accent text, like a headline word or a big number | `text-accent-color` is fine | Large text needs only 3:1 |

The palette in `accent-utils.ts` uses shades dark enough for white text (mostly the 700 shade). Only yellow and lime stay bright, with black text. If you add an accent, check it gets white text, or decide on purpose that it should not.

## Don't

- Don't fade text with `opacity-*` on a coloured fill. White at 85% on amber drops from 5.0:1 to 4.1:1.
- Don't use `text-accent-color` for small text. Use `text-accent-text`, or `text-accent-ink` on a tint.
- Don't put `text-muted-foreground` on a coloured card.
- Don't add a new hex for a brand colour. If the token is missing, add it to `globals.css` with its styleguide name in a comment.

## How to check a page

Open the page, then run this in the browser console. It lists every visible text that falls below its minimum. It measures against solid background colours, so check text on photos and strong gradients by eye.

```js
(() => {
  const cx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
  const rgba = c => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return { r: d[0], g: d[1], b: d[2], a: c === 'rgba(0, 0, 0, 0)' ? 0 : d[3] / 255 }; };
  const mix = (t, b) => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
  const lum = c => [c.r, c.g, c.b].map(v => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const bgOf = el => { const layers = []; for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c.a > 0) { layers.push(c); if (c.a === 1) break; } } return layers.reduceRight((b, l) => mix(l, b), { r: 255, g: 255, b: 255, a: 1 }); };
  const fails = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) {
    const el = walk.currentNode.parentElement, text = walk.currentNode.textContent.trim();
    if (!text || !el.getClientRects().length || el.closest('[aria-hidden="true"], script, style')) continue;
    const cs = getComputedStyle(el);
    let opacity = 1; for (let n = el; n; n = n.parentElement) opacity *= +getComputedStyle(n).opacity;
    const bg = bgOf(el), fg = mix({ ...rgba(cs.color), a: rgba(cs.color).a * opacity }, bg);
    const size = parseFloat(cs.fontSize), need = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700) ? 3 : 4.5;
    const r = ratio(fg, bg);
    if (r < need) fails.push({ text: text.slice(0, 40), ratio: +r.toFixed(2), need, className: el.className });
  }
  console.table(fails);
})();
```

Run it again with each tab or toggle on the page switched, since some sections change their background. Hover states it cannot see: work those out from the classes, or hover and run it again.
