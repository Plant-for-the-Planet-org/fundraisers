import { readdirSync } from 'fs';
import { join } from 'path';

const EXCLUDED_LOCALE_FILES = ['cookie.json'];

export const localeDeclarations = readdirSync(join(__dirname, 'locales/en'))
  .filter(f => f.endsWith('.json') && !EXCLUDED_LOCALE_FILES.includes(f))
  .map(f => `./locales/en/${f}`);
