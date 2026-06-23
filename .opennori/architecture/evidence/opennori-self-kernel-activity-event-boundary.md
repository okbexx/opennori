# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Kernel activity responsibilities will be split into target resolution, activity storage, and event projection so dashboard live activity remains a projection over current OpenNori state rather than a second workflow state layer.

## Fit

The confirmed TypeScript agent-state CLI baseline treats dashboard activity as observation-only: .opennori/activity and .opennori/events are projections, Product AC evidence remains in goal dossiers, and dashboard APIs cannot confirm, approve, waive, or write completion state.

## Implementation Focus

Refactor src/kernel/activity.ts into focused modules for target inference, store/normalization, and event projection while preserving the public activity API and CLI behavior.

## Evidence

Read src/kernel/activity.ts, events.ts, snapshot-builder.ts, cli activity command, dashboard tests, and the observation-only dashboard baseline. activity.ts currently mixes target inference, normalization, persistence, and event emission.

## Limitations

This architecture apply covers internal kernel activity/event boundaries only. It does not change dashboard UI, activity CLI flags, event schemas, Product AC evidence semantics, or dashboard observation-only policy.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
