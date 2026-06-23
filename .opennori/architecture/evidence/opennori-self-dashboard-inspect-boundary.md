# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Split dashboard inspect rendering into node-type read-only panels while keeping the dashboard as an observation surface over projected OpenNori state.

## Fit

The change follows the dashboard-observation-layer and React-dashboard baseline: node details render from snapshot data, no approval/waiver/evidence/profile/architecture write controls are added, and .opennori remains the state source of truth.

## Implementation Focus

Dashboard inspect panel module boundaries for goal, passed criteria, Project Profile, individual criterion, evidence, and shared display helpers.

## Evidence

npm run test:dashboard; npm run typecheck:dashboard; npx tsc --noEmit --pretty false; node ./bin/opennori.js doctor --root . --json; node ./bin/opennori.js status --root . --json

## Limitations

This is a source and built-asset boundary refactor. It preserves existing dashboard behavior and does not add a new browser screenshot or visual redesign evidence.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

