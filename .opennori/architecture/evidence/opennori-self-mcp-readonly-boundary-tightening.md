# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

MCP baseline remains read-only: the command now imports only the narrow core/io result helper, and module-boundary tests prevent MCP source from registering tools or directly writing .opennori state.

## Fit

OpenNori reuses the official @modelcontextprotocol/sdk for stdio resource transport while keeping CLI/core/.opennori as the state authority and avoiding a second write layer.

## Implementation Focus

Tighten MCP CLI/import boundaries and add objective regression guards for no write tools and no direct file-write APIs in MCP source.

## Evidence

npx ctx7@latest docs /modelcontextprotocol/typescript-sdk confirmed registerResource/registerTool/StdioServerTransport separation; npx vitest run test/mcp.test.ts test/module-boundaries.test.js passed; npx tsc --noEmit --pretty false passed; node ./bin/opennori.js mcp --root . --json reports tools: [] and write_capability: none.

## Limitations

This slice does not add MCP write tools; any future write capability still requires a user-approved Architecture Challenge and CLI dry-run/confirm semantics.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
