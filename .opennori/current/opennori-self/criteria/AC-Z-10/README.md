# AC-Z-10 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我执行可能覆盖已有 OpenNori 入口的安装时，必须先看到预览并显式确认，才能真正写入项目。

Measurement: 在已有 OpenNori 入口的项目中运行 opennori install --force、opennori install --force --dry-run 和确认后的安装。

Passing threshold: 未确认的真实 --force 安装会失败并提示先 dry-run；dry-run 可展示 destructive overwrite；只有带显式确认的 --force 才会执行覆盖写入。

## Evidence

Latest: review-result - destructive install/overwrite flows require a dry-run preview and explicit --confirm before writing, with tests covering confirm_required behavior.
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

- Criterion source: criteria/AC-Z-10/criterion.json
- Status projection: criteria/AC-Z-10/status.json
- Evidence ledger: criteria/AC-Z-10/evidence
- Artifacts: criteria/AC-Z-10/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
