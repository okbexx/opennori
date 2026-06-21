# AC-A-2 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我确认 Architecture Baseline 后，新开的 agent session 能通过 OpenNori Plugin Skills 和 .opennori 状态识别这条架构约束，并知道后续实现必须沿用它。

Measurement: 在新会话中查看 OpenNori Plugin Skills、.opennori/agent-guide.md、architecture baseline、可选 agent route 和 architecture show/status 输出。

Passing threshold: 用户能判断新 session 不依赖旧聊天上下文也能通过 Plugin Skills 或 .opennori 状态找到架构约束；报告明确提示 agent 应提出 challenge 而不是静默替换。

## Evidence

Latest: review-result - Evidence add now returns next_recommendation and agent_next, so agents can route after recording evidence instead of guessing whether to continue a gap, review architecture, report completion risk, or start the next loop.
Result: passing
Basis: tool-observation
Reviewability: Run the listed tests and inspect evidence add JSON for next_recommendation and data.agent_next after evidence writes.
Limitations: This verifies deterministic routing in the evidence command; downstream agents still need to follow the returned Skill.

Sources:
- npx vitest run test/core.test.js -t 'high-risk criteria require strong evidence before passing'
- npx vitest run test/cli-commands.test.js -t 'evidence add command module records flexible reviewable sources'
- npx tsc --noEmit
- src/cli/commands/evidence/add.ts
- plugins/opennori/skills/nori-evidence/SKILL.md
- test/core.test.js

## Files

- Criterion source: criteria/AC-A-2/criterion.json
- Status projection: criteria/AC-A-2/status.json
- Evidence ledger: criteria/AC-A-2/evidence
- Artifacts: criteria/AC-A-2/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
