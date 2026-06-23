# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Goal dossier Markdown is now a generated review surface only; the old generated acceptance Markdown parser/helper was removed and core.ts no longer exports Markdown parsing as a state API.

## Fit

This follows the confirmed JSON-authoritative baseline: contract, ledger, criterion, evidence, profile, and architecture JSON remain source of truth, while README files are projections generated from structured state.

## Implementation Focus

Remove stale Markdown-to-state affordance and strengthen module-boundary tests so Markdown cannot become an import path without a new build-vs-buy decision.

## Evidence

Focused tests passed: npx vitest run test/acceptance.test.js test/docs-schema.test.js test/module-boundaries.test.js; TypeScript passed: npx tsc --noEmit --pretty false.

## Limitations

This intentionally does not add editable Markdown import. If OpenNori later needs Markdown-as-data behavior, it must choose a parser stack through a new build-vs-buy decision.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
