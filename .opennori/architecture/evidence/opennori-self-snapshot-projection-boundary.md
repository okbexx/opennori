# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Snapshot projection now separates builder, outcome, path, and persistence boundaries while keeping MCP and dashboard on the same read-only projection.

## Fit

This follows the TypeScript agent-state CLI baseline: .opennori remains source of truth, dashboard and MCP consume read-only projections, and snapshot persistence is isolated from projection construction.

## Implementation Focus

Split kernel snapshot construction into snapshot-builder, snapshot-outcome, and snapshot-paths, leaving snapshot.ts as the compatibility export and only snapshot file write point.

## Evidence

npx tsc --noEmit --pretty false; npm run test:dashboard; npx vitest run test/mcp.test.ts; npm run lint

## Limitations

<none>

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
