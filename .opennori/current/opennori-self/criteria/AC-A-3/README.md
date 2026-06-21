# AC-A-3 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: high
Required: yes
Risk: high

## Criterion

User story: 作为用户，我可以选择 OpenNori 内置优秀架构 profile，也可以声明自己的项目架构 profile，并让它影响 baseline 和完成判断。

Measurement: 运行 architecture profiles、architecture profile --from 和 architecture baseline --profile。

Passing threshold: 内置 profile 和项目 profile 都能列出；项目 profile 可生成 baseline；技术偏好不会被写成 Product AC。

## Evidence

Latest: verification - Project AGENTS guidance now preserves the architecture artifact boundary: profiles, baselines, decisions, challenges, and apply records each have distinct directories, and invalid architecture evidence routes to project health.
Result: passing
Basis: artifact-review
Reviewability: Inspect AGENTS.md, packaged architecture Skills, README, and protocol for the same directory boundary.
Limitations: This is guidance and state-boundary evidence; it does not judge subjective profile quality.

Sources:
- .opennori/architecture/evidence/ac-a-3-architecture-evidence-boundary.json
- AGENTS.md
- plugins/opennori/skills/nori-architecture-brainstorm/SKILL.md
- plugins/opennori/skills/nori-architecture-apply/SKILL.md
- README.md
- .opennori/protocol.md

## Files

- Criterion source: criteria/AC-A-3/criterion.json
- Status projection: criteria/AC-A-3/status.json
- Evidence ledger: criteria/AC-A-3/evidence
- Artifacts: criteria/AC-A-3/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
