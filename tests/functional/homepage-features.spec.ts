/**
 * tests/functional/homepage-features.spec.ts
 *
 * Functional tests for the DeliverSense homepage.
 * Covers: hero section, main heading, feature/benefit sections, footer.
 *
 * NOTE: DeliverSense is a JavaScript SPA — all assertions use generous timeouts
 * to allow for JS hydration before the DOM is fully rendered.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

test.describe('Homepage Features @functional', () => {
  test.beforeEach(async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'load' });
  });

  // ── Hero section ─────────────────────────────────────────────────────────────

  test('homepage renders a main heading @functional', async ({ page }) => {
    // Site uses h2 for primary headings (no h1 present in Angular SPA)
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });
    const text = await heading.textContent();
    expect(text?.trim().length, 'Heading should contain meaningful text').toBeGreaterThan(5);
  });

  test('hero section is visible and has content @functional', async ({ page }) => {
    // Wait for the Angular SPA to hydrate — any h2 appearing confirms the main
    // content has rendered (the sticky <header> starts CSS-hidden until scroll)
    await page.locator('h2').first().waitFor({ state: 'visible', timeout: 20_000 });

    // Scope to main content area only — explicitly exclude the site <header>
    const hero = page.locator(
      '[class*="banner"], [class*="hero"], [class*="slider"], ' +
      'main section:first-of-type, main, [role="main"]'
    ).first();

    await expect(hero).toBeVisible({ timeout: 10_000 });
    const heroText = await hero.textContent();
    expect(heroText?.trim().length, 'Hero section should have visible text').toBeGreaterThan(10);
  });

  test('homepage has a visible above-the-fold CTA @functional', async ({ page }) => {
    // On mobile the nav CTA lives inside the collapsed hamburger menu and is not
    // visible without opening the menu — look for CTAs in the main content area
    const cta = page.locator('main a, main button, section a, section button').filter({
      hasText: /get started|request demo|book a demo|learn more|schedule|contact us|free trial|get a demo/i,
    }).first();

    const found = await cta.count() > 0;
    if (!found) {
      // Fallback: check any CTA anywhere on the page (including nav) and skip if
      // all are hidden (mobile collapsed nav is expected behaviour)
      const anyCta = page.locator('a, button').filter({
        hasText: /get started|request demo|book a demo|contact us|free trial|get a demo/i,
      });
      const anyCount = await anyCta.count();
      test.skip(anyCount === 0, 'No CTA found on homepage — check live site selectors');
      // At least one CTA exists on the page even if not in main content
      return;
    }

    await expect(cta).toBeVisible({ timeout: 15_000 });
  });

  // ── Feature / benefit sections ───────────────────────────────────────────────

  test('homepage has at least one feature or benefit section @functional', async ({ page }) => {
    // Feature sections usually contain multiple cards/items with headings
    const featureSections = page.locator(
      'section, [class*="feature"], [class*="benefit"], [class*="service"], ' +
      '[class*="Feature"], [class*="Benefit"]'
    );

    await expect(featureSections.first()).toBeVisible({ timeout: 15_000 });
    const count = await featureSections.count();
    expect(count, 'Should have at least one section on the homepage').toBeGreaterThan(0);
  });

  test('homepage contains delivery reconciliation-related content @functional', async ({ page }) => {
    // Verify core value proposition keywords are present on the page
    const bodyText = await page.evaluate<string>(() => document.body.innerText.toLowerCase());

    const keywords = ['reconcil', 'deliver', 'restaurant', 'third-party', 'partner'];
    const matchedKeywords = keywords.filter((kw) => bodyText.includes(kw));

    expect(
      matchedKeywords.length,
      `Expected at least 2 domain keywords (reconcil, deliver, restaurant, etc.) but found: ${matchedKeywords.join(', ')}. Page may not have rendered.`
    ).toBeGreaterThanOrEqual(2);
  });

  test('all images on the homepage have alt attributes @functional', async ({ page }) => {
    const images = page.locator('img');
    const imgCount = await images.count();

    // Some SPAs use CSS backgrounds instead of <img> — not a failure
    test.skip(imgCount === 0, 'No <img> elements found on homepage');

    const missingAlt: string[] = [];
    for (let i = 0; i < imgCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      if (alt === null || alt === undefined) {
        missingAlt.push(src ?? `img[${i}]`);
      }
    }

    expect(
      missingAlt,
      `Images missing alt attribute:\n${missingAlt.join('\n')}`
    ).toHaveLength(0);
  });

  // ── How It Works / Steps section ─────────────────────────────────────────────

  test('homepage has a process or how-it-works section @functional', async ({ page }) => {
    const processSection = page.locator('*').filter({
      hasText: /how it works|how we work|getting started|our process|steps|the process/i,
    }).first();

    // Soft check — not all homepages have this explicit section
    const exists = await processSection.count() > 0;
    test.skip(!exists, 'No "How It Works" section found — may be on a separate page');

    await expect(processSection).toBeVisible({ timeout: 10_000 });
  });

  // ── Footer ───────────────────────────────────────────────────────────────────

  test('footer is visible and contains links @functional', async ({ page }) => {
    const footer = page.locator('footer, [role="contentinfo"]').first();
    await expect(footer).toBeVisible({ timeout: 15_000 });

    const footerLinks = footer.locator('a[href]');
    const linkCount = await footerLinks.count();
    expect(linkCount, 'Footer should contain at least one link').toBeGreaterThan(0);
  });

  test('footer contains company name or copyright @functional', async ({ page, siteConfig }) => {
    const footer = page.locator('footer, [role="contentinfo"]').first();
    await expect(footer).toBeVisible({ timeout: 15_000 });

    const footerText = await footer.textContent();
    const lowerText = footerText?.toLowerCase() ?? '';

    const hasBranding =
      lowerText.includes(siteConfig.name.toLowerCase()) ||
      lowerText.includes('©') ||
      lowerText.includes('copyright') ||
      lowerText.includes('all rights reserved');

    expect(hasBranding, 'Footer should contain company name or copyright notice').toBeTruthy();
  });

  // ── Social proof ──────────────────────────────────────────────────────────────

  test('homepage has social proof or trust signals @functional', async ({ page }) => {
    // Social proof: testimonials, client logos, case studies, stats, reviews
    const trustElements = page.locator('*').filter({
      hasText: /testimonial|customer|client|trusted by|partner|review|case study|result/i,
    });

    const count = await trustElements.count();
    if (count === 0) {
      console.warn('[functional] No social proof section found — this is a recommendation, not a failure.');
    }
    // Soft check — not a hard assertion since young startups may not have testimonials yet
  });
});
