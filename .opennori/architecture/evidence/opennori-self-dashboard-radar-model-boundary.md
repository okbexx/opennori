# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Dashboard radar projection now has a dedicated model boundary; React renders readonly nodes, links, grid, and styles from that model instead of owning projection logic.

## Fit

Keeps the dashboard as a readonly observation surface while separating projection/state semantics from React/SVG rendering under the confirmed TypeScript agent-state CLI baseline.

## Implementation Focus

Added src/dashboard/src/radar-model.ts for node/link/grid projection and style helpers; AcceptanceRadarNet now observes dimensions and renders the model; dashboard tests cover passed aggregate, current gap, and evidence node projection.

## Evidence

npm run lint

## Limitations

<none>

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
