# DeliverSense — QA Agentic Solution

Automated regression test suite for [DeliverSense](https://deliversense.com) — a B2B SaaS platform that automates third-party delivery partner reconciliation for restaurants.

Built with **Playwright + TypeScript** using the **Page Object Model (POM)** design pattern and **Object-Oriented Programming (OOP)** principles. Orchestrated by **Claude Code** for AI-assisted test generation and maintenance.

---

## Table of Contents

- [Project Purpose](#project-purpose)
- [Tech Stack](#tech-stack)
- [Development Environment Setup](#development-environment-setup)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Architecture: POM + OOP](#architecture-pom--oop)
- [Test Categories](#test-categories)
- [Claude Code: Agents, Skills & Commands](#claude-code-agents-skills--commands)
- [GitHub Repository Structure](#github-repository-structure)
- [Contributor Rules](#contributor-rules)

---

## Project Purpose

This repository contains a full GUI, functional, and regression test suite that validates every discoverable feature of the [DeliverSense](https://deliversense.com) website.

**What we test:**
- Site availability and performance (smoke)
- Navigation, routing, and menus
- Contact/demo request forms (field validation only — no submissions)
- Core product features: hero, CTA flows, feature sections, how-it-works
- Responsive layouts across desktop, tablet, and mobile viewports
- Visual regression baselines

**What we never do:**
- Submit any form
- Create user accounts or sign in
- Hardcode URLs or selectors as magic strings
- Use `page.waitForTimeout()` — Playwright's auto-waiting handles timing

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| [Playwright](https://playwright.dev/) | ^1.44 | Browser automation across Chromium, Firefox, WebKit |
| TypeScript | ^5.4 | Strict-mode typed test code |
| Node.js | >=18 | Runtime |
| ESLint + `@typescript-eslint` | ^8 / ^7 | Linting |
| Claude Code | Latest | AI-assisted test generation and maintenance |
| GitHub Actions | — | CI/CD pipeline |

---

## Development Environment Setup

### Prerequisites

- **Node.js 18+** — [download](https://nodejs.org/)
- **Git** — [download](https://git-scm.com/)
- **Claude Code CLI** (optional, for AI-assisted workflows) — `npm install -g @anthropic-ai/claude-code`

### 1. Clone the repository

```bash
git clone https://github.com/<org>/deliversense_QA_Agentic_Solution.git
cd deliversense_QA_Agentic_Solution
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install Playwright browsers

```bash
npx playwright install --with-deps
```

### 4. Configure the target site

Open `site.config.json` and verify the `url` field points to the correct environment:

```json
{
  "name": "DeliverSense",
  "url": "https://deliversense.com",
  "hasContactForm": true,
  "viewports": ["desktop", "mobile", "tablet"]
}
```

To run against a staging environment, either edit the file or override via env var:

```bash
SITE_URL=https://staging.deliversense.com npm test
```

### 5. Verify your setup

```bash
npm run typecheck   # TypeScript must compile cleanly
npm run lint        # ESLint must pass
npm run test:smoke  # Should pass if the site is reachable
```

---

## Running Tests

```bash
# All tests
npm test

# By category (tag-filtered)
npm run test:smoke        # @smoke — fast availability checks
npm run test:navigation   # @navigation — nav links and routing
npm run test:forms        # @forms — form field validation
npm run test:visual       # @visual — screenshot regression
npm run test:responsive   # @responsive — viewport layout

# Headed mode (watch the browser)
npm run test:headed

# Open HTML report after a run
npm run report

# Refresh visual baselines (after intentional UI changes)
npm run baseline
```

### Running a single file

```bash
npx playwright test tests/functional/homepage-features.spec.ts
```

### Running a specific project (browser/viewport)

```bash
npx playwright test --project=chromium-desktop
npx playwright test --project=mobile-chrome
npx playwright test --project=tablet
```

---

## Project Structure

```
deliversense_QA_Agentic_Solution/
├── site.config.json              # Target site URL + feature flags
├── playwright.config.ts          # Playwright projects: desktop, mobile, tablet
├── global-setup.ts               # Pre-run reachability check
├── tsconfig.json                 # Strict TypeScript config
│
├── src/
│   ├── pages/                    # Page Object Model classes
│   │   ├── base.page.ts          # BasePage — shared helpers (navigate, screenshot, etc.)
│   │   ├── home.page.ts          # HomePage — hero, CTAs, headings
│   │   ├── navigation.page.ts    # NavigationPage — nav links, mobile menu
│   │   ├── contact.page.ts       # ContactFormPage — form fields, validation
│   │   └── <feature>.page.ts     # One class per additional page/section
│   ├── fixtures/
│   │   └── site.fixture.ts       # Custom test fixtures exposing page objects
│   ├── utils/
│   │   ├── link-checker.ts       # HTTP link status checker
│   │   └── visual-helper.ts      # Screenshot comparison helpers
│   └── types/
│       └── site-config.types.ts  # TypeScript interface for site.config.json
│
├── tests/
│   ├── smoke/
│   │   └── site-availability.spec.ts    # @smoke — site up, HTTPS, title, perf
│   ├── navigation/
│   │   └── nav-links.spec.ts            # @navigation — links, mobile menu, logo
│   ├── forms/
│   │   └── contact-form.spec.ts         # @forms — field validation only
│   ├── functional/
│   │   ├── homepage-features.spec.ts    # @functional — hero, features, CTAs
│   │   └── cta-flows.spec.ts            # @functional — CTA navigation flows
│   ├── visual/
│   │   └── visual-regression.spec.ts   # @visual — screenshot baselines
│   └── responsive/
│       └── layout.spec.ts              # @responsive — viewport layouts
│
├── .claude/
│   ├── commands/                 # Slash commands for Claude Code
│   ├── agents/                   # Sub-agent definitions
│   └── hooks/                    # Pre/post-test hooks
│
├── .github/
│   ├── workflows/                # GitHub Actions CI pipelines
│   ├── ISSUE_TEMPLATE/           # Bug report and test request templates
│   ├── PULL_REQUEST_TEMPLATE.md  # PR checklist
│   └── CONTRIBUTING.md          # Contributor guide
│
├── AGENTS.md                     # Claude Code agent documentation
├── SKILLS.md                     # Claude Code skill/command documentation
└── CLAUDE.md                     # Claude Code project instructions
```

---

## Architecture: POM + OOP

### Page Object Model (POM)

Every page or major section of the site has its own TypeScript class in `src/pages/`. This separates *how to interact with a page* from *what to assert about it*.

```
BasePage (base.page.ts)
├── HomePage (home.page.ts)
├── NavigationPage (navigation.page.ts)
├── ContactFormPage (contact.page.ts)
└── <FeaturePage> (<feature>.page.ts)
```

**Rules:**
- Page classes `extend BasePage`
- Locators are `readonly Locator` properties defined in the constructor
- Methods represent **user actions** (`clickPrimaryNav()`, `fillNameField()`)
- `expect()` assertions belong **only in test files**, never in page objects

### OOP Principles Applied

| Principle | How It's Used |
|-----------|--------------|
| **Inheritance** | All pages extend `BasePage`, inheriting `navigate()`, `waitForLoad()`, `takeScreenshot()` |
| **Encapsulation** | Internal locators are `readonly` properties; external API is method-based |
| **Abstraction** | `BasePage` hides Playwright details; tests work at the domain level |
| **Composition** | `site.fixture.ts` composes page objects into a single test context |

### Example Page Object

```typescript
// src/pages/features.page.ts
import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';
import type { SiteConfig } from '@types/site-config.types';

export class FeaturesPage extends BasePage {
  readonly heading: Locator;
  readonly featureCards: Locator;

  constructor(page: Page, config: SiteConfig) {
    super(page, config);
    this.heading = page.locator('h1, h2').first();
    this.featureCards = page.locator('[class*="feature"], [class*="card"]');
  }

  async getFeatureCount(): Promise<number> {
    return this.featureCards.count();
  }
}
```

### Example Test (using the fixture)

```typescript
// tests/functional/features.spec.ts
import { test, expect } from '@fixtures/site.fixture';

test('features section renders with cards @functional', async ({ homePage }) => {
  const cards = homePage.page.locator('[class*="feature"], [class*="card"]');
  await expect(cards.first()).toBeVisible({ timeout: 15_000 });
  expect(await cards.count()).toBeGreaterThan(0);
});
```

---

## Test Categories

| Tag | Folder | What It Tests |
|-----|--------|--------------|
| `@smoke` | `tests/smoke/` | Site loads, HTTPS, title present, no JS errors, response time |
| `@navigation` | `tests/navigation/` | Nav links present, no 404s, mobile menu, logo link |
| `@forms` | `tests/forms/` | Field validation, required fields, email format, no submission |
| `@functional` | `tests/functional/` | Hero, CTAs, features, how-it-works, content sections |
| `@visual` | `tests/visual/` | Screenshot regression baselines |
| `@responsive` | `tests/responsive/` | Layout at 390px/768px/1280px, no horizontal overflow |

---

## Claude Code: Agents, Skills & Commands

This repo is designed for **agentic operation** via Claude Code. See `AGENTS.md` for agent documentation and `SKILLS.md` for available slash commands.

### Quick reference

| Command | What it does |
|---------|-------------|
| `/analyze-site` | Crawl the live site and update `site.config.json` |
| `/generate-full-suite` | Analyze site + generate complete POM + test files |
| `/run-smoke` | Run `@smoke` tests and display a formatted summary |
| `/update-baseline` | Refresh visual regression snapshots |
| `/generate-report` | Parse `test-results/results.json` and display full report |

---

## GitHub Repository Structure

The `.github/` folder contains the scaffolding that makes this repo collaborative:

| File/Folder | Purpose |
|-------------|---------|
| `.github/workflows/playwright.yml` | CI pipeline — runs tests on every push/PR |
| `.github/PULL_REQUEST_TEMPLATE.md` | Checklist for every PR (type checks, tests added, etc.) |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Structured bug report form |
| `.github/ISSUE_TEMPLATE/test_request.md` | Request template for new test coverage |
| `.github/CONTRIBUTING.md` | Full contributor guide: branching, POM rules, test writing |

### What belongs where

| Content type | Location |
|-------------|---------|
| CI/CD automation | `.github/workflows/` |
| Contributor guidance | `.github/CONTRIBUTING.md` |
| PR/issue templates | `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md` |
| Claude Code instructions | `CLAUDE.md` (root) |
| Agent definitions | `.claude/agents/` |
| Slash commands | `.claude/commands/` |
| Agent/skill documentation for humans | `AGENTS.md`, `SKILLS.md` (root) |
| Site configuration | `site.config.json` (root) |

---

## Contributor Rules

### Before you write a test

1. Read `site.config.json` to understand the target site's flags
2. Run `/analyze-site` or use `WebFetch` to inspect live selectors before writing them
3. Run `npm run typecheck` and `npm run lint` — both must pass before any PR

### Branching strategy

```
main          ← stable, CI-passing
└── feat/<description>   ← new test coverage
└── fix/<description>    ← broken test fixes
└── chore/<description>  ← config, deps, docs
```

### Commit message format

```
feat(functional): add pricing page tests
fix(navigation): handle SPA route change for mobile menu
chore(config): update Playwright to 1.45
```

### Pull request requirements

- TypeScript compiles cleanly (`npm run typecheck`)
- ESLint passes (`npm run lint`)
- All new tests tagged with at least one `@tag`
- No form submissions, account creation, or hardcoded URLs
- New page objects added to `site.fixture.ts` if used in tests
- PR description explains *what* was added and *why*

### What never goes in a test file

- `page.waitForTimeout()` — use Playwright auto-waiting or `waitForSelector`
- `expect()` inside a page object method
- Hardcoded `https://deliversense.com` — always use `baseURL` or `siteConfig.url`
- `any` types without an explicit comment explaining why
- Form submissions or credential entry

---

*Part of the Phoenix Startup QA Agentic Solutions project. Powered by [Claude Code](https://claude.ai/code).*
