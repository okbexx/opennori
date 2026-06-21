# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-P-16
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Goal and criterion dossier state follows the confirmed TypeScript agent-state CLI baseline: structured JSON remains authoritative, generated README files are review surfaces, and CLI/domain modules keep deterministic .opennori writes.

## Fit

The change stays in src/core/shared.ts, CLI runtime/commands, lifecycle readers, dashboard projections, tests, packaged Skill docs, and managed .opennori assets without adding a process-centered workflow or dashboard write authority.

## Implementation Focus

Store each goal as a directory with contract.json, ledger.json, README.md, and per-AC criteria/<AC-id>/ dossiers while keeping normal current/draft/completed/blocked state off flat file pairs.

## Evidence

npm run typecheck; npm run test:acceptance; npm run test:profile; npm run test:reporting; npm run test:evidence; npm run test:architecture; npm run test:dashboard; npm run test:lifecycle

## Limitations

Full check will be rerun after final documentation and self-state refresh.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
