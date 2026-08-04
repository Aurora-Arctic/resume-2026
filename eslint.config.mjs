// ESLint 9 flat config.
//
// Rule bundles (typescript-eslint, react, react-hooks, jsx-a11y) are scoped to
// `**/*.{ts,tsx}` via ESLint core's `defineConfig`/`extends` helpers (from
// `eslint/config`, shipped with ESLint itself since 9.9 — no extra package
// needed). Formatting is left entirely to Prettier: `eslint-config-prettier`
// is applied last to switch off any stylistic rules that would otherwise
// fight it.
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

// TypeScript/TSX sources — the whole app today, and anything under src/ or
// gatsby-*.ts going forward.
const TS_FILES = ['**/*.{ts,tsx}'];

// Root-level Gatsby config/lifecycle files that execute in Node during
// `gatsby build`/`gatsby develop` (not in the browser). gatsby-config.ts is
// the only one that exists so far; gatsby-node.ts and gatsby-ssr.ts are
// anticipated by tsconfig.json's `include` but not written yet.
const NODE_CONFIG_FILES = ['gatsby-config.ts', 'gatsby-node.ts', 'gatsby-ssr.ts'];

// Code that runs in the browser: everything under src/, plus gatsby-browser.ts
// (its APIs run client-side, unlike gatsby-ssr.ts/gatsby-node.ts which run in
// Node at build time).
const BROWSER_FILES = ['src/**/*.{ts,tsx}', 'gatsby-browser.ts'];

// Node-executed tooling config/specs — test runners, not Gatsby lifecycle
// files, so kept separate from NODE_CONFIG_FILES above.
const NODE_TOOLING_FILES = ['vitest.config.ts', 'playwright.config.ts', 'e2e/**/*.ts'];

export default defineConfig([
  globalIgnores(['public/**', '.cache/**']),

  // Plain JS/CJS/MJS files (e.g. this config file itself). No TS/React
  // tooling needed here, just sane parser defaults so config files aren't
  // left unlinted if any show up.
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },

  // Core TS + React rule bundle.
  {
    files: TS_FILES,
    extends: [
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // The automatic JSX runtime (react.configs.flat["jsx-runtime"]) means
      // `React` is never referenced directly, but files still import it for
      // TypeScript's sake — exempt that one identifier from no-unused-vars
      // rather than flagging every file that does this.
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^React$' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Node globals for build-time Gatsby config/lifecycle files.
  {
    files: NODE_CONFIG_FILES,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Browser globals for app source and client-side Gatsby APIs.
  {
    files: BROWSER_FILES,
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Node globals for test-tooling config files and Playwright specs (these
  // run under Node driving an external browser, not in the browser itself).
  {
    files: NODE_TOOLING_FILES,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Must stay last: turns off stylistic rules that would conflict with
  // Prettier (which formats via its own separate `format`/`format:check`
  // scripts, not through ESLint).
  eslintConfigPrettier,
]);
