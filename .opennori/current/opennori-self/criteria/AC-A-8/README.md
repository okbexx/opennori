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

Latest: agent-next-boundary-verification - AgentNext route-surface boundaries were split: src/agent-next.ts keeps the exported routing functions; src/agent-next-builder.ts builds the standard AgentNext payload; src/agent-next-activity.ts builds optional dashboard activity command templates; src/agent-next-doctor.ts filters recoverable active goals. Typecheck, focused CLI tests, reporting tests, doctor/status, and diff checks passed, and status still returns agent_next ready_for_next_loop.
Result: passing
Basis: tool-observation
Reviewability: Inspect the listed AgentNext modules to confirm routing prose, payload construction, dashboard activity templates, and doctor active-goal helpers are separated while public route functions remain stable. Rerun the listed focused verification commands.
Limitations: This proves the AgentNext module boundary and output behavior for the current route surface. It does not redesign route wording, add new states, or change Skill behavior.

Sources:
- .opennori/architecture/evidence/opennori-self-agent-next-boundary.json
- npx tsc --noEmit --pretty false
- npm run test:cli -- --run test/cli-lifecycle.test.js test/cli-acceptance.test.js test/cli-architecture.test.js test/cli-reporting.test.js
- npm run test:reporting
- node ./bin/opennori.js doctor --root . --json
- node ./bin/opennori.js status --root . --json
- git diff --check
- src/agent-next.ts
- src/agent-next-builder.ts
- src/agent-next-activity.ts
- src/agent-next-doctor.ts

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
