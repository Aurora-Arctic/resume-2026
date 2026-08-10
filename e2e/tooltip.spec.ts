import { test, expect } from './fixtures';

test.describe('clearable tooltip', () => {
  test.beforeEach(async ({ page }) => {
    // Start every test from a clean slate — a previous test's dismissal
    // (or theme choice) shouldn't leak across tests within the same worker.
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  const trigger = (page: import('@playwright/test').Page) =>
    page.getByRole('button', { name: 'Toggle light and dark mode for the paper' });
  const tooltip = (page: import('@playwright/test').Page) => page.locator('#theme-toggle-tooltip');

  test('corrupted (non-array) stored JSON is treated as no dismissals rather than throwing', async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.localStorage.setItem('tooltip-cleared', JSON.stringify({ not: 'an array' }));
    });
    await page.reload();

    await trigger(page).hover();
    await expect(tooltip(page)).toBeVisible();
    await expect(tooltip(page)).not.toHaveClass(/tooltip--cleared/);
  });

  test('dismissing via the × persists across a reload', async ({ page }) => {
    await trigger(page).hover();
    await expect(tooltip(page)).toBeVisible();

    await page.getByRole('button', { name: 'Dismiss tooltip' }).click();
    await expect(tooltip(page)).toBeHidden();

    await page.reload();
    await trigger(page).hover();
    // A quick hover post-reload should stay suppressed — well under the 1s
    // long-hover threshold.
    await page.waitForTimeout(300);
    await expect(tooltip(page)).toBeHidden();
  });

  test("a fresh browser context is not affected by another context's dismissal", async ({
    page,
    browser,
  }) => {
    const dismissed = await browser.newContext();
    const dismissedPage = await dismissed.newPage();
    await dismissedPage.goto('/');
    await dismissedPage
      .getByRole('button', { name: 'Toggle light and dark mode for the paper' })
      .hover();
    await dismissedPage.getByRole('button', { name: 'Dismiss tooltip' }).click();
    await dismissed.close();

    // `page` is its own isolated context per Playwright test, so it doubles
    // as the "fresh" context here instead of spinning up a third, unused one.
    await trigger(page).hover();
    await expect(tooltip(page)).toBeVisible();
  });

  test('a hover under 1s does not reshow a cleared tooltip; a hover over 1s does', async ({
    page,
  }) => {
    await trigger(page).hover();
    await page.getByRole('button', { name: 'Dismiss tooltip' }).click();
    await page.mouse.move(0, 0);
    await expect(tooltip(page)).toBeHidden();

    await trigger(page).hover();
    await page.waitForTimeout(400);
    await expect(tooltip(page)).toBeHidden();
    await page.mouse.move(0, 0);
    await expect(tooltip(page)).toBeHidden();

    await trigger(page).hover();
    await page.waitForTimeout(1300);
    await expect(tooltip(page)).toBeVisible();
  });

  test('leaving after a long-hover reshow suppresses it again, without un-clearing it', async ({
    page,
  }) => {
    await trigger(page).hover();
    await page.getByRole('button', { name: 'Dismiss tooltip' }).click();
    await page.mouse.move(0, 0);

    await trigger(page).hover();
    await page.waitForTimeout(1300);
    await expect(tooltip(page)).toBeVisible();

    await page.mouse.move(0, 0);
    await expect(tooltip(page)).toBeHidden();

    // Still cleared — a quick hover right after doesn't bring it back either.
    await trigger(page).hover();
    await page.waitForTimeout(300);
    await expect(tooltip(page)).toBeHidden();
  });

  test('moving the pointer from the trigger into the bubble does not flicker it closed', async ({
    page,
  }) => {
    // Not cleared, so this is the instant-show path — the bridge (§2b in
    // TOOLTIP.md) exists so crossing the real visual gap between trigger and
    // bubble never drops out of the CSS :hover chain along the way.
    const triggerBox = await trigger(page).boundingBox();
    const bubbleBox = await tooltip(page).boundingBox();
    if (!triggerBox || !bubbleBox) throw new Error('expected trigger/tooltip to have a layout box');

    await page.mouse.move(
      triggerBox.x + triggerBox.width / 2,
      triggerBox.y + triggerBox.height / 2,
    );
    await expect(tooltip(page)).toBeVisible();

    const steps = 12;
    for (let i = 1; i <= steps; i += 1) {
      const x =
        triggerBox.x +
        triggerBox.width / 2 +
        ((bubbleBox.x + bubbleBox.width / 2 - (triggerBox.x + triggerBox.width / 2)) * i) / steps;
      const y =
        triggerBox.y +
        triggerBox.height / 2 +
        ((bubbleBox.y + bubbleBox.height / 2 - (triggerBox.y + triggerBox.height / 2)) * i) / steps;
      await page.mouse.move(x, y);
      // eslint-disable-next-line playwright/no-conditional-in-test
      await expect(tooltip(page)).toBeVisible();
    }
  });

  test('the dismiss button is reachable and activatable via keyboard', async ({ page }) => {
    await trigger(page).focus();
    await expect(tooltip(page)).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Dismiss tooltip' })).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(tooltip(page)).toBeHidden();

    const cleared = await page.evaluate(() => window.localStorage.getItem('tooltip-cleared'));
    expect(cleared).toContain('theme-toggle-tooltip');
  });

  test('"I Need Tooltips" restores a dismissed tooltip without a reload', async ({ page }) => {
    await trigger(page).hover();
    await page.getByRole('button', { name: 'Dismiss tooltip' }).click();
    await page.mouse.move(0, 0);
    await expect(tooltip(page)).toBeHidden();

    await page.getByRole('button', { name: 'I Need Tooltips' }).click();

    await trigger(page).hover();
    await expect(tooltip(page)).toBeVisible();

    const cleared = await page.evaluate(() => window.localStorage.getItem('tooltip-cleared'));
    expect(cleared).toBeNull();
  });

  test('Escape dismisses the tooltip', async ({ page }) => {
    await trigger(page).hover();
    await expect(tooltip(page)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(tooltip(page)).toBeHidden();

    const cleared = await page.evaluate(() => window.localStorage.getItem('tooltip-cleared'));
    expect(cleared).toContain('theme-toggle-tooltip');
  });
});
