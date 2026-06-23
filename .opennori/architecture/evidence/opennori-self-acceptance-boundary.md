# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Acceptance module responsibilities are split into Skill-prepared input normalization, subjective-review surface, and discovery/brainstorm Markdown rendering while keeping src/acceptance.ts as the stable export.

## Fit

Preserves the OpenNori boundary where CLI stores objective Skill-prepared assets and exposes review surfaces without becoming a subjective AC validator.

## Implementation Focus

Added src/acceptance-skill-input.ts, src/acceptance-review.ts, and src/acceptance-markdown.ts; existing CLI/status/report callers continue importing through src/acceptance.ts.

## Evidence

npm run lint

## Limitations

<none>

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
