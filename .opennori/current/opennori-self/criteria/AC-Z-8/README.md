# AC-Z-8 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我运行 opennori doctor 后，能判断当前项目是 ready、needs-action 还是 broken，并知道下一步修复动作。

Measurement: 在已安装项目、缺少接入登记的项目、Plugin 资产异常或 active goal 异常的项目中运行 opennori doctor。

Passing threshold: 输出包含整体健康状态、逐项检查结果、active goal 可恢复性、packaged Plugin Skill 状态、manifest plugin state 和可执行的 recovery 建议。

## Evidence

Latest: status-no-current-recovery - OpenNori status/resume/report now return routeable no-current-goal or health recovery state instead of unexpected_error when a project has no current Nori Contract. In agent-workbench, status now returns ok true with status needs-action, reason no_current_goal, agent_next health_needs_recovery, failed checks for missing .opennori/current and .opennori/drafts, and a short TTY summary pointing to recovery.
Result: passing
Basis: tool-observation
Reviewability: Rerun the status command against a project with initialized but empty or incomplete .opennori state and confirm there is no unexpected_error; inspect agent_next.state and the TTY summary.
Limitations: This validates local source behavior. npm/global users receive it after the next publish or local plugin/CLI sync.

Sources:
- node ./bin/opennori.js status --root /Users/jarl/code/jarlone/agent-workbench --json
- script -q /dev/null node ./bin/opennori.js status --root /Users/jarl/code/jarlone/agent-workbench
- npx vitest run test/cli-commands.test.js -t 'status commands return|status routes incomplete'
- npx vitest run
- src/cli/runtime.ts
- src/cli/command-tree.ts
- src/cli/human-output.ts
- test/core.test.js

## Files

- Criterion source: criteria/AC-Z-8/criterion.json
- Status projection: criteria/AC-Z-8/status.json
- Evidence ledger: criteria/AC-Z-8/evidence
- Artifacts: criteria/AC-Z-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
