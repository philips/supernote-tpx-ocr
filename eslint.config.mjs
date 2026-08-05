// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import globals from 'globals';

export default defineConfig(
  {
    ignores: [
      'dist/',
      'public/vendor/',
      // Vendored unmodified from upstream (see src/lib/mtp-ts/NOTICE.md) - not ours to reformat.
      'src/lib/mtp-ts/',
      '.astro/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  eslintPluginAstro.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    // Astro frontmatter is checked as TS but isn't part of the tsconfig project graph.
    files: ['**/*.astro'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
);
