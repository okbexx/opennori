# AC-Z-9 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我预览 OpenNori 安装时，能判断每个项目入口会被创建、跳过、更新还是覆盖，并确认 dry-run 不会写入项目。

Measurement: 运行 opennori install --dry-run，查看 install plan，再检查项目文件是否未被写入。

Passing threshold: install plan 对每个入口显示 action、kind、managed、would_write、will_write、destructive 和 reason；dry-run 下 will_write 为 0；覆盖类动作必须被标记为 destructive。

## Evidence

Latest: review-result - install dry-run reports create/exists/skip/update/overwrite actions with will_write, would_write, destructive, managed, and reason fields while writing nothing.
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

- Criterion source: criteria/AC-Z-9/criterion.json
- Status projection: criteria/AC-Z-9/status.json
- Evidence ledger: criteria/AC-Z-9/evidence
- Artifacts: criteria/AC-Z-9/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
