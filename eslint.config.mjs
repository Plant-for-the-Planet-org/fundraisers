import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // Import sorting
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Group 1: type imports
            [
              '^react.*\\u0000$',
              '^next.*\\u0000$', // matches next/* and next-intl (alphabetical: next < next-intl)
              '^[^@.].*\\u0000$', // other external (non-scoped)
              '^@(?!/).*\\u0000$', // scoped external (@radix-ui, etc.)
              '^@/lib/.*\\u0000$',
              '^@/stores/.*\\u0000$',
              '^@/components/.*\\u0000$',
              '.*\\u0000$', // remaining (other @/ paths, relative)
            ],
            // Group 2: value imports
            [
              '^react',
              '^next', // matches next/* and next-intl (alphabetical: next < next-intl)
              '^[^@.\\u0000]', // other external (non-scoped)
              '^@(?!/)', // scoped external
              '^@/lib/',
              '^@/stores/',
              '^@/components/',
              '^@/', // remaining internal paths (@/i18n/, @/hooks/, etc.)
              '^\\.\\.', // relative parent (../)
              '^\\./', // relative sibling (./)
            ],
            // Group 3: side-effect imports (CSS, bare imports)
            ['^\\u0000'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // Prettier rules
      'prettier/prettier': 'error',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',

      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',

      // React rules
      'react/self-closing-comp': 'error',
      'react/jsx-curly-brace-presence': [
        'error',
        { props: 'never', children: 'never' },
      ],

      // Next.js rules
      '@next/next/no-img-element': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'node_modules/**',
    'coverage/**',
    'next-env.d.ts',
    '*.tsbuildinfo',
    'locales/**/*.d.json.ts',
  ]),
]);

export default eslintConfig;
