---
name: Bug report
about: Report a test that is failing unexpectedly or producing incorrect results
title: '[BUG] '
labels: bug
assignees: ''
---

## Describe the bug

<!-- A clear, concise description of what the test failure is -->

## Failing test

<!-- The full test name or file path -->

**File:** `tests/...`
**Test name:** `...`
**Tag(s):** `@`

## To reproduce

1. Checkout branch: `main`
2. Run: `npx playwright test <file> --project=<project>`
3. See failure

## Expected behavior

<!-- What should the test assert / what was the expected outcome? -->

## Actual behavior

<!-- What does the test actually do / what error is thrown? -->

## Error output

```
<!-- Paste the full error message from the Playwright output -->
```

## Environment

- OS: <!-- e.g. Ubuntu 22.04, macOS 14, Windows 11 -->
- Node.js version: <!-- e.g. 20.11.0 -->
- Playwright version: <!-- e.g. 1.44.0 -->
- Browser project: <!-- chromium-desktop / mobile-chrome / tablet -->
- CI or local: <!-- local / GitHub Actions -->

## Screenshots / traces

<!-- Attach playwright-report/ trace or screenshots if available -->

## Possible cause

<!-- Optional: your hypothesis — selector changed? SPA timing issue? Site down? -->
