# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-P-15
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Docs/schema tests now protect critical packaged Skill routing metadata and one-AC review reply skeletons while keeping subjective AC quality out of automated tests.

## Fit

Fits the confirmed TypeScript agent-state CLI baseline by testing objective Skill asset structure and discovery metadata only; agent/user judgment still owns AC quality, operation-path sufficiency, and generated wording.

## Implementation Focus

Add docs-schema guards for critical Skill frontmatter routing surfaces and one-AC review reply protocol skeletons, and update docs/testing.md with the boundary.

## Evidence

test/docs-schema.test.js; docs/testing.md; npx vitest run test/docs-schema.test.js; npm run lint; npx tsc --noEmit --pretty false

## Limitations

This protects Skill asset and reply-shape regressions only. It does not prove any future agent will generate good AC for a specific prompt.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
