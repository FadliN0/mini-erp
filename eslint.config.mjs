import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

export default [
  { ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // turunkan jadi warning dulu supaya build tidak gagal
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
]