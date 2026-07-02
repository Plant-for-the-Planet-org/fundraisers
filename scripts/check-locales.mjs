// Locale-namespace parity check (the build-side guard for the i18n loader).
// The loader in src/i18n/request.ts loads each namespace per locale and now skips a missing file at runtime instead of crashing.
// This script fails the build early if a namespace JSON exists for one locale but not another, so a forgotten translation file is caught before it ships.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LOCALES_DIR = 'locales';

function namespacesFor(locale) {
  return new Set(
    readdirSync(join(LOCALES_DIR, locale))
      .filter(file => file.endsWith('.json'))
      .map(file => file.slice(0, -'.json'.length))
  );
}

const locales = readdirSync(LOCALES_DIR).filter(name =>
  statSync(join(LOCALES_DIR, name)).isDirectory()
);

if (locales.length === 0) {
  console.error(`[locales] no locale directories found in ${LOCALES_DIR}/`);
  process.exit(1);
}

const perLocale = new Map(
  locales.map(locale => [locale, namespacesFor(locale)])
);
const allNamespaces = new Set([...perLocale.values()].flatMap(set => [...set]));

let hasGap = false;
for (const [locale, namespaces] of perLocale) {
  const missing = [...allNamespaces].filter(ns => !namespaces.has(ns)).sort();
  if (missing.length > 0) {
    hasGap = true;
    console.error(`[locales] ${locale} is missing: ${missing.join(', ')}`);
  }
}

if (hasGap) {
  console.error(
    '[locales] namespaces are out of parity. Every namespace needs a JSON file in every locale.'
  );
  process.exit(1);
}
