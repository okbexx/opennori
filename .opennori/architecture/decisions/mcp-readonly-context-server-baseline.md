# mcp-readonly-context-server-baseline Build-vs-Buy Decision

Area: mcp-context-export
Need: Define how OpenNori may expose goal, acceptance, profile, architecture, evidence, report, and dashboard context to agent clients through MCP without creating a second state layer or duplicating the CLI.
Recommendation: reuse
Status: active

## Summary

When OpenNori adds MCP, use the official Model Context Protocol TypeScript SDK with read-only resources first and a tiny set of controlled tools that delegate to CLI/core state functions.

## Candidates Checked

- Current project: OpenNori already exposes deterministic state through CLI commands, .opennori JSON files, context export, dashboard snapshots, and packaged Skills. MCP is currently an integration surface, not a replacement runtime.
- Standard library: Node stdio and HTTP primitives can transport bytes, but they do not implement MCP capability negotiation, tool/resource schemas, transports, or client expectations.
- Official SDK: Context7 on 2026-06-23 identified `/modelcontextprotocol/typescript-sdk` as the high-reputation SDK. The v2 API uses `McpServer` with `registerResource` and `registerTool` plus transports such as `StdioServerTransport` and Streamable HTTP.
- Open source: `@modelcontextprotocol/typescript-sdk` is the mature protocol implementation to reuse. Hono remains the dashboard kernel HTTP framework, but dashboard transport is not MCP and must not become an agent write authority.

## Baseline Boundary

- MCP resources should start read-only: current goal, current gap, Product AC, Project Profile, Architecture Baseline, evidence summary, report, dashboard snapshot, and health.
- MCP tools, if added, must be few and controlled. They must call existing CLI/core functions and preserve dry-run/confirm semantics for writes.
- MCP must not invent Nori Contracts, approve AC, record completion, write evidence, replace Skills, replace the dashboard kernel, or create state outside `.opennori/`.
- MCP context is for agent/client interoperability. The CLI remains the deterministic state layer, Skills remain the natural-language behavior layer, and `.opennori/` remains the source of truth.
