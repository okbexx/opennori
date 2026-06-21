# AC-Z-13 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: high
Required: yes
Risk: high

## Criterion

User story: 作为用户，我运行 opennori doctor 后，如果项目状态不健康，能直接看到一组可执行恢复动作。

Measurement: 分别制造缺失 manifest、stale manifest、缺失 package Plugin assets 和损坏 active goal 的项目，然后运行 opennori doctor。

Passing threshold: doctor 输出 status、失败 check、active_goal_issues、Plugin asset health 和 recovery_actions；recovery_actions 说明要运行的 OpenNori 命令或要检查的 .opennori/active 文件位置。

## Evidence

Latest: verification - Doctor/check/report now expose invalid architecture evidence files with a concrete recovery action when profile-shaped JSON is misplaced under .opennori/architecture/evidence.
Result: passing
Basis: tool-observation
Reviewability: Rerun npm run check, node ./bin/opennori.js doctor --root /Users/jarl/code/jarlone/agent-workbench --json, and node ./bin/opennori.js check --root /Users/jarl/code/jarlone/agent-workbench --json; inspect the architecture_evidence doctor check and recovery action.
Limitations: OpenNori intentionally does not auto-delete misplaced user/project files; it reports the broken state and recovery action for user or agent cleanup.

Sources:
- npm run check
- src/lifecycle/doctor/project-health.ts
- src/cli/commands/check.ts
- src/core/report.ts
- test/core.test.js

## Files

- Criterion source: criteria/AC-Z-13/criterion.json
- Status projection: criteria/AC-Z-13/status.json
- Evidence ledger: criteria/AC-Z-13/evidence
- Artifacts: criteria/AC-Z-13/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
