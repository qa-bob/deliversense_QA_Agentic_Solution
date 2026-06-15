# Contributing to the DeliverSense QA Suite

Thank you for contributing. This guide explains the conventions, architecture rules, and workflow for adding or updating tests in this repository.

---

## Architecture Overview

This repo uses the **Page Object Model (POM)** pattern with **Object-Oriented Programming (OOP)** principles.

### Class hierarchy

```
BasePage (src/pages/base.page.ts)
├── HomePage
├── NavigationPage
├── ContactFormPage
└── <FeaturePage>  ← add new ones here
```

`BasePage` provides shared utilities: `navigate()`, `waitForLoad()`, `takeScreenshot()`, `isResponsive()`, `checkNoConsoleErrors()`.

All pages extend `BasePage` and add their own locators and action methods.

---

## Page Object Rules

1. **One class per page or major section** in `src/pages/<name>.page.ts`
2. **Locators are `readonly Locator` properties** defined in the constructor — not inline in methods
3. **Methods represent user actions**, not assertions:
   - `clickSubmit()` — correct
   - `assertFormIsVisible()` — wrong, this belongs in the test
4. **Never put `expect()` inside a page object**
5. **Prefer semantic selectors**: `getByRole()`, `getByLabel()`, `getByText()` over `locator('.some-class')`
6. **No `page.waitForTimeout()`** — use Playwright's auto-waiting or `waitForSelector`

### Adding a new page object

```typescript
// src/pages/pricing.page.ts
import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';
import type { SiteConfig } from '@types/site-config.types';

export class PricingPage extends BasePage {
  readonly heading: Locator;
  readonly planCards: Locator;
  readonly ctaButtons: Locator;

  constructor(page: Page, config: SiteConfig) {
    super(page, config);
    this.heading = page.locator('h1').first();
    this.planCards = page.locator('[class*="plan"], [class*="pricing-card"]');
    this.ctaButtons = this.planCards.locator('a, button');
  }

  async getPlanCount(): Promise<number> {
    return this.planCards.count();
  }
}
```

Then add it to `src/fixtures/site.fixture.ts`:

```typescript
import { PricingPage } from '@pages/pricing.page';

// In the Fixtures interface:
pricingPage: PricingPage;

// In the test.extend() call:
pricingPage: async ({ page, siteConfig }, use) => {
  await use(new PricingPage(page, siteConfig));
},
```

---

## Test Writing Rules

### Imports

Always import `test` and `expect` from the custom fixture, not from `@playwright/test` directly:

```typescript
// Correct
import { test, expect } from '@fixtures/site.fixture';

// Wrong — misses siteConfig, homePage, etc.
import { test, expect } from '@playwright/test';
```

### Tagging

Every test must have at least one tag:

```typescript
test('site loads correctly @smoke', async ({ homePage }) => { ... });
```

Tags: `@smoke`, `@navigation`, `@forms`, `@functional`, `@visual`, `@responsive`, `@custom`

### SPA-friendly patterns

DeliverSense is a JavaScript SPA. Use these patterns to avoid timing issues:

```typescript
// Wait for the SPA to finish rendering before asserting
await page.goto(siteConfig.url, { waitUntil: 'networkidle' });

// Use a timeout on visibility checks to allow JS hydration
await expect(element).toBeVisible({ timeout: 15_000 });

// After navigating, wait for heading to appear before counting cards
await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
```

### What never goes in a test

- `page.waitForTimeout(n)` where `n > 500` — investigate root cause instead
- Hardcoded URL strings (`'https://deliversense.com'`) — use `siteConfig.url` or Playwright's `baseURL`
- `any` type without an explicit `// eslint-disable-next-line` comment explaining why
- `expect()` calls inside page object files
- Form `.submit()` or `click()` on submit buttons — validate fields only
- Real email addresses, passwords, or personal data

---

## Branching Strategy

```
main                          ← protected; requires PR + CI pass
├── feat/<short-description>  ← new test coverage
├── fix/<short-description>   ← broken test or selector fix
└── chore/<short-description> ← deps, config, docs
```

### Commit format

```
feat(functional): add homepage CTA flow tests
fix(navigation): update mobile menu selector after redesign
chore(deps): upgrade playwright to 1.45
```

---

## Pull Request Workflow

1. Create a branch from `main`
2. Write your code
3. Run `npm run typecheck` and `npm run lint` — fix all errors
4. Run the relevant test suite locally to confirm your tests pass
5. Open a PR — the PR template will guide the checklist
6. CI runs automatically; all checks must pass before merging
7. At least one review approval required before merge

---

## Claude Code Workflows

This repo is designed for AI-assisted development. When using Claude Code:

- Run `/analyze-site` before writing new selectors (ensures they match the live DOM)
- Run `/generate-full-suite` for a complete test suite refresh
- Run `/run-smoke` to verify the site is up before a test session
- Run `/generate-report` after a test run for a structured summary

Refer to `AGENTS.md` and `SKILLS.md` for full documentation.

---

## Questions?

Open an issue using the **Test Request** template to ask for new coverage, or the **Bug Report** template if a test is failing unexpectedly.
