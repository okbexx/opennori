# AC-P-2 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我运行 opennori check 后，能区分客观状态健康检查和需要 agent 与我复核的 AC 质量判断，而不是以为 CLI 会替我判断 AC 好坏。

Measurement: 对当前 active goal 运行 opennori check --json，并查看 README、AGENTS.md 和 OpenNori packaged Skills 对 AC 质量边界的说明。

Passing threshold: check 只报告 contract/ledger 结构、Architecture Baseline、Profile、build-vs-buy 和 evidence health 等客观状态；不会因为某句自然语言像“修改字段”或“失败时有提示”就生成固定 quality gap；nori / nori-acceptance / nori-reporting Skills 明确要求 agent 自行审查 AC 文字并向用户追问缺失的验收问题。

## Evidence

Latest: protocol-boundary-review - OpenNori check now stays an objective state-health surface: runtime reviewAcceptanceQuality returns a non-authoritative clear compatibility surface, check describes contract structure/architecture/profile/evidence health, README/protocol/AGENTS and packaged Skills assign subjective AC quality to agent/user review, and npm run check passes.
Result: passing
Basis: tool-observation
Reviewability: Rerun npm run check, inspect check JSON for objective acceptance_review summary, and read README/AGENTS plus nori/nori-acceptance/nori-reporting Skills for the agent-side AC quality rules.
Limitations: This proves the OpenNori code and packaged Skills no longer hard-code subjective AC-quality decisions. It does not mean every future agent will ask perfect questions; that remains Skill behavior and user review.

Sources:
- npm run check
- src/acceptance.ts
- src/cli/commands/check.ts
- src/agent-next.ts
- src/core/report.ts
- README.md
- AGENTS.md
- plugins/opennori/skills/nori-acceptance/SKILL.md
- plugins/opennori/skills/nori-reporting/SKILL.md
- plugins/opennori/skills/nori/SKILL.md

## Files

- Criterion source: criteria/AC-P-2/criterion.json
- Status projection: criteria/AC-P-2/status.json
- Evidence ledger: criteria/AC-P-2/evidence
- Artifacts: criteria/AC-P-2/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
