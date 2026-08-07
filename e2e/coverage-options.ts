import type { CoverageReportOptions } from 'monocart-coverage-reports';

export const coverageOptions: CoverageReportOptions = {
  name: 'Playwright E2E Coverage',
  outputDir: './coverage-e2e',
  // 'v8' deliberately omitted: monocart's returned CoverageResults/summary
  // (used e.g. by an onEnd hook) always reflects the *input* data type, which
  // is always raw/unmapped V8 here (Playwright's page.coverage produces V8-format
  // data) — regardless of which reports are requested. That raw view includes
  // the webpack runtime and bundled framework code, not just our own src/, so
  // threshold enforcement in global-teardown.ts reads coverage-summary.json
  // (the sourceFilter-scoped, sourcemap-remapped report below) instead.
  reports: ['json-summary', 'html', 'lcovonly', 'text'],
  // Real bundle chunks all end in .js — this drops tiny inline <script>
  // snippets Gatsby embeds directly in the HTML (e.g. the webpack compilation
  // hash), which have no sourcemap to unpack and would otherwise bypass
  // sourceFilter below entirely, showing up as their own phantom "file" keyed
  // by the page URL itself.
  entryFilter: '**/*.js',
  // `sourceFilter` runs after sourcemap unpacking, against original file
  // paths — this is what scopes coverage down to our own src/ code, mirroring
  // vitest.config.ts's `coverage.include`. Our own code and framework code
  // both live in the same bundle files, so entryFilter above can't do this
  // scoping itself.
  sourceFilter: {
    '**/node_modules/**': false,
    '**/webpack/**': false,
    '**/.cache/**': false,
    '**/src/**': true,
    '**/**': false,
  },
};
