# AC-D-2 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: acceptance
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我打开 OpenNori dashboard 观察 agent 工作时，agent 使用 OpenNori Skill 推进当前验收缺口后，我能看到 live activity 显示 agent、Skill、目标、当前 gap、状态和摘要；如果有多个 active goals，agent 不会把活动误绑定到错误目标。

Measurement: 在包含单个和多个 active goals 的项目中运行 activity start/heartbeat/finish，并查看 activity show、dashboard snapshot 和 agent_next.dashboard_activity。

Passing threshold: Skill 可从 agent_next.dashboard_activity 或低参数 activity 命令发布 start/heartbeat/finish；唯一当前 gap 可自动绑定 goal/gap，多目标歧义返回明确恢复动作；activity 只进入 .opennori/activity/events/snapshots，不改变 evidence/report completion。

## Evidence

Latest: dashboard-activity-workflow - OpenNori now gives Skills a dashboard_activity routing surface, lets activity start/heartbeat/finish infer the unique current goal/gap, refuses ambiguous multi-goal activity, and keeps activity out of evidence/completion state.
Result: passing
Basis: tool-observation
Reviewability: Rerun npm run check, inspect status agent_next.dashboard_activity for an explicit goal, run the temporary activity smoke to see inferred goal/gap in snapshot, and inspect tests that prove ambiguous multi-goal activity fails closed without writing evidence.
Limitations: This verifies the local CLI/Skill protocol and dashboard projection behavior. It does not prove a human watched a real long-running external project through the dashboard; that remains a broader dogfood scenario.

Sources:
- npm run check
- node ./bin/opennori.js status --root . --goal opennori-self --json
- tmp=$(mktemp -d /tmp/opennori-activity-smoke-XXXXXX); node ./bin/opennori.js draft --root "$tmp" --goal "Ship dashboard activity" --json >/dev/null; node ./bin/opennori.js approve --root "$tmp" --summary "Approved" --json >/dev/null; node ./bin/opennori.js activity start --root "$tmp" --skill nori-evidence --state verifying --summary "Verifying the current gap" --json
- src/agent-next.ts
- src/kernel/activity.ts
- src/cli/commands/activity.ts
- src/kernel/snapshot.ts
- plugins/opennori/skills/nori/SKILL.md
- .opennori/protocol.md

## Files

- Criterion source: criteria/AC-D-2/criterion.json
- Status projection: criteria/AC-D-2/status.json
- Evidence ledger: criteria/AC-D-2/evidence
- Artifacts: criteria/AC-D-2/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
