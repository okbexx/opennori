# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-D-5
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Dashboard observes Project Profile and current-goal compliance without becoming a write surface.

## Fit

The React dashboard continues reading kernel snapshot state only. Snapshot exposes project capability_profile and current-goal capability_compliance; the header icon opens a readonly overlay and no dashboard API writes profile/evidence/waiver/confirm state.

## Implementation Focus

Align dashboard Profile overlay with project-level Project Profile plus current-goal compliance semantics.

## Evidence

src/kernel/snapshot.ts, src/dashboard/src/selection.ts, src/dashboard/src/App.tsx, InspectNodePanel, dashboard built assets, and dashboard tests.

## Limitations

This record covers dashboard state projection and UI semantics, not every visual inspection scenario.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

