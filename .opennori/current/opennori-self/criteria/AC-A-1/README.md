# AC-A-1 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我用自然语言告诉 agent 一个非平凡目标后，能先看到 Product AC 和 Architecture Baseline，让我判断要完成什么以及准备按什么技术架构完成。

Measurement: 在 OpenNori Skill 指引下查看 draft/discover 输出和 architecture baseline preview。

Passing threshold: 用户能在实现开始前分别确认 Product AC 和 Architecture Baseline；baseline 不呈现为阶段计划或任务列表。

## Evidence

Latest: review-result - OpenNori now routes agents to architecture review before non-trivial implementation when Product AC is ready but the Architecture Baseline is missing; after baseline confirmation, agent_next returns to the current Product AC evidence gap.
Result: passing
Basis: tool-observation
Reviewability: Run the targeted tests and inspect status/resume JSON for agent_next.state architecture_needs_review before baseline confirmation and work_on_current_gap after baseline confirmation.
Limitations: This verifies deterministic OpenNori state-layer routing; agent/user still decide whether a concrete task is trivial enough to waive architecture review.

Sources:
- npx vitest run test/core.test.js test/cli-commands.test.js
- npm run check
- src/core/report.ts
- src/agent-next.ts
- test/core.test.js
- plugins/opennori/skills/nori/SKILL.md

## Files

- Criterion source: criteria/AC-A-1/criterion.json
- Status projection: criteria/AC-A-1/status.json
- Evidence ledger: criteria/AC-A-1/evidence
- Artifacts: criteria/AC-A-1/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
