import { defineConfig, devices } from '@playwright/test';

// Overridable so a local `act` run can pick a free port when :8000 is already
// held by a running dev server — see CI-SETUP.md's "Local CI testing with act".
// Unset in real CI, so this is 8000 there, same as before.
const port = process.env.PORT ?? '8000';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: `http://localhost:${port}`,
  },
  webServer: {
    command: 'npm run build && npm run serve',
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
