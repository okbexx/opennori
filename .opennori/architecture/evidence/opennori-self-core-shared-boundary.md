# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Core shared helpers were split into protocol, IO, goal-state, dossier rendering, and dossier persistence modules while preserving shared.ts as a compatibility barrel.

## Fit

The TypeScript agent-state CLI baseline keeps deterministic .opennori state writes in core modules and separates protocol constants, filesystem IO, goal state discovery, and generated review surfaces.

## Implementation Focus

Reduce src/core/shared.ts responsibility without changing CLI behavior, Product AC semantics, or subjective validators.

## Evidence

npx tsc --noEmit --pretty false; npm run test:quick; npm run check; opennori doctor/status all passed.

## Limitations

This slice only splits existing deterministic helpers. It does not yet refactor CLI runtime command boundaries or dashboard projection modules.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

