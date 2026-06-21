# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-O-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Project Profile scope is now project-level while current goal ledgers store only profile_evidence compliance records.

## Fit

The change follows the TypeScript agent-state CLI baseline: .opennori/profile/profile.json is project source data, evidence ledgers remain goal-scoped, and CLI commands recompute current goal status from Project Profile plus ledger evidence without embedding Profile items in contracts.

## Implementation Focus

Separate Project Profile source-of-truth from current-goal compliance evidence and status/report/dashboard surfaces.

## Evidence

src/core/profile.ts, src/types.ts, profile command modules, lifecycle profile checks, README, protocol, packaged Skills, and profile/dashboard tests.

## Limitations

This record proves architecture alignment for OpenNori implementation; user acceptance is proven separately by Product AC evidence.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

