# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-O-12
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Complete product acceptance expansion is implemented in packaged Skill behavior, local development Skills, protocol, README, website, and objective asset tests while keeping subjective AC quality out of CLI hard validators.

## Fit

Aligned with the TypeScript agent-state CLI baseline: CLI remains deterministic state, Skills handle subjective acceptance discovery, docs/site explain the user-visible product behavior, and tests verify assets rather than judging natural-language AC quality.

## Implementation Focus

Packaged Skills and docs define the full acceptance surface rule; examples and tests expose the rule as product asset coverage; website explains it to users.

## Evidence

plugins/opennori/skills/nori/SKILL.md; plugins/opennori/skills/nori-acceptance/SKILL.md; plugins/opennori/skills/nori-autogoal/SKILL.md; README.md; .opennori/protocol.md; test/core.test.js; /Users/jarl/code/jarlone/opennori-site/src/pages/index.astro

## Limitations

This is an agent behavior protocol and user-review surface, not an automated natural-language quality validator. Real quality still depends on the agent applying the Skill and the user approving or narrowing the Nori Contract.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

