// Runs ESLint auto-fix for import sorting only.
// Uses the project eslint.config.mjs but disables all other auto-fixable rules.
import { ESLint } from 'eslint';

const eslint = new ESLint({
  fix: true,
  overrideConfig: [
    {
      rules: {
        'prettier/prettier': 0,
        'react/self-closing-comp': 0,
        'react/jsx-curly-brace-presence': 0,
        'prefer-const': 0,
        'no-var': 0,
      },
    },
  ],
});

const results = await eslint.lintFiles(['src/**/*.{ts,tsx}']);
await ESLint.outputFixes(results);

const fixedFiles = results.filter(r => r.output !== undefined).length;
console.log(
  fixedFiles > 0
    ? `Sorted imports in ${fixedFiles} file${fixedFiles > 1 ? 's' : ''}.`
    : 'All imports already sorted.'
);
