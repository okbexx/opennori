# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Split AgentNext construction, dashboard activity command templates, and doctor active-goal helpers while preserving agent-next routing functions.

## Fit

This follows the confirmed TypeScript Agent State CLI baseline: AgentNext remains deterministic agent routing state, dashboard activity remains an optional observation signal, and doctor goal filtering is separated from routing prose.

## Implementation Focus

AgentNext route-surface boundary refactor for AC-A-8.

## Evidence

Inspect src/agent-next.ts, src/agent-next-builder.ts, src/agent-next-activity.ts, and src/agent-next-doctor.ts; rerun typecheck, focused CLI/reporting tests, doctor/status, and diff checks.

## Limitations

This verifies the AgentNext construction boundary and output behavior for current routes. It does not redesign route prose or add new agent workflow states.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

