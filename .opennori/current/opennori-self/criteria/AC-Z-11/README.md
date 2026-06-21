# AC-Z-11 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我卸载 OpenNori 前，能预览将移除什么，并确认默认卸载不会丢失 active goals、证据、报告或归档。

Measurement: 在已安装且有 active goal 的项目中运行 opennori uninstall --dry-run、未确认 uninstall、确认 uninstall 和 include-state uninstall。

Passing threshold: 默认 uninstall plan 标明 entry assets 会被移除、验收状态会被 preserve；未确认真实卸载会失败；确认后只移除入口资产；只有显式 --include-state --confirm 才会删除 .opennori 状态目录。

## Evidence

Latest: review-result - uninstall previews removals, preserves .opennori state by default, and requires explicit --include-state plus --confirm before removing OpenNori state.
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

- Criterion source: criteria/AC-Z-11/criterion.json
- Status projection: criteria/AC-Z-11/status.json
- Evidence ledger: criteria/AC-Z-11/evidence
- Artifacts: criteria/AC-Z-11/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
