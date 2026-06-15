## Summary

<!-- What does this PR add or change? One to three bullet points. -->

-
-

## Type of change

- [ ] New test coverage (new spec file or new tests in an existing file)
- [ ] New/updated page object (changes to `src/pages/`)
- [ ] Bug fix (broken test or incorrect assertion)
- [ ] Dependency update
- [ ] Configuration change
- [ ] Documentation update

## Test coverage added

<!-- List the test file(s) and tag(s) added or modified -->

| File | Tags | Description |
|------|------|-------------|
| `tests/...` | `@` | |

## Checklist

- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run lint` passes with no errors
- [ ] All new tests are tagged with at least one of: `@smoke`, `@navigation`, `@forms`, `@functional`, `@visual`, `@responsive`
- [ ] No `page.waitForTimeout()` calls introduced
- [ ] No URLs hardcoded — using `baseURL` or `siteConfig.url`
- [ ] No form submissions, no account creation, no real credentials
- [ ] Page objects updated if new locators were introduced
- [ ] `src/fixtures/site.fixture.ts` updated if new page objects were added
- [ ] Visual snapshots updated via `npm run baseline` if visual tests changed

## Notes for reviewer

<!-- Anything the reviewer should know: tricky selectors, SPA timing considerations, known flakiness, etc. -->
