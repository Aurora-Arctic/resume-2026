import { test as base, expect } from '@playwright/test';
import MCR from 'monocart-coverage-reports';
import { coverageOptions } from './coverage-options';

// One instance per worker process — mcr.add() calls across workers share
// coverageOptions.outputDir's cache dir, merged by global-teardown.ts's
// mcr.generate() call. See "Multiprocessing Support" in monocart-coverage-reports'
// README.
const mcr = MCR(coverageOptions);

export const test = base.extend<{ autoCoverage: void }>({
  autoCoverage: [
    async ({ page }, use) => {
      const collectCoverage = process.env.E2E_COVERAGE === 'true';
      if (collectCoverage) {
        await page.coverage.startJSCoverage({ resetOnNavigation: false });
      }

      await use();

      if (collectCoverage) {
        // Gatsby statically pre-renders pages, so a test's own assertions can
        // pass on the raw SSR/SSG HTML before the client bundle has actually
        // hydrated and re-executed the page component — settling here first
        // avoids under-counting function coverage for content that was
        // already visible pre-hydration.
        await page.waitForLoadState('networkidle');
        const jsCoverage = await page.coverage.stopJSCoverage();
        await mcr.add(jsCoverage);
      }
    },
    { auto: true },
  ],
});

export { expect };
