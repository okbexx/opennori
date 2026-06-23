# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-P-15
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Test-system boundary now keeps core tests narrow, moves CLI source-boundary checks into module-boundaries, and prevents Skill description tests from becoming subjective behavior snapshots.

## Fit

The change follows the TypeScript agent-state CLI baseline by testing deterministic protocol, asset, and module boundaries while leaving AC quality and Skill judgment to Skills, dogfood, and human eval prompts.

## Implementation Focus

Remove subjective Skill routing word-list assertions and keep architecture source checks in architecture boundary tests.

## Evidence

Focused tests for core, docs-schema, and module-boundaries pass; lint, typecheck, and opennori check pass.

## Limitations

This is a test boundary refactor. It does not by itself improve Skill behavior; Skill quality still depends on packaged Skill content and dogfood evals.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
