# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Split the Product evidence state boundary into source normalization, risk gate, workflow status, evidence view, pruning, health, and recording modules while keeping evidence.ts as a compatibility export.

## Fit

This follows the confirmed TypeScript Agent State CLI baseline by keeping objective evidence state semantics in domain modules and preserving CLI/report/dashboard imports through a stable barrel. Subjective AC quality and evidence sufficiency remain Skill and user-review responsibilities.

## Implementation Focus

Evidence state boundary refactor for AC-A-8.

## Evidence

Inspect src/core/evidence.ts, evidence-source.ts, evidence-risk.ts, evidence-record.ts, evidence-workflow.ts, evidence-view.ts, evidence-prune.ts, and evidence-health.ts; rerun typecheck, evidence/reporting/domain CLI/dashboard tests, doctor, status, and diff checks.

## Limitations

This verifies module boundaries for existing evidence behavior. It does not add a new evidence adapter taxonomy or judge subjective AC quality.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

