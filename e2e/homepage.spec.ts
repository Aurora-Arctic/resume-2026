import { test, expect } from './fixtures';

test('homepage renders the resume heading', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Marwynn Joynes' })).toBeVisible();
});

test('a project with a link renders its name as an anchor', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'EDMO.com', exact: true })).toHaveAttribute(
    'href',
    'https://edmo.com',
  );
});

test('a project without a link renders its name as plain text', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 3, name: 'FHIR-Based Insurance Partner API' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'FHIR-Based Insurance Partner API' }),
  ).not.toBeVisible();
});

test('unknown route renders the Gatsby 404 page', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('the 404 page link navigates back home client-side', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');

  // A real Gatsby <Link> click, not page.goto — this is a client-side
  // route change, so the previous page's Layout/ThemeToggle actually
  // unmounts (see ThemeToggle.tsx's effect cleanup) rather than the whole
  // document reloading fresh.
  await page.getByRole('link', { name: 'Back to home' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Marwynn Joynes' })).toBeVisible();
});
