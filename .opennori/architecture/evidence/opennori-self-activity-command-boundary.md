# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Activity CLI command code will be split so dashboard activity remains a lightweight signal surface: argument normalization, target handling, signal writing, snapshot summary projection, and command definitions stay separated.

## Fit

The change follows the dashboard/kernel boundary in the TypeScript agent-state CLI baseline. Activity writes only .opennori/activity and event/snapshot projections, never Product AC evidence or contract state.

## Implementation Focus

Split src/cli/commands/activity.ts without changing opennori activity start/heartbeat/finish/show behavior.

## Evidence

src/cli/commands/activity.ts currently combines activity args, TTL parsing, target inference, signal writes, snapshot refresh, response projection, and command definitions in one file.

## Limitations

This apply record covers CLI activity module boundaries; validation will still be needed after code changes.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
