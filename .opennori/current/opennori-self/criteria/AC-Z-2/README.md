# AC-Z-2 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我运行 opennori install 后，能把 OpenNori 放入当前项目的可用入口，并且不会意外覆盖已有内容。

Measurement: 在一个已有项目中运行安装入口并查看安装结果。

Passing threshold: 安装前能看到将创建或跳过的入口；已有内容默认不被覆盖；失败时说明用户需要做什么。

## Evidence

Latest: review-result - Install preview only manages OpenNori project state: .opennori directories, protocol, guide, manifest, agent routes, and architecture directories are create/skip/update actions, with no destructive writes unless explicitly confirmed.
Result: passing
Basis: tool-observation
Reviewability: Run install dry-run and inspect install_plan actions plus lifecycle install tests.
Limitations: Dry-run proves the plan surface; actual overwrite paths still require explicit confirmation and should be retested in fixture projects.

Sources:
- node ./bin/opennori.js install --root . --dry-run --json
- src/lifecycle/install.ts
- src/lifecycle/managed-files.ts
- test/core.test.js
- .opennori/protocol.md

## Files

- Criterion source: criteria/AC-Z-2/criterion.json
- Status projection: criteria/AC-Z-2/status.json
- Evidence ledger: criteria/AC-Z-2/evidence
- Artifacts: criteria/AC-Z-2/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
