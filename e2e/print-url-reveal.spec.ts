import { test, expect } from './fixtures';

// Real prints don't render pseudo-element content directly onto the
// accessibility/DOM tree, so these assertions read the CSS content value via
// getComputedStyle rather than looking for visible text — that's the only
// way to observe a ::after rule's `content: attr(href)` output.
//
// mailto:/tel: only render once the ?k= key decrypts contact.email/.phone
// (see Header/index.tsx) — the real key is deliberately never committed
// (see claude-docs/CONTACT-ENCRYPTION.md), so that case is gated the same
// way e2e/contact-encryption.spec.ts gates its own decrypt test: skipped
// (not run) unless RESUME_CONTACT_KEY is set locally.
const REAL_KEY = process.env.RESUME_CONTACT_KEY;

test.describe('print URL reveal', () => {
  test('a regular link reveals its href via ::after in print, but not on screen', async ({
    page,
  }) => {
    await page.goto('/');
    const link = page.locator('.resume-header__links a').first();
    const href = await link.getAttribute('href');

    const screenContent = await link.evaluate(
      (el) => window.getComputedStyle(el, '::after').content,
    );
    expect(screenContent).toBe('none');

    await page.emulateMedia({ media: 'print' });
    const printContent = await link.evaluate(
      (el) => window.getComputedStyle(el, '::after').content,
    );
    expect(printContent).toBe(`"${href}"`);
  });

  (REAL_KEY ? test : test.skip)(
    'mailto: and tel: links do not reveal a URL in print',
    async ({ page }) => {
      await page.goto(`/?k=${REAL_KEY}`);

      await page.emulateMedia({ media: 'print' });

      const mailtoContent = await page
        .locator('.resume-header__contact a[href^="mailto:"]')
        .evaluate((el) => window.getComputedStyle(el, '::after').content);
      expect(mailtoContent).toBe('none');

      const telContent = await page
        .locator('.resume-header__contact a[href^="tel:"]')
        .evaluate((el) => window.getComputedStyle(el, '::after').content);
      expect(telContent).toBe('none');
    },
  );

  test('the background credit link stays hidden in print', async ({ page }) => {
    await page.goto('/');

    await page.emulateMedia({ media: 'print' });

    await expect(page.locator('.background-credit')).toBeHidden();
  });
});
