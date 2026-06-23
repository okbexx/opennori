# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Evidence add/prune commands now import narrow core, lifecycle, and kernel modules instead of wide core/lifecycle barrels, keeping evidence CLI behavior on deterministic state writes and review projection boundaries.

## Fit

Fits the confirmed TypeScript agent-state CLI baseline by keeping command modules as thin citty entrypoints over focused domain modules, while .opennori remains the state authority and Skills retain subjective evidence sufficiency judgment.

## Implementation Focus

Refactor evidence add/prune command imports and add a module-boundary test that prevents those commands from importing wide core.ts or lifecycle.ts barrels.

## Evidence

src/cli/commands/evidence/add.ts; src/cli/commands/evidence/prune.ts; test/module-boundaries.test.js; npx vitest run test/cli-evidence.test.js test/evidence.test.js test/module-boundaries.test.js; npx tsc --noEmit --pretty false

## Limitations

This architecture apply covers evidence command module boundaries only. Other command groups still need separate narrow-import slices before the wide barrels can be fully retired.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
