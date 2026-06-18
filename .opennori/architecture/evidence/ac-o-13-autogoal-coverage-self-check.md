# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-O-13
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Complete-product autogoal coverage self-check is implemented in packaged Skills, local development Skills, protocol, README, website, and objective asset tests without adding CLI subjective validators.

## Fit

Aligned with the TypeScript agent-state CLI baseline: Skills perform subjective coverage review and split broad user judgment surfaces; CLI remains a deterministic draft/state layer.

## Implementation Focus

Packaged and local Skills now require coverage maps before complete-product draft approval; docs/site explain the behavior; tests verify asset coverage without judging natural-language quality.

## Evidence

plugins/opennori/skills/nori/SKILL.md; plugins/opennori/skills/nori-acceptance/SKILL.md; plugins/opennori/skills/nori-autogoal/SKILL.md; README.md; .opennori/protocol.md; test/core.test.js; /Users/jarl/code/jarlone/opennori-site/src/pages/index.astro

## Limitations

This ensures OpenNori capability assets instruct agents to self-check coverage. It does not hard-code AC quality scoring in the CLI and future behavior still depends on the loaded Skill and user approval.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

