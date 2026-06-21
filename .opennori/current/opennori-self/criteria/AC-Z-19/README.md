# AC-Z-19 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我第一次安装 OpenNori 时，只需要运行一个明确的 OpenNori setup 入口，就能预览并确认安装完整 capability bundle：Codex Plugin、packaged Skills、全局 opennori CLI 和当前项目 .opennori 状态；安装后我可以用 opennori init 初始化任意项目，而不需要分别理解插件安装、npm 全局安装和项目状态参数。

Measurement: 在临时项目中运行 opennori setup 的 preview/confirm 路径，查看 README、官网 Start 区域、nori-project-health Skill 和 doctor 输出。

Passing threshold: setup 默认先展示将执行的 Codex Plugin 注册、packaged Skills 检查、全局 CLI 安装、项目初始化和 doctor 检查；未确认不写入；确认后使用官方 codex plugin CLI 注册 Plugin、使用 npm 全局安装 opennori、创建 .opennori 状态并跑 doctor；README/官网把 npx opennori setup 作为首次安装主路径，把手动 codex/npm 命令放在高级或恢复说明中。

## Evidence

Latest: confirmed-init-routing-smoke - Confirmed opennori init on a fresh project creates .opennori state, leaves active goals empty, and returns initialized_no_active_contract with next guidance to turn the stated goal into human-centered AC rather than inspect empty directories or repeat setup.
Result: passing
Basis: tool-observation
Reviewability: Rerun the smoke and confirm .opennori/active is empty but agent_next.state is initialized_no_active_contract with recommended_skill nori-acceptance.
Limitations: This validates local source behavior; published users need the next npm/plugin release to receive the updated routing text.

Sources:
- tmp=$(mktemp -d /tmp/opennori-step2-fix-XXXXXX); node ./bin/opennori.js init --root "$tmp" --confirm --json; node ./bin/opennori.js doctor --root "$tmp" --json
- npm run check
- src/agent-next.ts
- plugins/opennori/skills/nori-project-health/SKILL.md
- plugins/opennori/skills/nori-acceptance/SKILL.md

## Files

- Criterion source: criteria/AC-Z-19/criterion.json
- Status projection: criteria/AC-Z-19/status.json
- Evidence ledger: criteria/AC-Z-19/evidence
- Artifacts: criteria/AC-Z-19/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
