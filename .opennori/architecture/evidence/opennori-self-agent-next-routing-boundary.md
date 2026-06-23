# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

AgentNext routing is split into lifecycle readiness, recommendation routing, and architecture-apply handoff modules while keeping src/agent-next.ts as the compatibility export.

## Fit

Keeps agent Skill routing as deterministic CLI state projection while separating health/setup, acceptance/architecture/evidence recommendation, and architecture apply follow-up boundaries.

## Implementation Focus

Added src/agent-next-lifecycle.ts, src/agent-next-recommendation.ts, and src/agent-next-architecture.ts; src/agent-next.ts now re-exports stable public functions for existing CLI and lifecycle call sites.

## Evidence

npm run lint

## Limitations

<none>

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
