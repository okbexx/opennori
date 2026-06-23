# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

OpenNori repository routing, testing strategy, CLI build-vs-buy decision, and local product-development Skill now document the thin-command and narrow-import boundary for future command work.

## Fit

Fits the confirmed TypeScript agent-state CLI baseline by turning the evidence-command narrow import slice into persistent architecture guidance for future agents, without changing Product AC semantics or adding subjective hard validators.

## Implementation Focus

Update AGENTS.md, docs/testing.md, cli-command-layer build-vs-buy records, and the local nori-product-development Skill with command-module boundary guidance.

## Evidence

AGENTS.md; docs/testing.md; .opennori/architecture/decisions/cli-command-layer-adopt-citty-for-long-term-typescript-cli.md; /Users/jarl/code/jarlone/.agents/skills/nori-product-development/SKILL.md; npx vitest run test/docs-schema.test.js test/module-boundaries.test.js; npx tsc --noEmit --pretty false; node ./bin/opennori.js check --root . --json

## Limitations

This architecture apply records guidance and decision alignment only. It does not remove every remaining wide barrel import from all CLI command groups.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
