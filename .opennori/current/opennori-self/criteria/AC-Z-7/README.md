# AC-Z-7 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我运行 opennori install 后，能看到当前项目的 OpenNori 接入登记信息，并判断版本、托管入口、active goals、Plugin Skill 状态和协议能力是否可信。

Measurement: 运行 opennori install --dry-run 或 opennori install 后查看输出和 .opennori/manifest.json。

Passing threshold: 输出包含 create、skip、overwrite 或 update 语义；manifest 说明 OpenNori 版本、managed files、active goals、plugin 状态、architecture 状态和协议能力；已有用户内容默认不被覆盖。

## Evidence

Latest: review-result - Install dry-run and manifest expose project registration details users can judge: OpenNori version, active goals, managed files, protocol capabilities, architecture directories, and package Plugin state.
Result: passing
Basis: tool-observation
Reviewability: Run install dry-run and inspect .opennori/manifest.json plus manifest/install source.
Limitations: This verifies current local project state; package release validation should rerun after version changes.

Sources:
- node ./bin/opennori.js install --root . --dry-run --json
- .opennori/manifest.json
- src/lifecycle/manifest.ts
- src/lifecycle/install.ts

## Files

- Criterion source: criteria/AC-Z-7/criterion.json
- Status projection: criteria/AC-Z-7/status.json
- Evidence ledger: criteria/AC-Z-7/evidence
- Artifacts: criteria/AC-Z-7/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
