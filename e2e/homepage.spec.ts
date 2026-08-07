import { test, expect } from './fixtures';

test('homepage renders the resume heading', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Resume 2026' })).toBeVisible();
});

test('unknown route renders the Gatsby 404 page', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});
