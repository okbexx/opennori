# AC-A-7 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我在 agent 准备自研基础设施前，能看到它已经比较过可复用选择，并说明为什么仍要自研或复用。

Measurement: 查看 architecture build-vs-buy 输出、architecture decisions 记录、status 或 report。

Passing threshold: 报告能让我判断 agent 是否检查过项目现有依赖、标准库、官方方案、成熟开源方案和自研理由；自研不能只有口头总结。

## Evidence

Latest: review-result - Unhealthy build-vs-buy decisions now appear as build_vs_buy review risks in completion and next_recommendation without creating synthetic Product AC or current_gap; tests cover missing reuse candidates and missing self-build reason.
Result: passing
Basis: tool-observation
Reviewability: Run the build-vs-buy targeted test and inspect the build-vs-buy health plus completion review-risk assertions.
Limitations: This proves build-vs-buy health reporting and completion confidence semantics, not the quality of every individual future architecture decision.

Sources:
- npx vitest run test/core.test.js -t 'build-vs-buy'
- src/core/report.ts
- src/architecture/build-vs-buy.ts
- test/core.test.js
- plugins/opennori/skills/nori-build-vs-buy/SKILL.md

## Files

- Criterion source: criteria/AC-A-7/criterion.json
- Status projection: criteria/AC-A-7/status.json
- Evidence ledger: criteria/AC-A-7/evidence
- Artifacts: criteria/AC-A-7/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
