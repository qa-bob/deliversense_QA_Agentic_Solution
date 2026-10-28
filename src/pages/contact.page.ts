/**
 * src/pages/contact.page.ts
 *
 * ContactFormPage provides methods for inspecting and interacting with
 * contact forms.  It explicitly does NOT submit forms to avoid sending
 * spam messages to real company inboxes.
 */

import { type Locator } from '@playwright/test';
import { BasePage } from '@pages/base.page';

export interface FormFieldInfo {
  name: string;
  type: string;
  required: boolean;
}

export class ContactFormPage extends BasePage {
  // ── Form discovery ───────────────────────────────────────────────────────────

  /**
   * Find the primary contact form on the current page.
   * Returns null if no form is found.
   *
   * Strategy (in priority order):
   *  1. <form> with action containing "contact"
   *  2. <form> containing an email input
   *  3. First <form> on the page
   */
  async findContactForm(): Promise<Locator | null> {
    // Strategy 1: form whose action URL hints "contact"
    const byAction = this.page.locator('form[action*="contact" i], form[action*="message" i]');
    if (await byAction.count() > 0) return byAction.first();

    // Strategy 2: form containing an email field
    const withEmail = this.page.locator('form').filter({
      has: this.page.locator('input[type="email"], input[name*="email" i]'),
    });
    if (await withEmail.count() > 0) return withEmail.first();

    // Strategy 3: any form at all
    const anyForm = this.page.locator('form').first();
    if (await anyForm.count() > 0) return anyForm;

    return null;
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  /**
   * Navigate to the page that hosts the contact/demo form.
   * Tries common paths in order, then follows any "contact" or "demo" nav link.
   * Leaves the browser on the page where the form was found (or homepage if none).
   */
  async navigateToContactForm(): Promise<void> {
    // Strict check for homepage — requires email field to avoid false positives from
    // search boxes or newsletter forms that strategy 3 of findContactForm() can match
    const hasFormWithEmail = async () =>
      (await this.findContactForm()) !== null && (await this.hasEmailField());

    // Lenient check for dedicated contact/demo paths — any form OR scheduling embed counts
    const hasContactMechanism = async () =>
      (await this.findContactForm()) !== null || (await this.hasSchedulingEmbed());

    await this.navigate();
    if (await hasFormWithEmail()) return;

    // Wait for the load event so the Angular SPA has time to render form fields.
    // /demo/schedule first: known landing page for the Calendly embed on this site.
    const candidatePaths = ['/demo/schedule', '/demo', '/contact', '/contact-us', '/get-in-touch', '/reach-out', '/request-demo'];
    for (const p of candidatePaths) {
      try {
        await this.page.goto(this.url.replace(/\/$/, '') + p, {
          waitUntil: 'load',
          timeout: 20_000,
        });
        if (await hasContactMechanism()) return;
      } catch {
        // path doesn't exist or timed out — try next
      }
    }

    // Last resort: follow the nav CTA link directly (avoids _blank tab issues)
    await this.navigate();
    await this.waitForLoad();
    const navLink = this.page
      .locator('nav a, header a')
      .filter({ hasText: /contact|demo|get started|schedule|request/i })
      .first();
    if (await navLink.count() > 0) {
      const href = await navLink.getAttribute('href');
      if (href) {
        const resolved = new URL(href, this.url).toString();
        await this.page.goto(resolved, { waitUntil: 'load', timeout: 20_000 });
      }
    }
  }

  /**
   * Returns true if the current page embeds a third-party scheduling or contact widget
   * (Calendly, HubSpot, Typeform, etc.) inside an iframe.
   * These forms are cross-origin and cannot be inspected via Playwright.
   */
  async hasSchedulingEmbed(): Promise<boolean> {
    const embed = this.page.locator(
      'iframe[src*="calendly.com"], ' +
      'iframe[src*="hubspot.com"], ' +
      'iframe[src*="typeform.com"], ' +
      'iframe[src*="jotform.com"], ' +
      'iframe[src*="cognitoforms.com"], ' +
      'iframe[src*="forms.office.com"], ' +
      'iframe[title*="schedule" i], ' +
      'iframe[title*="booking" i], ' +
      'iframe[title*="contact form" i]'
    );
    return (await embed.count()) > 0;
  }

  // ── Field inspection ─────────────────────────────────────────────────────────

  /**
   * Return metadata about each input/textarea/select inside the contact form.
   */
  async getFormFields(): Promise<FormFieldInfo[]> {
    const form = await this.findContactForm();
    if (!form) return [];

    const inputLocator = form.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');
    const count = await inputLocator.count();
    const fields: FormFieldInfo[] = [];

    for (let i = 0; i < count; i++) {
      const el = inputLocator.nth(i);
      const name =
        (await el.getAttribute('name')) ??
        (await el.getAttribute('id')) ??
        (await el.getAttribute('placeholder')) ??
        `field-${i}`;
      const type = (await el.getAttribute('type')) ?? (await el.evaluate((node) => node.tagName.toLowerCase()));
      const required =
        (await el.getAttribute('required')) !== null ||
        (await el.getAttribute('aria-required')) === 'true';

      fields.push({ name, type, required });
    }

    return fields;
  }

  // ── Field presence helpers ───────────────────────────────────────────────────

  /** Returns true if the form contains an email input field. */
  async hasEmailField(): Promise<boolean> {
    const form = await this.findContactForm();
    if (!form) return false;
    const emailField = form.locator(
      'input[type="email"], ' +
      'input[name*="email" i], ' +
      'input[placeholder*="email" i], ' +
      'input[aria-label*="email" i], ' +
      'input[id*="email" i], ' +
      'input[formcontrolname*="email" i]'   // Angular reactive forms
    );
    if (await emailField.count() > 0) return true;

    // Also check for a <label> containing "email" paired with any input
    const emailLabel = form.locator('label').filter({ hasText: /email/i });
    return (await emailLabel.count()) > 0;
  }

  /** Returns true if the form contains a name input field. */
  async hasNameField(): Promise<boolean> {
    const form = await this.findContactForm();
    if (!form) return false;
    const nameField = form.locator(
      'input[name*="name" i], input[placeholder*="name" i], ' +
      'input[autocomplete*="name" i], input[formcontrolname*="name" i]'  // Angular reactive forms
    );
    return (await nameField.count()) > 0;
  }

  /** Returns true if the form has a submit button. */
  async hasSubmitButton(): Promise<boolean> {
    const form = await this.findContactForm();
    if (!form) return false;

    // Standard submit buttons
    const submit = form.locator('button[type="submit"], input[type="submit"]');
    if (await submit.count() > 0) return true;

    // Any button inside the form (many SPAs omit type="submit")
    const anyButton = form.locator('button');
    if (await anyButton.count() > 0) return true;

    // Angular Material / custom submit elements
    const customSubmit = form.locator('[role="button"], a[class*="btn"], a[class*="submit"]');
    if (await customSubmit.count() > 0) return true;

    return false;
  }

  // ── Form filling (without submission) ────────────────────────────────────────

  /**
   * Fill form fields with the provided key→value map.
   * Keys are matched against field name, id, and placeholder attributes.
   * Does NOT click submit.
   */
  async fillForm(data: Record<string, string>): Promise<void> {
    const form = await this.findContactForm();
    if (!form) throw new Error('[ContactFormPage] No contact form found on this page.');

    for (const [key, value] of Object.entries(data)) {
      const field = form.locator(
        `input[name="${key}"], input[id="${key}"], input[placeholder*="${key}" i], ` +
        `textarea[name="${key}"], textarea[id="${key}"], textarea[placeholder*="${key}" i]`
      ).first();

      if (await field.count() > 0) {
        await field.fill(value);
      }
    }
  }

  // ── High-level validation ────────────────────────────────────────────────────

  /**
   * Returns true if a contact form is present and appears to be functional
   * (has at minimum an email field and a submit button).
   */
  async validateFormPresence(): Promise<boolean> {
    const form = await this.findContactForm();
    if (!form) return false;

    const hasEmail = await this.hasEmailField();
    const hasSubmit = await this.hasSubmitButton();

    return hasEmail && hasSubmit;
  }
}
