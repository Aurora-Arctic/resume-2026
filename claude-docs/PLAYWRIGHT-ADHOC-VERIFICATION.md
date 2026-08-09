# Ad-hoc Playwright verification (outside `npm run test:e2e`)

Quick reference for driving a real headless browser against the dev/build server to eyeball a change (screenshot a layout, hover a tooltip, check a theme) — not for the `e2e/` Playwright suite itself, which `npm run test:e2e` already covers.

- There is no `chromium-cli` (or similar pre-built driver CLI) in this repo or its dev containers. Don't look for one — go straight to a small script.
- `playwright` is already a dependency (used by `test:e2e`), so import `chromium` from it directly:

  ```js
  import { chromium } from 'playwright';

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  // .hover() / .click() / .screenshot({ path, clip }) as needed
  await browser.close();
  ```

- No `playwright install` step is needed — the chromium binary ships pre-baked in the dev/test containers (see `claude-docs/DOCKER-SETUP.md`).
- **Run the script from inside the project root (`/app`), not from a scratch/temp directory outside it.** Node resolves a bare specifier like `'playwright'` relative to the _importing file's own location_, walking up its `node_modules` — not relative to the shell's working directory. A script saved outside this project tree fails with `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'` even when the shell's `cwd` is `/app`. Setting `NODE_PATH` does not fix this either — it's a CommonJS-only mechanism and has no effect on ESM resolution. Write the script into the project directory (delete it afterwards if it's throwaway), then run it with plain `node`.
