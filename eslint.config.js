import tseslint from 'typescript-eslint';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // ── Global ignores ──────────────────────────────────────────────────
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'tests/**'],
  },

  // ── TypeScript recommended rules ────────────────────────────────────
  ...tseslint.configs.recommended,

  // ── Project-wide settings for src/ and bin/ ─────────────────────────
  {
    files: ['src/**/*.{ts,tsx}', 'bin/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // ── React Hooks (classic two rules) ───────────────────────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── TypeScript adjustments ────────────────────────────────────
      // The codebase uses `import React from 'react'` for JSX namespace
      // access even with react-jsx transform; allow unused vars when
      // prefixed with _ or when it is the React namespace import.
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // ── Style / quality ───────────────────────────────────────────
      // console usage is intentional in a CLI tool — do not flag it.
      'no-console': 'off',
    },
  },
);
