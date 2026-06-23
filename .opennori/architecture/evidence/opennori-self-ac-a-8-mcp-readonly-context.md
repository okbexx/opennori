# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

MCP read-only context server uses the official @modelcontextprotocol/sdk stdio transport and registers only context, snapshot, and doctor resources over existing OpenNori projections.

## Fit

Fits the confirmed TypeScript Agent State CLI baseline by keeping CLI/core/lifecycle as source-of-truth and adding MCP only as a read-only contract surface.

## Implementation Focus

Expose OpenNori current context, dashboard snapshot projection, and doctor health to MCP clients without adding write tools or a second state layer.

## Evidence

src/mcp/resources.ts, src/mcp/server.ts, src/cli.ts, test/mcp.test.ts, package.json, README.md, .opennori/protocol.md

## Limitations

This slice intentionally does not add MCP write tools, HTTP transport, OAuth, or dashboard integration.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
