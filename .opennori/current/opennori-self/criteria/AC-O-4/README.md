# AC-O-4 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我在 Codex 对话里问“现在完成了吗？”后，agent 只能基于 required AC 的状态和证据回答。

Measurement: 向 agent 询问完成状态并检查回答依据。

Passing threshold: 只有 required AC 全部 passing 或 waived 时才能回答 complete；否则必须指出未通过或 blocked 的 AC。

## Evidence

Latest: completion-judgment-project-profile-review - When the user asks if work is done, status/report answer from current_gap, required AC evidence, Project Profile compliance, Architecture Baseline state, and evidence_health.
Result: passing
Basis: tool-observation
Reviewability: Ask for status/report and confirm the completion answer is based on objective current_gap and required AC evidence, with Project Profile compliance and Architecture Baseline surfaced as review context instead of hidden agent self-certification.
Limitations: This verifies completion routing and report/status surfaces in the current repository. It does not replace human acceptance of subjective product quality.

Sources:
- node ./bin/opennori.js status --root . --json
- node ./bin/opennori.js report --root . --json
- src/core/contract.ts
- src/core/report.ts
- src/core/profile.ts

## Files

- Criterion source: criteria/AC-O-4/criterion.json
- Status projection: criteria/AC-O-4/status.json
- Evidence ledger: criteria/AC-O-4/evidence
- Artifacts: criteria/AC-O-4/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
