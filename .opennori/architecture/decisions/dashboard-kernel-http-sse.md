# dashboard-kernel-http-sse Build-vs-Buy Decision

Area: dashboard-kernel
Need: Provide a local visual dashboard that observes OpenNori contract, gap, evidence, architecture, and live agent activity without becoming an agent runtime.
Recommendation: self-build
Status: active



## Summary

Use Node standard library HTTP plus Server-Sent Events for a local loopback observation kernel. OpenNori keeps .opennori as source of truth, emits a small durable JSONL event ledger, projects current snapshot JSON, and serves a static SVG dashboard. MCP remains a later structured agent tool surface, not the dashboard transport.

## Candidates Checked

- Current project: OpenNori already has TypeScript domain modules, citty CLI commands, JSON .opennori state, manifest-managed lifecycle, and package-local static assets; no existing kernel/dashboard layer is present.
- Standard library: Node http, fs, path, url, and child_process are sufficient for a loopback server, JSON snapshot endpoint, static file serving, and SSE event stream.
- Official SDK: No official OpenNori SDK exists for dashboard transport. MCP is useful later for agent tool calls, but OpenAI/Codex Skills plus CLI already cover current agent state writes; MCP is not required to stream a human dashboard.
- Open source: Express/Fastify/Hono and frontend frameworks were considered, but the first dashboard is local, unauthenticated loopback, static, and has three endpoints; adding a server or SPA framework would increase package surface before routing complexity exists.

## Self-build Reason

The self-built portion is intentionally small adapter glue around Node's standard library and OpenNori's own state semantics. External libraries would not replace the product-specific event, activity, and snapshot projection model.
