# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-12
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Acceptance discovery, brainstorm, draft, AC quality review, and next-loop handoff now use Skill-prepared inputs and agent/user judgment; the CLI only validates objective state shape and stores provided data.

## Fit

Aligned with the TypeScript Agent State CLI baseline: citty command modules accept structured Skill-prepared briefs/questions/candidates, core validation stays structural, and report/agent_next route to Skills instead of embedding product semantics.

## Implementation Focus

src/acceptance.ts, src/cli/commands/acceptance/draft.ts, src/cli/commands/acceptance/brainstorm.ts, src/core/report.ts, src/agent-next.ts, README, protocol, packaged nori/nori-acceptance/nori-reporting/nori-evidence Skills, and tests removing old CLI generation paths.

## Evidence

<none>

## Limitations

The CLI still exposes compatibility fields such as acceptance_review and negative candidate_goals assertions, but they do not generate or judge subjective product semantics.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
