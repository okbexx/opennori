# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Split the OpenNori protocol type surface into domain modules while preserving src/types.ts as the compatibility barrel.

## Fit

The confirmed baseline requires domain-first modules and thin contract surfaces; the type definitions now live beside their product domains instead of accumulating in one broad protocol file.

## Implementation Focus

Move common, contract, profile, evidence, agent, kernel, acceptance, architecture, and lifecycle types into src/types/* with src/types.ts re-exporting them for existing callers.

## Evidence

npx tsc --noEmit --pretty false; npm run test:quick; inspect src/types.ts and src/types/*.ts

## Limitations

This slice only modularizes the type surface. It does not yet split every runtime domain module or expand Biome coverage for core TypeScript files.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

