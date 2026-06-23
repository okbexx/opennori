# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Kernel snapshot building will be split into active/no-goal read models, criteria projection, agent activity summary, and history summary so dashboard/MCP observe a clear outcome model instead of a mixed builder.

## Fit

The confirmed baseline treats .opennori JSON state as authoritative and dashboard/MCP snapshots as read-only projections. Snapshot code must surface goal, current gap, completion, profile, architecture, and events without becoming a second state layer or process log.

## Implementation Focus

Refactor src/kernel/snapshot-builder.ts into focused read-model modules while preserving buildSnapshot, refreshSnapshot, snapshot schema, dashboard tests, and MCP read-only behavior.

## Evidence

Read snapshot-builder.ts, snapshot-outcome.ts, snapshot-paths.ts, dashboard tests, MCP snapshot resource test, and dashboard UI consumption. snapshot-builder.ts currently mixes history summary, agent summary, active goal assembly, no-goal assembly, criteria projection, and event replay.

## Limitations

This architecture apply covers internal snapshot read-model boundaries only. It does not change dashboard UI, snapshot schema fields, MCP resources, event schema, or .opennori source-of-truth semantics.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
