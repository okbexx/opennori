# AC-O-8 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我在 Codex 对话里声明必须使用某个 Skill、偏好某个技术栈、避免某个工具或指定安装策略后，agent 能把它记录为项目级 Project Profile，并在当前 goal 完成前告诉我该 goal 是否遵守。

Measurement: 在 Codex 对话中提出能力偏好后，查看 .opennori/profile/、status、report 或 dashboard 的 Project Profile compliance。

Passing threshold: 用户不需要记住 CLI；Project Profile 保存在 .opennori/profile/，不被复制进 Nori Contract 或写成 Product AC；current goal 的 ledger 只记录 profile_evidence；must 或 avoid 的违反会阻止 complete，prefer 作为 review risk 展示；没有 current goal 时可查看/编辑 Project Profile 但不评价合规。

## Evidence

Latest: profile-skill-source-adapter-verification - Project Profile automatic Skill checks now resolve Skills from OpenNori package assets, Codex Plugin cache, and user-local Skill directories while preserving Project Profile as project-level state and current-goal ledger profile evidence only.
Result: passing
Basis: tool-observation
Reviewability: Inspect the new skill-capability adapter and profile checks. Confirm profile checks report basis=skill-capability-source, include source_kind for package/plugin-cache/user Skill sources, record the found path for automatic evidence, and do not implement Codex Skill selection or subjective Skill compliance. Rerun the focused profile/lifecycle adapter tests plus typecheck and lint.
Limitations: This verifies SKILL.md source availability and deterministic Profile compliance routing. It does not prove a future agent actually loaded or followed a Skill; that remains Codex Skill discovery, agent behavior, evidence, and user review.

Sources:
- .opennori/architecture/evidence/opennori-self-ac-o-8-profile-skill-source-adapter.json
- npx vitest run test/profile.test.js test/lifecycle-adapters.test.ts
- npx tsc --noEmit --pretty false
- npm run lint
- src/lifecycle/adapters/skill-capability.ts
- src/lifecycle/profile-checks.ts
- test/lifecycle-adapters.test.ts
- test/profile.test.js
- test/support/cli.js
- .opennori/architecture/decisions/profile-skill-capability-source-adapter.json

## Files

- Criterion source: criteria/AC-O-8/criterion.json
- Status projection: criteria/AC-O-8/status.json
- Evidence ledger: criteria/AC-O-8/evidence
- Artifacts: criteria/AC-O-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
