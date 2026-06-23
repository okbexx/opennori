# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Internal source modules now import domain type modules instead of the public src/types.ts barrel, and boundary tests guard MCP read-only resources, generated Markdown review-only authority, and lifecycle external command adapters.

## Fit

The change follows the confirmed TypeScript agent-state CLI baseline: public barrels remain external API surfaces, domain modules own protocol types, MCP reuses existing context/snapshot/doctor projections without write tools, Markdown stays generated review surface, and setup/plugin-sync delegate Codex/npm probing to narrow adapters.

## Implementation Focus

Keep architecture fixes focused on state-boundary and integration-boundary guardrails rather than adding new workflow state or subjective AC validators.

## Evidence

npx tsc --noEmit --pretty false, npx vitest run test/module-boundaries.test.js, npx vitest run test/mcp.test.ts test/lifecycle-adapters.test.ts, npx vitest run test/acceptance.test.js --testNamePattern Markdown.

## Limitations

<none>

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
