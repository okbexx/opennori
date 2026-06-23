# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

MCP resource payload types are separated from read-only resource construction.

## Fit

src/mcp/types.ts now owns MCP resource descriptor and payload types; resources.ts builds read-only context/snapshot/doctor payloads; server.ts registers official SDK resources without adding write tools or state authority.

## Implementation Focus

Keep MCP as a read-only context surface while reducing resource builder coupling.

## Evidence

src/mcp/types.ts; src/mcp/resources.ts; src/mcp.ts; npx tsc --noEmit --pretty false; npx vitest run test/mcp.test.ts; npm run lint

## Limitations

This is a structural boundary improvement only. It does not add MCP tools, HTTP transport, OAuth, or writable MCP semantics.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

