# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-O-14
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

AC-O-14 keeps draft approval semantics in packaged Skills and documentation while CLI only routes agents toward the one-AC-at-a-time review loop.

## Fit

The change follows the TypeScript agent-state CLI baseline: packaged Skills own subjective user confirmation behavior; src/agent-next.ts and draft next_actions expose deterministic routing hints; .opennori state stores AC and evidence without adding a natural-language validator.

## Implementation Focus

Replace batch AC interpretation approval with AC Review Loop across nori, nori-acceptance, nori-autogoal, docs, agent_next, draft next_actions, tests, and website copy.

## Evidence

Review plugins/opennori/skills/nori*.md, src/agent-next.ts, src/cli/commands/acceptance/draft.ts, README.md, AGENTS.md, .opennori/protocol.md, test/core.test.js, test/cli-commands.test.js, and opennori-site/src/pages/index.astro.

## Limitations

This alignment record is architecture context only; product acceptance still requires reviewable evidence that the visible Skill/docs/CLI surfaces enforce one-AC-at-a-time confirmation.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

