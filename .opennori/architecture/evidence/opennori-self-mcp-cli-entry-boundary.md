# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

MCP stdio startup now routes through the shared citty command registry and an explicit stdioServer policy; src/cli.ts no longer owns a parallel mcp parser or direct server startup path.

## Fit

This follows the TypeScript agent-state CLI baseline: registry owns command surfaces, command modules own command behavior, CLI main owns output policy, and MCP remains a read-only context surface using the official MCP SDK.

## Implementation Focus

MCP/CLI entry boundary收口，不新增MCP写工具、不新增第二状态层、不改变dashboard或completion authority。

## Evidence

src/cli.ts, src/cli/commands/mcp.ts, src/cli/registry.ts, test/mcp.test.ts, test/module-boundaries.test.js; npx vitest run test/mcp.test.ts test/module-boundaries.test.js; npx tsc --noEmit --pretty false; npm run lint; node ./bin/opennori.js mcp --root . --json

## Limitations

This is an internal command-boundary refactor. It does not add MCP resources/tools, change OpenNori subjective review policy, or prove client compatibility beyond local metadata/resource tests.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
