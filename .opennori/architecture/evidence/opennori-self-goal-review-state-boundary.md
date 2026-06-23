# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Goal review outcome assembly will be centralized as a read-only lifecycle projection so status, resume, report, check, and context export do not each assemble completion, current gap, evidence health, architecture, profile, and agent_next independently.

## Fit

The change follows the TypeScript agent-state CLI baseline: structured .opennori state remains authoritative, CLI commands stay deterministic, and the projection has no write side effects or subjective AC validation.

## Implementation Focus

Introduce a shared read-only GoalReviewState projection and route reporting/context/status commands through it without changing user-facing schemas.

## Evidence

status/resume/report/check/context export currently repeat currentGap, completionAnswer, evidenceHealth, nextRecommendation, and agentNextForRecommendation assembly.

## Limitations

This apply record covers read-only outcome assembly; validation is required after command refactors.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
