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

Latest: project-profile-source-directory-verification - OpenNori initializes .opennori/profile/profile.json as the project-level Project Profile source and .opennori/profile/README.md as a generated review surface; goal ledgers store only profile_evidence compliance records.
Result: passing
Basis: tool-observation
Reviewability: Inspect .opennori/profile/profile.json and README.md, lifecycle install actions, manifest managed files, and profile tests. Confirm profile.json is source data, README is generated from it, and current goal ledgers contain only compliance evidence.
Limitations: This verifies project-state initialization and scope boundaries. It does not add Project Profile preferences to this repository; the current Project Profile remains empty until a user or agent records preferences.

Sources:
- node ./bin/opennori.js init --root . --confirm --json
- npm run test:profile
- src/core/profile.ts
- src/lifecycle/install.ts
- src/lifecycle/manifest.ts
- test/cli-lifecycle.test.js
- .opennori/profile/profile.json
- .opennori/profile/README.md

## Files

- Criterion source: criteria/AC-O-8/criterion.json
- Status projection: criteria/AC-O-8/status.json
- Evidence ledger: criteria/AC-O-8/evidence
- Artifacts: criteria/AC-O-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
