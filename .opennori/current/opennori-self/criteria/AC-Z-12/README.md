# AC-Z-12 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我安装或获取 OpenNori 后，agent 能通过一组职责清晰的 OpenNori Plugin Skills，把自然语言请求稳定映射到验收发现、架构基线、证据、能力偏好、项目健康、报告和下一轮候选目标，而不需要我记住 Skill 名或 CLI 参数。

Measurement: 查看 .codex-plugin/plugin.json、plugins/opennori/skills/nori*/SKILL.md、opennori doctor、opennori status/report/context export，以及典型自然语言场景下的 Skill 路由说明。

Passing threshold: OpenNori Plugin 包含总入口和 acceptance、autogoal、evidence、capability-profile、architecture、project-health、reporting、loop-engineer 子 Skill；install 不把 Skills 复制进用户项目；manifest 记录 plugin；doctor 能报告 packaged Skills 是否可用。

## Evidence

Latest: user-content-layering-verification - OpenNori public docs, runtime human output, agent protocol payloads, and maintainer guidance are now separated so users can start from setup/init and natural-language agent prompts without learning internal agent_next, Plugin cache, or full CLI parameter surfaces. Root help shows common user commands, --help --advanced exposes the full agent/automation command tree, setup/init TTY output removes agent-facing 'show this to the user' wording and deduplicates Next, dashboard suggested replies follow contract presentation language, README/site copy avoids exposing protocol internals in the first-screen user path, and AGENTS records the four-layer content boundary for maintainers.
Result: passing
Basis: tool-observation
Reviewability: Run the listed commands, inspect root help and setup/init TTY output, then review README/site first-screen copy and AGENTS content-layer rules. Confirm that public user surfaces avoid agent protocol terms while --json and advanced docs retain deterministic agent/tool routing.
Limitations: This verifies the local source checkout and staged website content. It does not publish npm or deploy the public site, and it does not prove every future agent reply will maintain the boundary without Skill/dogfood review.

Sources:
- npm run build
- npx vitest run test/cli-human-output.test.js
- npm run test:lifecycle
- npm run test:dashboard
- pnpm build (opennori-site)
- script -q /dev/null node ./bin/opennori.js --help
- script -q /dev/null node ./bin/opennori.js setup
- README.md
- AGENTS.md
- src/cli/human-output.ts
- src/cli/resolver.ts
- src/dashboard/src/dashboard-view.ts
- test/cli-human-output.test.js
- test/lifecycle.test.js
- test/dashboard-selection.test.ts
- ../opennori-site/src/pages/index.astro
- ../opennori-site/src/pages/skills.astro

## Files

- Criterion source: criteria/AC-Z-12/criterion.json
- Status projection: criteria/AC-Z-12/status.json
- Evidence ledger: criteria/AC-Z-12/evidence
- Artifacts: criteria/AC-Z-12/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
