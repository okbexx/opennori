# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-O-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Project Profile Skill checks now inspect package Skills, Codex Plugin cache Skills, and user-local Skills through a narrow lifecycle adapter.

## Fit

The implementation keeps Project Profile as project-level completion-risk evidence, preserves Plugin-first Skill distribution, and avoids building a second Codex Skill runtime.

## Implementation Focus

Replace inline local Skill path probing with a lifecycle adapter consumed by profile checks, plus objective tests for package, plugin cache, and user Skill sources.

## Evidence

src/lifecycle/adapters/skill-capability.ts, src/lifecycle/profile-checks.ts, test/lifecycle-adapters.test.ts, test/profile.test.js, and focused validation commands.

## Limitations

The adapter proves local SKILL.md assets are present; it does not prove Codex selected a Skill or that the agent subjectively followed the Skill during work.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
