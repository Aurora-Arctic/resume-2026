import { defineConfig, devices } from '@playwright/test';

// Defaults to 8001, not Gatsby's usual 8000 (`npm run develop`/`serve`), so
// this build-and-serve webServer never collides with — or, worse, silently
// reuses via reuseExistingServer below — a dev server already holding :8000,
// in real CI or locally alike. Still overridable via PORT if 8001 itself is
// ever occupied.
const port = process.env.PORT ?? '8001';

export default defineConfig({
  testDir: './e2e',
  // Coverage collection/reporting (see e2e/coverage-options.ts) only runs
  // for `npm run test:e2e:coverage` — a plain `npm run test:e2e` skips both
  // hooks entirely.
  globalSetup: process.env.E2E_COVERAGE === 'true' ? './e2e/global-setup.ts' : undefined,
  globalTeardown: process.env.E2E_COVERAGE === 'true' ? './e2e/global-teardown.ts' : undefined,
  use: {
    baseURL: `http://localhost:${port}`,
  },
  webServer: {
    command: 'npm run build && npm run serve',
    // `serve`'s own script (package.json) falls back to its own default of
    // 8000 via `${PORT:-8000}` when the env var isn't actually set — the
    // `port` constant above only controls what URL *this config* polls, so
    // without explicitly forwarding it here the spawned command would bind
    // 8000 regardless, defeating the point of defaulting `port` to 8001.
    env: { PORT: port },
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // playwright.yml's CI container runs as root (see there for why) —
        // Chromium refuses to launch as root without this. Not needed locally,
        // where the devcontainer/testing image runs as the non-root node user.
        launchOptions: process.env.CI ? { args: ['--no-sandbox'] } : {},
      },
    },
  ],
});
