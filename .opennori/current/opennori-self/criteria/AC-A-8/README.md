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

Latest: mcp-resource-type-boundary-verification - MCP resource payload types are separated from read-only resource construction: src/mcp/types.ts owns resource descriptor/payload types, resources.ts builds read-only context/snapshot/doctor resources, and mcp.ts preserves public type exports without adding MCP write tools or state authority.
Result: passing
Basis: tool-observation
Reviewability: Inspect src/mcp/types.ts, src/mcp/resources.ts, and src/mcp.ts. Confirm MCP still exposes only read-only context/snapshot/doctor resources and no write tools.
Limitations: This is structural only. It does not add MCP tools, HTTP transport, OAuth, or writable MCP semantics.

Sources:
- .opennori/architecture/evidence/opennori-self-mcp-resource-type-boundary.json
- npx tsc --noEmit --pretty false
- npx vitest run test/mcp.test.ts
- npm run lint
- src/mcp/types.ts
- src/mcp/resources.ts
- src/mcp.ts

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
