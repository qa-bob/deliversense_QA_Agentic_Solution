# AGENTS.md — Claude Code Agent Reference

This file documents the **Claude Code sub-agents** available in this repository. Agents are defined in `.claude/agents/` and are invoked automatically by slash commands or by Claude Code when the task matches their role.

---

## Overview

Agents are specialized AI roles that Claude Code delegates to when a task requires a narrow, well-defined capability. Each agent has:
- A specific **role** and **trigger condition**
- Defined **inputs** and **outputs**
- Step-by-step **instructions**
- **Edge case** handling for common failure modes

---

## Available Agents

### `site-analyzer`

**File:** `.claude/agents/site-analyzer.md`

**Role:** Crawl the live DeliverSense website and produce a fully-populated `site.config.json`.

**When invoked:**
- Running `/analyze-site` slash command
- Onboarding this repo to a new site URL
- Verifying `site.config.json` is still accurate after a site redesign

**What it does:**
1. Resolves the canonical URL (follows redirects)
2. Navigates with `waitUntil: 'networkidle'` to handle SPAs
3. Dismisses cookie consent banners
4. Extracts nav items, contact forms, H1/meta content
5. Infers industry from page copy
6. Outputs a valid `site.config.json` + issues checklist

**Output:** Updated `site.config.json` + an issues checklist

**Edge cases handled:**
- SPAs with deferred JS rendering (waits additional 2s)
- Auth-gated pages (sets `auth.required: true`, skips scraping)
- Redirect chains (uses final canonical URL)
- Cookie consent banners (dismisses before inspection)
- Mobile-only nav (opens hamburger before extracting links)

---

### `test-generator`

**File:** `.claude/agents/test-generator.md`

**Role:** Read `site.config.json` and generate site-specific Playwright test files for unique functionality not covered by the shared framework.

**When invoked:**
- Running `/generate-full-suite` slash command
- When the site has features (pricing calculator, video player, accordion FAQ) that need custom tests
- When generic selectors fail and site-specific locators are required
- When writing regression tests for a newly discovered bug

**What it does:**
1. Reads and parses `site.config.json`
2. Identifies gaps in the shared test suites
3. Plans test scenarios (outputs a brief list before writing)
4. Generates or updates page object classes in `src/pages/`
5. Writes spec files to `tests/custom/<scenario>.spec.ts`
6. Validates TypeScript mentally (no implicit `any`, uses async/await, no `waitForTimeout`)

**Output:** One or more `.spec.ts` files in `tests/custom/` + any new page object additions in `src/pages/`

**Conventions for generated files:**
- Named `tests/custom/<kebab-case-description>.spec.ts`
- Tagged `@custom` plus any additional relevant tags
- JSDoc comment explaining what is tested and why it's site-specific
- Imports from `@fixtures/site.fixture` (never raw `@playwright/test`)

---

## Adding a New Agent

1. Create a Markdown file at `.claude/agents/<agent-name>.md`
2. Define: **Role**, **When to invoke**, **Capabilities**, **Inputs**, **Output**, **Step-by-step instructions**, **Edge cases**
3. Add an entry to this file (AGENTS.md) with a summary
4. Reference the agent from the relevant slash command in `.claude/commands/` if applicable

---

## Agent Design Principles

- **Single responsibility** — each agent does one well-scoped thing
- **Idempotent outputs** — running an agent twice produces the same result if the site hasn't changed
- **Non-destructive** — agents never submit forms, create accounts, or write to external systems
- **Resilient selectors** — generated code uses semantic/role-based selectors, not brittle CSS class names
- **Strict TypeScript** — all generated code must pass `npx tsc --noEmit`
