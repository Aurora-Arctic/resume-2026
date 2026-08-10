# Accessibility

## Overview

The site uses **axe-core** wired into the Playwright e2e test pipeline (`e2e/a11y.spec.ts`) to continuously validate accessibility. The audit surfaces WCAG 2.1 and WCAG 2.2 violations; a baseline run before implementation identified six findings, two of which are documented exceptions (intentional design decisions re-affirmed rather than fixed).

## Setup

- **Tooling**: `@axe-core/playwright` (v4.12.1+)
- **Tests**: `e2e/a11y.spec.ts` — two test cases (homepage + open print dialog) with scoped rule exemptions for the two documented exceptions
- **CI integration**: runs as part of `npm run test:e2e:coverage` (and thus on every PR); coverage threshold applies (80% minimum)
- **Configuration**: axe rules are disabled via `.disableRules()` in the test itself (not a global config), with comments linking to the rationale docs

## Findings and Resolutions

### ✅ Fixed (4 findings)

| Finding                                        | Location                               | Fix                                                                                   | Tests                     |
| ---------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------- |
| **#1: GitHub link has no accessible name**     | `src/components/Projects/index.tsx:28` | Added `aria-label={`View ${project.name} on GitHub`}`                                 | `Projects/index.test.tsx` |
| **#3a: `<h4>` misused for styling (Layout)**   | `src/components/Layout/index.tsx:21`   | Changed `<h4>` → `<p>` + added `print-note-heading-style` mixin                       | `Layout/index.test.tsx`   |
| **#3b: `<h4>` misused for styling (Summary)**  | `src/components/Summary/index.tsx:16`  | Changed `<h4>` → `<p>` + added `print-note-heading-style` mixin                       | `Summary/index.test.tsx`  |
| **#4: Header contact list not always mounted** | `src/components/Header/index.tsx:123`  | Removed conditional gate; always mount as empty initially. Added `aria-live="polite"` | `Header/index.test.tsx`   |

### 🔒 Documented Exceptions (2 findings, explicitly exempted via axe rules)

| Finding                                    | Location                               | Exemption                                                                     | Rationale                                                                                                                                                        |
| ------------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#2: Tooltip `role="tooltip"`**           | `src/components/Tooltip/index.tsx:179` | `nested-interactive` rule disabled in `e2e/a11y.spec.ts`                      | Documented site-owner decision in `TOOLTIP.md` — role kept as-is to match WAI-ARIA pattern. Note: Escape-to-dismiss keyboard handler added (see below).          |
| **#5: `$wine-stained` contrast (~3.86:1)** | `src/scss/_variables.scss`             | `color-contrast` rule disabled in `e2e/a11y.spec.ts` (PrintOptions scan only) | Documented exception in `LAYOUT-SETUP.md` — re-affirmed for visual brand consistency. Mitigation: `@media (prefers-contrast: more)` bumps link contrast to ≥6:1. |

### ⚠️ Partial Fix (1 finding)

| Finding                                                    | Scope                                | Resolution                                                                                                                                                                                                                                           |
| ---------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#6: Landmark structure (modal/button outside `<main>`)** | `src/components/Layout/index.tsx:17` | `PrintOptions` and `RestoreTooltips` hoisted outside `<main>` (they were siblings of `.paper-card`, now siblings of `<main>` itself). `ThemeToggle` left inside `<main>` — it's part of `.paper-card`'s CSS containing block; moving risks breakage. |

## Additional Improvements (not from the baseline audit)

- **Tooltip Escape-to-dismiss** (`src/components/Tooltip/index.tsx:119-145`): Added keyboard handler to dismiss tooltips via Escape key (wired only while shown, not cleared). Tested in `e2e/tooltip.spec.ts:163`. Aligns with PrintOptions' Escape-to-close pattern and WAI-ARIA dialog expectations.

## Running Tests

```bash
# Unit/component tests (coverage enforced)
npm run test:coverage

# E2E tests (includes a11y specs; coverage enforced)
npm run test:e2e:coverage

# Just the a11y specs
npm run test:e2e -- a11y.spec.ts

# All checks (lint, format, typecheck, vitest, playwright)
npm run pre-commit && npm run test:coverage && npm run test:e2e:coverage
```

## Related Docs

- [claude-docs/components/TOOLTIP.md](TOOLTIP.md) — Tooltip role decision and new Escape-to-dismiss handler
- [claude-docs/LAYOUT-SETUP.md](LAYOUT-SETUP.md) — `$wine-stained` contrast exception and PrintOptions/RestoreTooltips landmark move
- [claude-docs/components/HEADER.md](HEADER.md) — Always-mounted `aria-live="polite"` contact list
- [claude-docs/transcripts/ACCESSIBILITY.md](transcripts/ACCESSIBILITY.md) — Full narrative of the audit and implementation
