# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-Z-12
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Loop Engineer is added as a packaged Skill inside the confirmed Plugin-first, Skill-driven, CLI-state-backed architecture.

## Fit

The new nori-loop-engineer Skill lives under plugins/opennori/skills, is exposed through the Codex Plugin manifest, and coordinates existing Skills through agent_next instead of adding a second state layer or CLI command.

## Implementation Focus

Packaged Skill Pack routing and discovery for continuation behavior.

## Evidence

plugins/opennori/skills/nori-loop-engineer/SKILL.md; plugins/opennori/skills/nori/SKILL.md; plugins/opennori/.codex-plugin/plugin.json; test/docs-schema.test.js; npm run test:docs

## Limitations

This alignment proves package asset structure and behavior protocol text; real user effectiveness still depends on Codex loading the updated Plugin Skills in a new session.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
