# AC-Z-14 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我让 agent 继续一个已经完成的 OpenNori goal 时，不需要每轮都追问下一步是什么；agent 能看到少量可开启下一份 Nori Contract 的人类目标候选。

Measurement: 运行 opennori resume、opennori status、opennori next、opennori report 和 context export，查看 complete goal 的 next_recommendation。

Passing threshold: 已完成且无 review risk 的 goal 输出 ready-for-next-loop，并包含 candidate_goals；每个候选包含 goal、user_value、acceptance_directions 和 risks，帮助 agent 进入下一轮 AC discovery，但不呈现为 phase、plan 或 task list。

## Evidence

Latest: review-result - agent_next now carries candidate_goals for ready_for_next_loop, including draft_args, draft_command, and draft_rule, so Skills can continue from the deterministic routing surface without reconstructing flags or treating candidates as approved AC.
Result: passing
Basis: tool-observation
Reviewability: Rerun the listed checks and inspect resume/status JSON for data.agent_next.state=ready_for_next_loop with candidate_goals and draft metadata.
Limitations: This exposes deterministic routing data for Skills; selecting, refining, and approving the next draft remains an agent/user judgment and candidates are not completion evidence.

Sources:
- npm run typecheck
- npm test -- --run test/cli-commands.test.js test/core.test.js
- src/agent-next.ts
- test/core.test.js
- plugins/opennori/skills/nori/SKILL.md
- plugins/opennori/skills/nori-acceptance/SKILL.md
- plugins/opennori/skills/nori-reporting/SKILL.md

## Files

- Criterion source: criteria/AC-Z-14/criterion.json
- Status projection: criteria/AC-Z-14/status.json
- Evidence ledger: criteria/AC-Z-14/evidence
- Artifacts: criteria/AC-Z-14/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
