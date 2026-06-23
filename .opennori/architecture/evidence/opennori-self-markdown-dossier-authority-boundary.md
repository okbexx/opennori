# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Goal dossier Markdown remains a generated review surface while CLI active goal loading now supports explicit dossier directories and keeps README content out of state authority.

## Fit

This follows the JSON-authoritative OpenNori baseline: --dossier locates contract.json and ledger.json, legacy --acceptance only locates the dossier, generated README markers are documented consistently, and boundary tests prevent Markdown parser/import paths from returning.

## Implementation Focus

Acceptance gap AC-A-8 architecture boundary: Markdown review surfaces cannot become contract import/update authority.

## Evidence

npx vitest run test/acceptance.test.js test/module-boundaries.test.js; npx tsc --noEmit --pretty false

## Limitations

This preserves legacy --acceptance/--evidence compatibility names for existing tests and scripts; a broader API rename can happen separately if needed.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
