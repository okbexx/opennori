# AC-A-8 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我查看 OpenNori 自身 dogfood 状态时，能知道 Architecture Baseline 已建立，但后续架构修复是否真的完成不能被最小可运行结果误报。

Measurement: 查看 OpenNori 自身 status/report、Architecture Baseline、build-vs-buy decision、代码结构审查和后续架构修复证据。

Passing threshold: 报告能清楚显示 baseline 已建立、当前仍有哪些架构风险或未完成缺口；如果核心结构仍未完成修复，目标不能显示 complete。

## Evidence

Latest: mcp-readonly-context-final-verification - MCP read-only context slice verified after lint/typecheck/build/test cleanup. Official MCP TypeScript SDK documentation confirms registerResource and StdioServerTransport as the right implementation path; OpenNori registers only context, snapshot, and doctor resources, exposes no MCP tools, keeps CLI/core/.opennori as the source of truth, and leaves subjective acceptance or completion decisions to Skills and users.
Result: passing
Basis: tool-observation
Reviewability: Inspect the listed MCP source files and run the listed commands. MCP metadata should show tools: [] and resources for opennori://project/context, snapshot, and doctor. Snapshot resource tests assert it does not write .opennori/snapshots/current.json.
Limitations: This verifies a read-only stdio MCP context skeleton only. It intentionally does not add MCP write tools, dashboard write integration, HTTP transport, OAuth, or external MCP-client dogfood.

Sources:
- .opennori/architecture/evidence/opennori-self-ac-a-8-mcp-readonly-context.json
- npm run lint
- npx tsc --noEmit --pretty false
- npm run typecheck:dashboard
- npx vitest run test/mcp.test.ts
- npm run test:quick
- npm run test:architecture
- npm run test:lifecycle
- node ./bin/opennori.js mcp --root . --json
- node ./bin/opennori.js doctor --root . --json
- node ./bin/opennori.js status --root . --json
- node ./bin/opennori.js check --root . --json
- npm audit --omit=dev
- git diff --check
- src/mcp/resources.ts
- src/mcp/server.ts
- src/cli/commands/mcp.ts
- src/cli.ts
- test/mcp.test.ts
- .opennori/architecture/decisions/mcp-readonly-context-server-baseline.md

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
