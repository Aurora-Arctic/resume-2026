import { test, expect } from './fixtures';

test.describe('paper theme toggle', () => {
  test('defaults to dark when the OS prefers dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'light');
  });

  test('defaults to light when the OS prefers light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('clicking the toggle flips the card look and persists across reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    const card = page.locator('.paper-card');
    const darkOverlayOpacity = await card.evaluate((el) => getComputedStyle(el, '::after').opacity);

    const toggle = page.getByRole('button', { name: 'Toggle light and dark mode for the paper' });
    await toggle.click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    // .paper-card's own background-image never changes — the light-mode
    // pattern crossfades in via a ::after overlay instead (background-image
    // can't itself transition), so assert on that overlay's opacity.
    await expect
      .poll(() => card.evaluate((el) => getComputedStyle(el, '::after').opacity))
      .not.toBe(darkOverlayOpacity);

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await toggle.click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'light');
  });

  test("a fresh browser context is not affected by another context's stored choice", async ({
    page,
    browser,
  }) => {
    const overridden = await browser.newContext();
    const overriddenPage = await overridden.newPage();
    await overriddenPage.emulateMedia({ colorScheme: 'dark' });
    await overriddenPage.goto('/');
    await overriddenPage
      .getByRole('button', { name: 'Toggle light and dark mode for the paper' })
      .click();
    await expect(overriddenPage.locator('html')).toHaveAttribute('data-theme', 'light');
    await overridden.close();

    // `page` is its own isolated context per Playwright test, so it doubles as
    // the "fresh" context here instead of spinning up a third, unused one.
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'light');
  });

  test('print output stays plain and light regardless of the active screen theme', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle light and dark mode for the paper' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.emulateMedia({ media: 'print' });

    // .paper-card itself goes transparent in print — the white page background
    // comes from html/body, same as before this feature (see claude-docs/LAYOUT-SETUP.md).
    await expect(page.locator('.paper-card')).toHaveCSS('background-image', 'none');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.locator('.theme-toggle')).toBeHidden();
  });
});
