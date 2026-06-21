# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-P-15
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

The test-system refactor follows the confirmed TypeScript agent-state CLI baseline by preserving domain modules and deterministic test surfaces while moving subjective agent judgment out of hard-coded tests.

## Fit

The change reorganizes Vitest coverage by objective protocol domains and updates docs/Skill routing. It does not introduce a natural-language AC-quality validator, new runtime state model, legacy CLI path, or process-centered workflow.

## Implementation Focus

Replace giant core/CLI test files with focused acceptance, evidence, reporting, profile, lifecycle, architecture, docs-schema, dashboard, and cli-domain suites; document that Skills/dogfood/evals/user review own subjective AC quality.

## Evidence

docs/testing.md, AGENTS.md, test/core.test.js, test/cli-*.test.js, package.json scripts, npm run test:quick, npm run test:cli

## Limitations

This architecture apply record verifies test-system alignment, not the subjective quality of future agent conversations.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
