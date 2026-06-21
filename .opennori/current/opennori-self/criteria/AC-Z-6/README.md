# AC-Z-6 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我在项目目录运行 OpenNori 后，能看到 OpenNori 状态集中在 .opennori 目录里，而不是散落到通用 process 目录。

Measurement: 运行 opennori install、draft、brainstorm、report 或 archive 后查看项目目录。

Passing threshold: OpenNori 默认只把协议、active goal、报告、归档和 brainstorm 写入 .opennori；不创建 process/acceptance 或 process/development-protocols。

## Evidence

Latest: review-result - OpenNori install and tests create .opennori active/completed/blocked/reports/brainstorms/architecture directories and do not create a process directory.
Result: passing
Basis: tool-observation
Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and generated report.
Limitations: This is local repository evidence for the current worktree; npm publishing and public site deployment are separate release steps.

Sources:
- npm run check
- node ./bin/opennori.js check --root . --json
- test/core.test.js
- .opennori/protocol.md

## Files

- Criterion source: criteria/AC-Z-6/criterion.json
- Status projection: criteria/AC-Z-6/status.json
- Evidence ledger: criteria/AC-Z-6/evidence
- Artifacts: criteria/AC-Z-6/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
