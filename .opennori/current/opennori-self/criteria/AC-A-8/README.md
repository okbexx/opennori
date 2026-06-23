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

Latest: context-export-boundary-refactor - Context export now has separate read-only state collection, review payload assembly, relative path projection, and explicit artifact writing boundaries. The public context export schema and CLI behavior remain stable, MCP still consumes it as a read-only resource, and default context export performs no artifact write.
Result: passing
Basis: tool-observation
Reviewability: Inspect the listed context export modules: state collection should read existing core/.opennori state, payload assembly should project review context only, path projection should remain relative, and artifact writing should only happen through explicit --output. Rerun the listed commands and confirm MCP resources still report side_effect none.
Limitations: This verifies context export boundaries and existing read-only MCP consumption. It does not add new external review integrations or MCP write tools.

Sources:
- .opennori/architecture/evidence/opennori-self-context-export-boundary.json
- npx tsc --noEmit --pretty false
- npm run test:reporting
- npm run test:cli
- npx vitest run test/mcp.test.ts
- npm run lint
- node ./bin/opennori.js check --root . --json
- node ./bin/opennori.js status --root . --json
- node ./bin/opennori.js context export --root . --json
- src/lifecycle/context-export.ts
- src/lifecycle/context-export-state.ts
- src/lifecycle/context-export-payload.ts
- src/lifecycle/context-export-paths.ts
- src/lifecycle/context-export-artifact.ts
- src/cli/commands/context.ts
- src/types/lifecycle.ts
- test/reporting.test.js
- test/cli-reporting.test.js
- test/mcp.test.ts

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
