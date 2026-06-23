# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Lifecycle command probes moved behind adapters; MCP is documented as a future read-only context surface; Markdown parsing remains a non-authoritative recovery helper.

## Fit

The change follows the TypeScript agent-state CLI baseline: setup/plugin-sync remain deterministic lifecycle orchestration, .opennori JSON remains the source of truth, external CLIs stay behind probe adapters, MCP does not create a second state layer, and Markdown does not become protocol authority.

## Implementation Focus

Reduce architecture coupling around lifecycle external commands and record integration boundaries for MCP and Markdown parsing before further infrastructure work.

## Evidence

npx tsc --noEmit --pretty false; npm run test:lifecycle; npm run test:architecture; npm run lint; node ./bin/opennori.js doctor --root . --json; node ./bin/opennori.js status --root . --json; git diff --check

## Limitations

This records and verifies the lifecycle adapter boundary and architecture decisions. It does not implement an MCP server yet, and it intentionally does not migrate every existing import away from the root types barrel in this slice.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
