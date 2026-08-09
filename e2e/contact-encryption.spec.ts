import { test, expect } from './fixtures';

// The real key that decrypts resumeData.header's actual location/email/phone
// is deliberately never committed here (or anywhere in the repo) — see
// claude-docs/CONTACT-ENCRYPTION.md. The "hidden" cases below don't need it:
// with no key, or the wrong key, none of the three fields render at all, so
// the contact list should only ever contain the non-secret `links` entries
// (LinkedIn, resume.marwynn.net, GitHub).
//
// To also exercise the successful-decrypt path locally, set
// RESUME_CONTACT_KEY (e.g. in a gitignored .env you source yourself) to the
// real key — the third test below is registered as skipped (not run at all,
// so its fixtures/coverage collection never engage) when it isn't set, e.g.
// in CI.
const REAL_KEY = process.env.RESUME_CONTACT_KEY;

test('location/email/phone stay hidden without a ?k= key', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Marwynn Joynes' })).toBeVisible();
  await expect(page.locator('.resume-header__location')).toHaveCount(0);
  await expect(page.locator('.resume-header__contact li')).toHaveCount(0);
  await expect(page.locator('.resume-header__links li')).toHaveCount(3);
  await expect(page.locator('.resume-header__contact a[href^="mailto:"]')).toHaveCount(0);
});

test('a wrong ?k= key leaves location/email/phone hidden', async ({ page }) => {
  await page.goto('/?k=wrong-key');

  await expect(page.getByRole('heading', { level: 1, name: 'Marwynn Joynes' })).toBeVisible();
  await expect(page.locator('.resume-header__location')).toHaveCount(0);
  await expect(page.locator('.resume-header__contact li')).toHaveCount(0);
  await expect(page.locator('.resume-header__links li')).toHaveCount(3);
  await expect(page.locator('.resume-header__contact a[href^="mailto:"]')).toHaveCount(0);
});

// Registered as skipped (not run) rather than calling `test.skip()` inside a
// running test — the latter still lets the autoCoverage fixture in
// fixtures.ts start/stop JS coverage around a test whose body never
// navigates anywhere, which the coverage reporter can't make sense of. This
// form skips before any fixture engages.
(REAL_KEY ? test : test.skip)(
  'the correct ?k= key decrypts and reveals location/email/phone',
  async ({ page }) => {
    await page.goto(`/?k=${REAL_KEY}`);

    // Real PII, so assert shape rather than exact values: location renders
    // separately, email+phone in &__contact, and the three static `links`
    // entries in &__links.
    await expect(page.locator('.resume-header__location')).toBeVisible();
    await expect(page.locator('.resume-header__contact li')).toHaveCount(2);
    await expect(page.locator('.resume-header__links li')).toHaveCount(3);
    await expect(page.locator('.resume-header__contact a[href^="mailto:"]')).toBeVisible();
  },
);
