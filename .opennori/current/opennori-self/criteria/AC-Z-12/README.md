# AC-Z-12 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我安装或获取 OpenNori 后，agent 能通过一组职责清晰的 OpenNori Plugin Skills，把自然语言请求稳定映射到验收发现、架构基线、证据、能力偏好、项目健康、报告和下一轮候选目标，而不需要我记住 Skill 名或 CLI 参数。

Measurement: 查看 .codex-plugin/plugin.json、plugins/opennori/skills/nori*/SKILL.md、opennori doctor、opennori status/report/context export，以及典型自然语言场景下的 Skill 路由说明。

Passing threshold: Skill Pack 不只是命令清单：每个 Skill 都包含触发语义、agent 应先读取的状态、用户回复形态、状态写入边界、handoff 到其他 Skill 的条件和误用防护；总入口能处理继续、完成判断、记录证据、能力偏好、架构优先、项目健康和 candidate_goals；所有 Skill 都保持 Plugin-first，不要求项目内 Skill copy/sync，不把 architecture/profile/build-vs-buy/candidate_goals 写成 Product AC 或过程计划。

## Evidence

Latest: review-result - OpenNori report and context export now include data.agent_next alongside next_recommendation, so Skills and review tools can use the same deterministic routing surface instead of inferring next actions from report context.
Result: passing
Basis: tool-observation
Reviewability: Rerun the listed checks, then inspect opennori report --json and context export --json for data.agent_next matching the current completion route.
Limitations: This aligns JSON routing surfaces; external tools must still decide how to display or use agent_next without taking over Codex.

Sources:
- npm run typecheck
- npm test -- --run test/cli-commands.test.js test/core.test.js
- src/cli/commands/reporting.ts
- src/lifecycle/context-export.ts
- src/types.ts
- test/core.test.js

## Files

- Criterion source: criteria/AC-Z-12/criterion.json
- Status projection: criteria/AC-Z-12/status.json
- Evidence ledger: criteria/AC-Z-12/evidence
- Artifacts: criteria/AC-Z-12/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
