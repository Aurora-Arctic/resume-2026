import { test, expect } from './fixtures';

// The real window.print() opens a native OS dialog that would hang a
// headless run — stubbed here (before any page script runs) so PrintOptions'
// own call to it is observable without ever triggering that dialog.
test.describe('print options', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __printCalls: number }).__printCalls = 0;
      window.print = () => {
        (window as unknown as { __printCalls: number }).__printCalls += 1;
      };
    });
    await page.goto('/');
  });

  const trigger = (page: import('@playwright/test').Page) =>
    page.getByRole('button', { name: 'Choose what to print' });
  const dialog = (page: import('@playwright/test').Page) => page.getByRole('dialog');
  const backdrop = (page: import('@playwright/test').Page) =>
    page.locator('.print-options__backdrop');
  // Role-name matching is a case-insensitive substring by default — "Print"
  // alone also matches "Choose what to print" and "Close print options", so
  // the confirm button needs an exact match. Each tier's radio also carries
  // a description in the same <label> (e.g. "Full" + "All contents."), which
  // becomes part of its accessible name. Anchoring the regex to the start of
  // the name is exact enough to disambiguate without hardcoding each tier's
  // full label+description text.
  const printButton = (page: import('@playwright/test').Page) =>
    page.getByRole('button', { name: 'Print', exact: true });
  const tierRadio = (page: import('@playwright/test').Page, label: string) =>
    page.getByRole('radio', { name: new RegExp(`^${label}`) });
  const printCalls = (page: import('@playwright/test').Page) =>
    page.evaluate(() => (window as unknown as { __printCalls: number }).__printCalls);

  test('clicking the trigger opens the modal', async ({ page }) => {
    await trigger(page).click();

    await expect(dialog(page)).toBeVisible();
  });

  test('Ctrl+P opens the modal instead of the native print dialog', async ({ page }) => {
    // Ctrl+P is a browser/OS-reserved shortcut — Playwright's synthetic
    // page.keyboard.press('Control+p') doesn't reliably reach the page's own
    // keydown listener the way a real user's keypress does (this is exactly
    // the "menu-triggered print bypasses the modal" limitation noted in
    // claude-docs/components/PRINT-OPTIONS.md, just surfacing for the
    // keyboard path too under automation). Dispatching the same event
    // PrintOptions listens for directly exercises its own handler instead;
    // real end-to-end shortcut behavior is confirmed manually per that doc.
    // The dispatch below also needs Gatsby's client bundle to have actually
    // hydrated first — unlike a Playwright locator action (e.g. .click()),
    // page.evaluate has no built-in actionability wait, so a dispatch fired
    // before PrintOptions' own useEffect has attached its keydown listener
    // is simply missed (a one-shot DOM event, never queued for a later
    // listener). Waiting on the trigger button — inert markup until
    // hydrated, same component — stands in for "hydration is done".
    await expect(trigger(page)).toBeVisible();
    await page.evaluate(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, cancelable: true }),
      );
    });

    await expect(dialog(page)).toBeVisible();
    expect(await printCalls(page)).toBe(0);
  });

  test('Escape closes the modal without printing', async ({ page }) => {
    await trigger(page).click();

    await page.keyboard.press('Escape');

    await expect(dialog(page)).toBeHidden();
    expect(await printCalls(page)).toBe(0);
  });

  test('clicking the backdrop closes the modal without printing', async ({ page }) => {
    await trigger(page).click();
    // The panel occupies the center of the backdrop — click near a corner
    // (via a locator, not raw page coordinates, so Playwright waits for the
    // backdrop to actually be visible/stable first) so the click lands on
    // the backdrop itself, not the panel.
    await backdrop(page).click({ position: { x: 5, y: 5 } });

    await expect(dialog(page)).toBeHidden();
    expect(await printCalls(page)).toBe(0);
  });

  test('selecting a tier and confirming prints and stamps data-print-mode', async ({ page }) => {
    await trigger(page).click();
    await tierRadio(page, 'Minimal').click();
    await printButton(page).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('html')).toHaveAttribute('data-print-mode', 'minimal');
    expect(await printCalls(page)).toBe(1);
  });

  test('confirming without changing the selection prints the full-detail tier', async ({
    page,
  }) => {
    await trigger(page).click();

    await expect(tierRadio(page, 'Full')).toBeChecked();

    await printButton(page).click();

    await expect(page.locator('html')).toHaveAttribute('data-print-mode', 'full');
  });

  test('choosing a print tier has no visible effect on the on-screen layout', async ({ page }) => {
    const before = await page.locator('.resume').boundingBox();

    await trigger(page).click();
    await tierRadio(page, 'Minimal').click();
    await printButton(page).click();

    const after = await page.locator('.resume').boundingBox();
    expect(after).toEqual(before);
  });

  test('focus returns to the trigger button after the modal closes', async ({ page }) => {
    await trigger(page).click();

    await page.keyboard.press('Escape');

    await expect(trigger(page)).toBeFocused();
  });

  // Real prints evaluate @media (min-width: ...) against the physical page's
  // width (Letter/A4, ~816px before margins), not the screen viewport — so a
  // wide 1280px viewport would pass this test even if the desktop grid rule
  // were the *only* thing producing it, silently masking a real-print
  // regression. Using a viewport below $breakpoint-desktop (1024px) here
  // instead proves the grid comes from the print-specific
  // grid-print-tiers rule (src/scss/_print.scss), not the desktop breakpoint.
  const NARROW_PRINT_VIEWPORT = { width: 800, height: 900 };

  for (const mode of ['full', 'summary', 'minimal']) {
    test(`${mode} detail prints Experience/Projects and Skills using the desktop grid layout even at a narrow (sub-desktop-breakpoint) viewport, same as the web version`, async ({
      page,
    }) => {
      await page.setViewportSize(NARROW_PRINT_VIEWPORT);
      await page.evaluate((m) => document.documentElement.setAttribute('data-print-mode', m), mode);
      await page.emulateMedia({ media: 'print' });

      // .resume itself is a plain top-to-bottom stack at every breakpoint
      // (including print) — only the Experience/Projects pairing and the
      // Skills groups still switch to a grid for these tiers.
      await expect(page.locator('.resume')).toHaveCSS('display', 'flex');
      await expect(page.locator('.resume-experience-projects')).toHaveCSS('display', 'grid');
      await expect(page.locator('.resume-skills__groups')).toHaveCSS('display', 'grid');
    });
  }

  test('application detail collapses to a single column regardless of viewport width', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() =>
      document.documentElement.setAttribute('data-print-mode', 'application'),
    );
    await page.emulateMedia({ media: 'print' });

    await expect(page.locator('.resume')).toHaveCSS('display', 'flex');
    await expect(page.locator('.resume-experience-projects')).toHaveCSS('display', 'block');
    await expect(page.locator('.resume-skills__groups')).toHaveCSS('display', 'block');
  });
});
