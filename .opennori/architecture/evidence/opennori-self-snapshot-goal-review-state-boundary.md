# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Dashboard active snapshot will consume the shared GoalReviewState outcome projection so status, report, context export, and dashboard do not grow separate completion authorities.

## Fit

The confirmed TypeScript agent-state CLI baseline keeps .opennori JSON as source of truth, goalReviewState as the shared read model, and dashboard/kernel as a read-only projection surface.

## Implementation Focus

Refactor kernel snapshot assembly to reuse GoalReviewState and remove duplicate current gap, completion, evidence health, profile compliance, and intervention computation from dashboard snapshot code.

## Evidence

src/lifecycle/goal-review-state.ts centralizes review state; src/kernel/snapshot-goal.ts currently duplicates this assembly for dashboard projection.

## Limitations

This record only covers the read-model boundary; it does not change dashboard UI, persisted protocol schema, or subjective AC quality rules.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
