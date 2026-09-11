#!/usr/bin/env node
// Re-encode raster images in public/ so they ship small.
//
// Run it once on each image you add, before committing it. There is no build step doing this for you.
//
//   node scripts/optimize-images.mjs public/theme-backgrounds/new-photo.jpg
//   node scripts/optimize-images.mjs --dry-run public/theme-backgrounds
//
// Pass files or folders. A folder is scanned one level deep for .jpg/.jpeg/.png.
// Each image is capped at MAX_EDGE and re-encoded as mozjpeg at QUALITY.
// A file is only overwritten when the result is at least MIN_SAVING smaller, so re-running on
// an already-optimized image leaves it alone instead of degrading it another generation.

import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import sharp from 'sharp';

const QUALITY = 82; // plenty for decorative backgrounds, which render tinted and semi-transparent
const MAX_EDGE = 1440; // matches the existing theme-background assets
const MIN_SAVING = 0.05;
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const targets = args.filter(a => !a.startsWith('--'));

if (targets.length === 0) {
  console.error(
    'Usage: node scripts/optimize-images.mjs [--dry-run] <file|folder>...'
  );
  process.exit(1);
}

function collect(target) {
  if (!statSync(target).isDirectory()) return [target];
  return readdirSync(target)
    .filter(name => EXTENSIONS.has(extname(name).toLowerCase()))
    .map(name => join(target, name));
}

const files = targets.flatMap(collect).sort();
const kb = bytes => `${Math.round(bytes / 1024)} KB`;

let totalBefore = 0;
let totalAfter = 0;
let written = 0;

for (const file of files) {
  const before = statSync(file).size;
  // Keep the file's own format so the bytes still match the extension the app references.
  const isPng = extname(file).toLowerCase() === '.png';
  const resized = sharp(file).resize({
    width: MAX_EDGE,
    height: MAX_EDGE,
    fit: 'inside',
    withoutEnlargement: true,
  });
  const buffer = await (
    isPng
      ? resized.png({ compressionLevel: 9, palette: true })
      : resized.jpeg({
          quality: QUALITY,
          mozjpeg: true,
          chromaSubsampling: '4:2:0',
        })
  ).toBuffer();

  const saving = (before - buffer.length) / before;
  totalBefore += before;

  if (saving < MIN_SAVING) {
    totalAfter += before;
    console.log(`skip  ${file} — already ${kb(before)}`);
    continue;
  }

  totalAfter += buffer.length;
  written += 1;
  if (!dryRun) writeFileSync(file, buffer);
  console.log(
    `${dryRun ? 'would' : 'write'} ${file} — ${kb(before)} → ${kb(buffer.length)} (-${Math.round(saving * 100)}%)`
  );
}

console.log(
  `\n${written}/${files.length} image(s) ${dryRun ? 'would change' : 'rewritten'}: ${kb(totalBefore)} → ${kb(totalAfter)}`
);
