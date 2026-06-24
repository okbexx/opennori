# AC-Z-14 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我让 agent 继续 OpenNori 工作时，不需要每轮都追问下一步是什么；agent 能作为 Loop Engineer 读取当前状态并推进下一轮验收动作。

Measurement: 阅读 nori-loop-engineer packaged Skill、nori 根路由、Plugin prompt、README、protocol、AGENTS 和 status/resume 的 agent_next 输出，并用未完成、阻塞和已完成 goal 检查路由。

Passing threshold: Loop Engineer 以 packaged Skill 形式存在，不是 CLI 命令、plan mode 或任务 runner；它读取 agent_next，按当前缺口路由到 acceptance、architecture、implementation、evidence、profile、reporting、health 或 next-contract 子 Skill，只推进一轮 acceptance loop，并用 Goal / Current gap / Loop type / Action taken / Evidence / Decision / Need user / Next 汇报；遇到 AC approval、architecture confirmation、waiver、install confirmation 或 report acceptance 必须停下来让用户决策。

## Evidence

Latest: review-result - OpenNori continuation is now routed through nori-loop-engineer: the root router maps keep-going requests to a one-loop coordinator that reads agent_next, invokes focused Skills, and stops at user decision boundaries.
Result: passing
Basis: protocol-check
Reviewability: Inspect nori-loop-engineer/SKILL.md for the reply shape and misuse guards, inspect nori/SKILL.md for natural-language routing, inspect README/protocol/AGENTS for user-visible boundaries, and rerun npm run test:docs.
Limitations: This proves Loop Engineer behavior is encoded in packaged Skills and docs; actual live continuation still depends on the user agent loading the updated Plugin cache and applying the Skill in a fresh session.

Sources:
- .opennori/architecture/evidence/ac-z-14-loop-engineer-continuation.json
- npm run test:docs
- plugins/opennori/skills/nori-loop-engineer/SKILL.md
- plugins/opennori/skills/nori/SKILL.md
- README.md
- .opennori/protocol.md
- AGENTS.md
- test/docs-schema.test.js

## Files

- Criterion source: criteria/AC-Z-14/criterion.json
- Status projection: criteria/AC-Z-14/status.json
- Evidence ledger: criteria/AC-Z-14/evidence
- Artifacts: criteria/AC-Z-14/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
