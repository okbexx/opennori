# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Criterion status projections now use per-criterion ledger timestamps so recording one AC evidence does not make unrelated AC status files look updated.

## Fit

The change keeps JSON ledger as source of truth, preserves deterministic dossier generation, and narrows projection write semantics without adding subjective validators.

## Implementation Focus

Update criterion ledger state with optional updated_at, stamp touched evidence states, preserve existing projection timestamps for untouched ACs, and add an objective regression test.

## Evidence

npx vitest run test/cli-evidence.test.js; npm run test:evidence; npx tsc --noEmit --pretty false; npm run lint

## Limitations

<none>

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

