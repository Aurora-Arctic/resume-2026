import { test, expect } from './fixtures';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('accessibility', () => {
  test('homepage has no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .disableRules([
        // Tooltip has role="tooltip" wrapping interactive children (trigger + content).
        // This is a documented site-owner decision — see claude-docs/components/TOOLTIP.md
        // and claude-docs/transcripts/components/TOOLTIP.md for the reasoning behind this pattern.
        'nested-interactive',
      ])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('print options dialog has no accessibility violations (open state)', async ({ page }) => {
    await page.goto('/');
    // Stub window.print() so the dialog can open without halting on a native OS dialog
    await page.addInitScript(() => {
      window.print = () => {}; // no-op
    });

    // Open the dialog
    await page.getByRole('button', { name: 'Choose what to print' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Scan the open dialog, scoped to the panel to avoid re-scanning the page content
    const results = await new AxeBuilder({ page })
      .include('.print-options__panel')
      .disableRules([
        // $wine-stained color contrast is ~3.86:1 (below 4.5:1 AA standard for text).
        // This is a documented exception for visual brand consistency — see
        // claude-docs/LAYOUT-SETUP.md and claude-docs/transcripts/LAYOUT-SETUP.md
        // for the full rationale. @media (prefers-contrast: more) users get higher contrast.
        'color-contrast',
      ])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
