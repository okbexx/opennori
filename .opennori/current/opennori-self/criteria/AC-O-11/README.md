# AC-O-11 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我给 agent 一个包含页面、应用、Dashboard、Desktop、工作台、表单或其他可见交互界面的目标时，OpenNori 能引导 agent 自动挖掘 UI/UX 体验验收，而不是只生成数据、状态或功能完成 AC。

Measurement: 阅读 nori、nori-acceptance、nori-autogoal packaged Skills、OpenNori protocol、README 和自验收报告，并用界面类目标检查 agent 应追问或补齐哪些体验维度。

Passing threshold: Skills 明确要求界面类目标覆盖入口与导航、信息层级、空态/加载/错误/成功状态、操作反馈、可读性、视觉一致性、恢复路径和不应暴露的 UI 边界；这些要求以 agent 行为协议和用户确认表达，不写成 CLI hard validator 或固定词表测试。

## Evidence

Latest: review-result - OpenNori now directs visible interface goals through UI/UX acceptance discovery as packaged Skill behavior rather than CLI subjective validation. The root nori Skill routes missing UI/UX AC and interface-only functional AC back to nori-acceptance; nori-acceptance requires agent/user discovery for interface entry, navigation, hierarchy, states, feedback, readability, consistency, recovery, and UI boundaries; nori-autogoal includes the same UX acceptance dimensions when deriving a standard Nori Contract Draft from a rough interface idea. README, AGENTS, protocol, self contract, and the website explain the behavior, and objective tests verify the packaged Skill assets and AC-O-11 without encoding a UI-quality word list.
Result: passing
Basis: tool-observation
Reviewability: Inspect the referenced Skills and docs for the agent behavior protocol, inspect examples/opennori-self.json for AC-O-11, rerun the targeted Vitest command and git diff --check in the OpenNori repo, then run pnpm build in opennori-site to verify the public messaging compiles.
Limitations: This proves OpenNori's packaged capability now instructs agents to discover UI/UX acceptance for visible interface goals and keeps that judgment outside CLI hard validators. It does not prove every future agent will ask perfect UX questions; users still approve or revise each Nori Contract.

Sources:
- .opennori/architecture/evidence/ac-o-11-visible-interface-ux-discovery.json
- npx vitest run test/core.test.js -t "Codex Plugin manifest exposes OpenNori Skills for agent discovery|protocol v1 example contains concrete user tool operations"
- git diff --check
- pnpm build (in /Users/jarl/code/jarlone/opennori-site)
- plugins/opennori/skills/nori/SKILL.md
- plugins/opennori/skills/nori-acceptance/SKILL.md
- plugins/opennori/skills/nori-autogoal/SKILL.md
- .opennori/protocol.md
- README.md
- AGENTS.md
- examples/opennori-self.json
- test/core.test.js
- /Users/jarl/code/jarlone/opennori-site/src/pages/index.astro

## Files

- Criterion source: criteria/AC-O-11/criterion.json
- Status projection: criteria/AC-O-11/status.json
- Evidence ledger: criteria/AC-O-11/evidence
- Artifacts: criteria/AC-O-11/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
