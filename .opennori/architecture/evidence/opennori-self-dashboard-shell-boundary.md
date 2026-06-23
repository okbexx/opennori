# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Dashboard App shell now owns subscription and selection state while header, outcome HUD, inspect drawer, event console, and view helpers live in focused read-only modules.

## Fit

The dashboard remains a React/Vite/Tailwind/Motion observation surface and does not gain state-writing controls or completion authority.

## Implementation Focus

Split App.tsx into DashboardHeader, OutcomeHud, InspectDrawer, EventLogConsole, IconButton, OutcomeCard, and dashboard-view helpers while preserving existing snapshot/event APIs.

## Evidence

npm run typecheck:dashboard; npm run build:dashboard; npm run test:dashboard; npm run lint

## Limitations

<none>

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
