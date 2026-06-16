# dashboard-kernel-hono-transport Build-vs-Buy Decision

Area: dashboard-kernel
Need: Provide a local visual dashboard transport that observes OpenNori contract, gap, evidence, architecture, and live agent activity without becoming an agent runtime.
Recommendation: reuse
Status: active



## Summary

Use Hono plus @hono/node-server for the local dashboard HTTP/SSE transport while keeping OpenNori's .opennori state, event ledger, activity, and snapshot projection as first-party domain modules.

## Candidates Checked

- Current project: OpenNori already has TypeScript domain modules, citty CLI commands, dashboard static assets, and separate src/kernel/activity.ts, src/kernel/events.ts, and src/kernel/snapshot.ts modules. The previous hand-written HTTP server was becoming routing, static-file, SSE, and error-response infrastructure rather than OpenNori domain logic.
- Standard library: Node http, fs, path, url, and child_process can implement the transport, but keeping route matching, response handling, SSE framing, server startup, and error handling as custom code repeats solved infrastructure and makes later dashboard growth more expensive.
- Official SDK: @hono/node-server is Hono's official Node adapter and runs Hono apps on Node.js using web-standard Request/Response APIs. Hono's streamSSE helper provides a typed SSE response boundary; package-root static asset resolution remains OpenNori-owned because Hono's serve-static root is cwd-relative.
- Open source: Hono is a lightweight TypeScript web framework already used in mature agent-adjacent stacks such as opencode's TypeScript server layer. Express is older and heavier for this local kernel, while Fastify is better for larger API services but adds plugin/server architecture beyond the current observation surface.

## Self-build Reason

<none>
