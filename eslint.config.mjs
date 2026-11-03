import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: [
      'app/privacy/page.tsx',
      'components/customer/checkout-form.tsx',
      'components/customer/tracking-live.tsx',
    ],
    // These pages contain user-facing apostrophes in JSX text; allow them without disabling other lint checks.
    rules: { 'react/no-unescaped-entities': 'off' },
  },
  { ignores: ['.next/**', 'node_modules/**', 'coverage/**'] },
];
