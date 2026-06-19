# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-11
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Architecture Requirement routing keeps subjective non-trivial judgment in Skills and agent-user review, then stores explicit requirement state for deterministic CLI routing.

## Fit

The implementation follows the confirmed TypeScript agent-state CLI baseline: domain state lives in src/architecture, CLI commands are citty modules, schemas cover persisted state, and Skills own subjective judgment.

## Implementation Focus

Add explicit requirement state and route status/check/doctor/report/agent_next from it without natural-language hard validators.

## Evidence

Reviewed the architecture baseline, implemented requirement state, updated Skills/docs/tests, and ran typecheck plus targeted Vitest suites.

## Limitations

<none>

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
