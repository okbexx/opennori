# AC-O-13 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: high
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我用 OpenNori autogoal 定义完整产品、完整 Dashboard 或完整工作台时，agent 在写入 Nori Contract Draft 前会先做验收面覆盖自检，并把独立用户判断面拆成独立 AC，而不是把项目概览、资产、记忆、能力、知识库、检索、审计、UI 状态和恢复路径压进少量大 AC。

Measurement: 阅读 nori、nori-acceptance、nori-autogoal packaged Skills、本机开发 Skills、OpenNori protocol、README、官网和测试资产；用 AW 完整项目工作台提示词检查 agent 是否会先列出 coverage map，再生成足够细分的标准 Nori Contract Draft。

Passing threshold: Skills 明确要求完整产品类 autogoal 在 draft 前执行 coverage self-check，覆盖用户角色、入口/导航、项目列表与切换、核心对象列表与详情、只读预览、状态与空态/加载/错误/成功、来源/审计、记忆、能力、外部知识库、检索、权限/安全边界、持久化、失败恢复和最终 review/report；如果一条 AC 混入多个独立用户判断面，agent 必须拆分或标为需修订；旧的压缩 draft 不能被 approve，应重新生成。该规则仍属于 Skill 行为协议、用户确认和资产测试，不写成 CLI hard validator 或自然语言质量词表。

## Evidence

Latest: review-result - OpenNori now requires complete-product autogoal coverage self-check before draft approval through packaged Skills, local development Skills, protocol, docs, website copy, and asset tests. The rules tell agents to map user-visible surfaces to planned AC boundaries, split unrelated user judgments, and route compressed drafts back to acceptance revision instead of asking for approval.
Result: passing
Basis: tool-observation
Reviewability: Review the referenced packaged Skills, local development Skills, protocol, README, AGENTS, self example, tests, website copy, and synced plugin cache. Rerun the targeted Vitest command, npm run check, plugin cache rg check, and opennori-site pnpm build.
Limitations: This proves OpenNori capability assets and local plugin cache now instruct agents to run coverage self-check and split complete-product AC before approval. It intentionally does not add CLI subjective AC quality scoring, and future draft quality still depends on the loaded Skill and user approval.

Sources:
- .opennori/architecture/evidence/ac-o-13-autogoal-coverage-self-check.json
- npx vitest run test/core.test.js -t 'protocol v1 example contains concrete user tool operations|Codex Plugin manifest exposes OpenNori Skills for agent discovery'
- npm run check
- node ./bin/opennori.js plugin sync --local --confirm --json
- rg -n 'coverage self-check|coverage map|independent user judgment|bundles unrelated surfaces|覆盖面自检' /Users/jarl/.codex/plugins/cache/opennori/opennori/0.1.9/skills
- pnpm build in /Users/jarl/code/jarlone/opennori-site
- plugins/opennori/skills/nori/SKILL.md
- plugins/opennori/skills/nori-acceptance/SKILL.md
- plugins/opennori/skills/nori-autogoal/SKILL.md
- /Users/jarl/code/jarlone/.agents/skills/nori/SKILL.md
- /Users/jarl/code/jarlone/.agents/skills/nori-acceptance/SKILL.md
- /Users/jarl/code/jarlone/.agents/skills/nori-autogoal/SKILL.md
- .opennori/protocol.md
- README.md
- AGENTS.md
- examples/opennori-self.json
- test/core.test.js
- /Users/jarl/code/jarlone/opennori-site/src/pages/index.astro

## Files

- Criterion source: criteria/AC-O-13/criterion.json
- Status projection: criteria/AC-O-13/status.json
- Evidence ledger: criteria/AC-O-13/evidence
- Artifacts: criteria/AC-O-13/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
