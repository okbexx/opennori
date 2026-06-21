# AC-O-9 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我给 agent 一个粗略 idea 并要求使用 OpenNori autogoal 后，最终看到并批准的是标准 Nori Contract Draft，而不是新的 autogoal 专用产物、MVP/第一版/原型、过程计划或任务列表。

Measurement: 用户在 Codex 对话中说“用 OpenNori autogoal 把这个 idea 变成可验收目标”，agent 读取项目上下文并输出标准 Nori Contract Draft；用户检查 packaged Skills、Plugin manifest、README/protocol 和生成的 draft 形态。

Passing threshold: autogoal 由 packaged Skill 驱动，并明确要求保持用户完整意图、不把大目标降级为 MVP/第一版/原型；输出形态与手动多轮澄清后的 Nori Contract Draft 一致，包含 Goal、用户视角 AC、Measure/Passes when、假设和只影响完成定义的问题；approve 后进入普通 OpenNori current gap/evidence/status/report 生命周期；CLI 只保存标准 draft 或 brief source，不把主观 AC 质量写成硬 validator。

## Evidence

Latest: review-result - OpenNori autogoal is implemented as a packaged Skill-driven convergence mode that outputs the standard Nori Contract Draft. The root and acceptance Skills route rough-idea/autogoal requests to nori-autogoal, the new Skill instructs agents to preserve the full idea and avoid MVP/phase/task-list downgrades, draft --brief renders assumptions and open questions in ordinary acceptance markdown, and README plus the public site explain the user-facing behavior.
Result: passing
Basis: tool-observation
Reviewability: Rerun npm run check in /Users/jarl/code/jarlone/opennori, rerun pnpm build in /Users/jarl/code/jarlone/opennori-site, inspect the packaged nori-autogoal/root/acceptance Skills, and inspect the core.test autogoal brief case showing a normal Nori Contract Draft with assumptions and open questions.
Limitations: This verifies local implementation, packaged Skill behavior text, CLI standard draft rendering, README, and site content. It does not publish a new npm package or deploy the website in this slice, and future agent output quality still depends on the loaded Skill and user approval.

Sources:
- /Users/jarl/code/jarlone/opennori/.opennori/architecture/evidence/ac-o-9-autogoal-standard-contract-draft.json
- npm run check
- pnpm build (opennori-site)
- plugins/opennori/skills/nori-autogoal/SKILL.md
- plugins/opennori/skills/nori/SKILL.md
- plugins/opennori/skills/nori-acceptance/SKILL.md
- src/core/contract.ts
- test/core.test.js
- README.md
- /Users/jarl/code/jarlone/opennori-site/src/pages/index.astro

## Files

- Criterion source: criteria/AC-O-9/criterion.json
- Status projection: criteria/AC-O-9/status.json
- Evidence ledger: criteria/AC-O-9/evidence
- Artifacts: criteria/AC-O-9/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
