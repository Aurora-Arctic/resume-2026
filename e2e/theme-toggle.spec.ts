import { test, expect } from '@playwright/test';

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
    const darkBackgroundImage = await card.evaluate((el) => getComputedStyle(el).backgroundImage);

    const toggle = page.getByRole('button', { name: 'Toggle light and dark mode for the paper' });
    await toggle.click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    // The pattern PNGs are small enough that Gatsby's production build inlines
    // them as base64 data URIs, so asserting on a filename in the computed
    // background-image doesn't hold there — compare against the dark-mode
    // value instead, which is resilient to whether the build inlines or not.
    await expect
      .poll(() => card.evaluate((el) => getComputedStyle(el).backgroundImage))
      .not.toBe(darkBackgroundImage);

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test("a fresh browser context is not affected by another context's stored choice", async ({
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

    const fresh = await browser.newContext();
    const freshPage = await fresh.newPage();
    await freshPage.emulateMedia({ colorScheme: 'dark' });
    await freshPage.goto('/');
    await expect(freshPage.locator('html')).not.toHaveAttribute('data-theme', 'light');
    await fresh.close();
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
    // comes from html/body, same as before this feature (see LAYOUT-SETUP.md).
    await expect(page.locator('.paper-card')).toHaveCSS('background-image', 'none');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.locator('.theme-toggle')).toBeHidden();
  });
});
