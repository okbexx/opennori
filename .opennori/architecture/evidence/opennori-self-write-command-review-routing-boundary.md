# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

State-mutating CLI commands should return current_gap, next_recommendation, and agent_next from the shared goalReviewState instead of assembling routing fields with ad hoc currentGap and nextRecommendation calls.

## Fit

The confirmed TypeScript agent-state CLI baseline keeps deterministic writes in command handlers, but outcome routing belongs to the shared read model so OpenNori does not grow multiple completion/routing authorities.

## Implementation Focus

Route evidence, profile, acceptance approval/evaluate/criterion, and architecture requirement/baseline command responses through goalReviewState after state writes.

## Evidence

rg currentGap/nextRecommendation shows several mutating CLI commands recomputing routing data after writes, while status/report/check/context already use goalReviewState.

## Limitations

This applies to command response routing after deterministic writes. Manifest, doctor, list, changes, and activity target may keep lightweight gap summaries because they are inventory/probe surfaces, not completion routing authorities.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
