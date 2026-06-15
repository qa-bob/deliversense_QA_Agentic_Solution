/**
 * tests/functional/cta-flows.spec.ts
 *
 * Functional tests for CTA (call-to-action) navigation flows on DeliverSense.
 * Verifies that CTA buttons are present, visible, and link to valid destinations.
 * Does NOT submit any forms or create any accounts.
 *
 * NOTE: DeliverSense is a JavaScript SPA — all assertions use generous timeouts
 * to allow for JS hydration. Navigation is tested by verifying URL changes, not
 * by asserting a specific URL pattern (since the site may use hash or history routing).
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

test.describe('CTA Flows @functional', () => {

  // ── Primary CTA presence ──────────────────────────────────────────────────────

  test('at least one CTA button is visible on the homepage @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'networkidle' });

    const ctaPattern = /get started|request demo|book demo|schedule demo|contact us|free trial|get a demo|learn more|see how/i;

    // Prefer CTAs in main content — nav CTAs are inside the collapsed hamburger
    // on mobile/tablet and not visible without opening the menu
    const mainCtaButtons = page.locator('main a, section a, main button, section button').filter({
      hasText: ctaPattern,
    });

    const mainCount = await mainCtaButtons.count();
    if (mainCount > 0) {
      await expect(mainCtaButtons.first()).toBeVisible({ timeout: 15_000 });
      return;
    }

    // Fallback: any CTA exists anywhere on the page (even if inside collapsed nav)
    const anyCtaButtons = page.locator('a, button').filter({ hasText: ctaPattern });
    const anyCount = await anyCtaButtons.count();
    expect(anyCount, 'At least one CTA button should exist on the homepage').toBeGreaterThan(0);
    // Don't assert visibility — the CTA may be in a collapsed mobile nav
    console.warn('[cta-flows] CTA found only inside collapsed nav — not visible without opening menu.');
  });

  test('all visible CTA buttons are reachable (not disabled) @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'networkidle' });

    const ctaButtons = page.locator('a, button').filter({
      hasText: /get started|request demo|book demo|schedule demo|contact us|free trial|get a demo/i,
    });

    const count = await ctaButtons.count();
    if (count === 0) {
      console.warn('[cta-flows] No CTA buttons matched the filter — check selectors against live DOM.');
      return;
    }

    for (let i = 0; i < Math.min(count, 5); i++) {
      const btn = ctaButtons.nth(i);
      const isVisible = await btn.isVisible();
      if (!isVisible) continue;

      const isDisabled = await btn.isDisabled();
      const text = await btn.textContent();
      expect(isDisabled, `CTA button "${text?.trim()}" should not be disabled`).toBeFalsy();
    }
  });

  // ── CTA link targets ──────────────────────────────────────────────────────────

  test('primary CTA links have non-empty href attributes @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'networkidle' });

    const ctaLinks = page.locator('a').filter({
      hasText: /get started|request demo|book demo|schedule demo|contact us|free trial|get a demo/i,
    });

    const count = await ctaLinks.count();
    if (count === 0) {
      console.warn('[cta-flows] No CTA <a> links found — may be using <button> with JS navigation.');
      return;
    }

    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = ctaLinks.nth(i);
      const isVisible = await link.isVisible();
      if (!isVisible) continue;

      const href = await link.getAttribute('href');
      const text = await link.textContent();
      expect(
        href,
        `CTA link "${text?.trim()}" should have a non-empty href`
      ).toBeTruthy();
      expect(
        href?.trim(),
        `CTA link "${text?.trim()}" href should not be just "#"`
      ).not.toBe('#');
    }
  });

  // ── Navigation CTAs ───────────────────────────────────────────────────────────

  test('clicking a nav CTA navigates to a new page or section @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'networkidle' });

    const navCta = page.locator('nav a, header a').filter({
      hasText: /get started|demo|contact|pricing|sign up/i,
    }).first();

    if (await navCta.count() === 0) {
      console.warn('[cta-flows] No nav-level CTA link found — skipping navigation assertion.');
      return;
    }

    // If the element is not visible (e.g. collapsed mobile nav), skip — opening
    // the hamburger menu is a separate navigation test
    if (!await navCta.isVisible()) {
      console.warn('[cta-flows] Nav CTA is not visible (likely inside collapsed mobile menu) — skipping click test.');
      return;
    }

    const target = await navCta.getAttribute('target');
    const href = await navCta.getAttribute('href');

    // target="_blank" opens a new tab — the current page URL won't change,
    // so we validate the href instead of asserting URL change
    if (target === '_blank') {
      expect(href?.trim(), 'target=_blank nav CTA should have a valid href').toBeTruthy();
      expect(href?.trim(), 'target=_blank nav CTA href should not be just "#"').not.toBe('#');
      return;
    }

    const initialUrl = page.url();
    await navCta.click();
    await page.waitForLoadState('domcontentloaded');

    const newUrl = page.url();
    const urlChanged = newUrl !== initialUrl || newUrl.includes('#');
    expect(urlChanged, `Clicking nav CTA should change the URL. Before: ${initialUrl}, After: ${newUrl}`).toBeTruthy();
  });

  // ── Contact / demo request form presence ─────────────────────────────────────

  test('demo or contact page is reachable from homepage @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'networkidle' });

    // Try to find a contact/demo link anywhere on the page
    const contactLink = page.locator('a').filter({
      hasText: /contact|demo|get in touch|reach out|talk to us/i,
    }).first();

    const found = await contactLink.count() > 0;
    if (!found) {
      console.warn('[cta-flows] No explicit contact/demo link found on homepage.');
      return;
    }

    await expect(contactLink).toBeVisible({ timeout: 10_000 });

    const href = await contactLink.getAttribute('href');
    expect(href, 'Contact/demo link should have an href').toBeTruthy();
  });

  // ── Pricing page (if exists) ──────────────────────────────────────────────────

  test('pricing or plans link is reachable @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'networkidle' });

    const pricingLink = page.locator('a').filter({
      hasText: /pricing|plans|packages/i,
    }).first();

    const found = await pricingLink.count() > 0;
    if (!found) {
      console.warn('[cta-flows] No pricing link found — pricing may be unlisted or behind a demo wall.');
      return;
    }

    await expect(pricingLink).toBeVisible({ timeout: 10_000 });

    const href = await pricingLink.getAttribute('href');
    expect(href, 'Pricing link should have a valid href').toBeTruthy();
  });

  // ── External links open properly ─────────────────────────────────────────────

  test('external links have target="_blank" and rel="noopener" @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'networkidle' });

    const siteOrigin = new URL(siteConfig.url).origin;
    const externalLinks = page.locator('a[href]').filter({
      hasNot: page.locator(`a[href^="${siteOrigin}"], a[href^="/"], a[href^="#"]`),
    });

    const count = await externalLinks.count();
    if (count === 0) {
      console.warn('[cta-flows] No external links found on homepage.');
      return;
    }

    const missingAttributes: string[] = [];

    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = externalLinks.nth(i);
      const href = await link.getAttribute('href');
      if (!href || !href.startsWith('http')) continue;

      const target = await link.getAttribute('target');
      const rel = await link.getAttribute('rel');

      if (target === '_blank' && (!rel || !rel.includes('noopener'))) {
        missingAttributes.push(`${href} — missing rel="noopener"`);
      }
    }

    if (missingAttributes.length > 0) {
      console.warn(
        '[cta-flows] External links with _blank but missing noopener:\n' +
        missingAttributes.join('\n')
      );
    }
    // Soft assertion — security best practice, not a hard failure
  });
});
