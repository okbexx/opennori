# mcp-readonly-context-server-baseline Build-vs-Buy Decision

Area: mcp-context-export
Need: Define how OpenNori may expose goal, acceptance, profile, architecture, evidence, report, and dashboard context to agent clients through MCP without creating a second state layer or duplicating the CLI.
Recommendation: reuse
Status: active

## Summary

Use the official Model Context Protocol TypeScript SDK with read-only resources first. The current implementation registers only context, snapshot, and doctor resources over stdio; no MCP write tools are registered.

## Candidates Checked

- Current project: OpenNori already exposes deterministic state through CLI commands, .opennori JSON files, context export, dashboard snapshots, and packaged Skills. MCP is currently an integration surface, not a replacement runtime.
- Standard library: Node stdio and HTTP primitives can transport bytes, but they do not implement MCP capability negotiation, tool/resource schemas, transports, or client expectations.
- Official SDK: Context7 on 2026-06-23 identified `/modelcontextprotocol/typescript-sdk` as the high-reputation SDK. The available npm package is `@modelcontextprotocol/sdk` 1.29.0; its exported server API includes `McpServer.registerResource(...)` and `StdioServerTransport`.
- Open source: `@modelcontextprotocol/sdk` is the protocol implementation to reuse. It carries transitive HTTP/OAuth/server dependencies even though OpenNori currently uses only stdio resources; this is accepted because protocol negotiation and transport framing should not be handwritten. Hono remains the dashboard kernel HTTP framework, but dashboard transport is not MCP and must not become an agent write authority.

## Baseline Boundary

- MCP resources should start read-only: current goal, current gap, Product AC, Project Profile, Architecture Baseline, evidence summary, report, dashboard snapshot, and health.
- Implemented resources are `opennori://project/context`, `opennori://project/snapshot`, and `opennori://project/doctor`.
- MCP tools are intentionally absent in the current implementation. If added later, they must be few and controlled, call existing CLI/core functions, and preserve dry-run/confirm semantics for writes.
- MCP must not invent Nori Contracts, approve AC, record completion, write evidence, replace Skills, replace the dashboard kernel, or create state outside `.opennori/`.
- MCP context is for agent/client interoperability. The CLI remains the deterministic state layer, Skills remain the natural-language behavior layer, and `.opennori/` remains the source of truth.
