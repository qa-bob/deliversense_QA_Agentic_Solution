# SKILLS.md — Claude Code Skills & Slash Command Reference

This file documents the **slash commands** available in this repository. Commands are defined in `.claude/commands/` and are invoked in Claude Code by typing `/command-name`.

---

## Overview

Slash commands are project-specific instructions that tell Claude Code how to perform a specific, repeatable task. Each command:
- Has a defined **usage** pattern
- Describes exactly **what steps it takes**
- Specifies the **output format**
- Handles common **edge cases**

---

## Available Commands

### `/analyze-site`

**File:** `.claude/commands/analyze-site.md`

**Purpose:** Analyze the live DeliverSense website and produce a fully-populated `site.config.json`.

**Usage:**
```
/analyze-site [url]
```

If `url` is omitted, reads `site.config.json` and uses its `url` field.

**What it does:**
1. Navigates to the site (handles SPA hydration, cookie banners)
2. Extracts nav links, forms, H1, meta description, CTAs
3. Checks responsiveness at 390px viewport
4. Attempts to find the contact form at common paths (`/contact`, `/contact-us`, etc.)
5. Outputs a completed `site.config.json` block
6. Reports any issues found (missing meta description, broken nav links, no HTTPS, etc.)

**When to use:** Before generating tests; after a site redesign; when `expectedNavItems` needs updating.

---

### `/generate-full-suite`

**File:** `.claude/commands/generate-full-suite.md`

**Purpose:** Analyze the website and generate a complete POM + test suite from scratch.

**Usage:**
```
/generate-full-suite
```

**What it does:**
1. Reads `site.config.json`
2. Crawls the live site (homepage + all discoverable pages)
3. Plans and writes page object classes in `src/pages/`
4. Updates `src/fixtures/site.fixture.ts` with new page objects
5. Writes test files across all categories (`smoke`, `navigation`, `forms`, `functional`, `visual`, `responsive`)
6. Updates `site.config.json` with discovered values
7. Runs `npx tsc --noEmit` and fixes any errors
8. Reports a summary (pages analyzed, classes created, test count)

**When to use:** Initial setup of a new repo; major test suite refresh after a redesign.

---

### `/run-smoke`

**File:** `.claude/commands/run-smoke.md`

**Purpose:** Run smoke tests and display a clean pass/fail summary.

**Usage:**
```
/run-smoke
```

**What it does:**
1. Runs `npm run test:smoke`
2. Parses `test-results/results.json`
3. Displays a formatted table: test name, status (PASS/FAIL/WARN), duration
4. For failures, shows the error and a suggested fix
5. Mirrors the underlying test exit code

**Suggested fixes provided for:**
- HTTP 4xx/5xx — hosting/DNS issue
- Load time > 10s — Lighthouse audit recommended
- Console errors — points to browser DevTools
- HTTP instead of HTTPS — SSL config suggestion
- Missing meta description — SEO fix guidance

---

### `/update-baseline`

**File:** `.claude/commands/update-baseline.md`

**Purpose:** Refresh visual regression snapshot baselines after intentional UI changes.

**Usage:**
```
/update-baseline
```

**What it does:**
1. Confirms with the user that UI changes were intentional
2. Runs `npm run baseline` (`playwright test --grep @visual --update-snapshots`)
3. Commits the updated snapshots with a descriptive message
4. Reports which snapshots were updated and from which pages

**When to use:** After a design update, brand refresh, or any intentional visual change.

---

### `/generate-report`

**File:** `.claude/commands/generate-report.md`

**Purpose:** Parse test results and display a full summary report.

**Usage:**
```
/generate-report
```

**What it does:**
1. Parses `test-results/results.json`
2. Opens the HTML report (`npm run report`) if not in a headless CI environment
3. Displays a suite-level summary table (total / passed / failed / flaky per tag)
4. Lists all failed tests with error messages
5. Lists flaky tests with suggestions
6. Suggests next steps (fix broken links, investigate flaky tests, update baselines)

---

## Adding a New Skill / Slash Command

1. Create a Markdown file at `.claude/commands/<command-name>.md`
2. Define: **Purpose**, **Usage**, **What it does** (numbered steps), **Output format**, **Edge cases**
3. Add an entry to this file (SKILLS.md) with a summary
4. Reference it in `CLAUDE.md` under the **Slash Commands** table

---

## Skill Design Principles

- **Deterministic steps** — commands describe exact actions, not vague instructions
- **Output format specified** — every command defines what the output looks like
- **Edge cases handled** — what to do if the site is down, JSON missing, CI headless, etc.
- **Non-destructive** — no production changes, no form submissions, no account creation
- **Idempotent** — running a command twice doesn't cause problems
