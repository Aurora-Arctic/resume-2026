import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Scoped to src/ so a brand-new untested file still enters the coverage
      // map (and counts against the threshold) instead of being invisible
      // until a test happens to import it.
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['*.d.ts'],
      reporter: ['text', 'json-summary', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
});
