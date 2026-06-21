# AC-O-1 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我在 Codex 对话里说“用 OpenNori 跑这个任务：目标是 X”后，能看到一份待确认的人类视角验收草案。

Measurement: 在 Codex 对话中查看 agent 返回的验收草案。

Passing threshold: 草案只描述用户通过工具执行操作后能完成的判断或动作；用户能直接 approve 或 revise。

## Evidence

Latest: acceptance-draft-guard-review - A natural-language goal no longer becomes a blindly approvable generic Nori Contract: generic draft output carries a discovery-required acceptance basis, and nori-acceptance instructs agents to show ACCEPTANCE-BASIS questions before asking for approval.
Result: passing
Basis: tool-observation
Reviewability: Inspect the nori-acceptance Skill and run tests covering generic draft review findings.
Limitations: This does not generate a fully specific final contract by itself; it prevents premature approval and routes the agent back to discovery questions.

Sources:
- npx vitest run test/cli-commands.test.js test/core.test.js
- npm run check
- src/acceptance.ts
- plugins/opennori/skills/nori-acceptance/SKILL.md
- test/core.test.js

## Files

- Criterion source: criteria/AC-O-1/criterion.json
- Status projection: criteria/AC-O-1/status.json
- Evidence ledger: criteria/AC-O-1/evidence
- Artifacts: criteria/AC-O-1/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
