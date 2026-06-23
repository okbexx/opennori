# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Lifecycle type definitions are split into domain modules for result, paths, plugin state, manifest, lifecycle plans, doctor, bootstrap, profile checks, and context export; src/types/lifecycle.ts remains only as a compatibility re-export.

## Fit

The confirmed TypeScript agent-state CLI baseline favors domain type modules over central barrels so CLI/core/lifecycle/MCP modules depend only on the contracts they actually use.

## Implementation Focus

Reduce type-level coupling by moving lifecycle type definitions into narrow files and adding a module-boundary guard that forbids internal imports from the lifecycle compatibility barrel.

## Evidence

npx vitest run test/module-boundaries.test.js test/mcp.test.ts test/cli-lifecycle.test.js passed; npx tsc --noEmit --pretty false passed; rg found no src/test imports from types/lifecycle.ts.

## Limitations

The compatibility re-export remains for package consumers and migration safety; future internal code should continue importing from domain type modules.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
