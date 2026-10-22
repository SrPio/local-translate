import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.webextensions },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['scripts/**/*.mjs', 'docs/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['docs/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    // User text must never reach logs.
    files: ['src/**/*.{ts,tsx}'],
    rules: { 'no-console': 'error' },
  },
);
