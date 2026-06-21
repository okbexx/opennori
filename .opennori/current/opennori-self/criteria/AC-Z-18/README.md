# AC-Z-18 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我第一次阅读 OpenNori 的 README、官网或 Plugin 说明时，理解 OpenNori 是一个 agent capability bundle：Codex Plugin 负责分发发现，packaged Skills 负责 agent 行为协议，opennori CLI 负责确定性状态读写，.opennori 负责项目状态；我不会被引导把 Plugin、Skills 或 CLI 当成三种可拆开的独立产品路径。

Measurement: 阅读 README Install/Quick Start、官网 Start 区域、Plugin longDescription、nori/nori-project-health Skills、protocol，并检查测试对主路径文案和 Skill 边界的断言。

Passing threshold: 用户主路径表达为安装和使用 OpenNori capability bundle；CLI 被说明为 Skills 使用的 deterministic state layer 和高级/CI 入口，而不是与 Plugin 并列的替代使用方式；文档和 Skill 明确不要继续使用半残模式，缺 Plugin/Skills/CLI/state 任一关键能力时应通过 doctor/health 引导补齐；测试防止重新出现 Choose one path、Try CLI once、Pin CLI to this project 这类拆分心智。

## Evidence

Latest: artifact-review - README now explains that agent_next.candidate_goals is the Skill routing surface for completed-goal continuation, while next_recommendation.candidate_goals remains the fuller report/context explanation surface.
Result: passing
Basis: tool-observation
Reviewability: Rerun npm run check and inspect README/protocol/Skills for the agent_next routing language.
Limitations: This is documentation alignment for the current source package; public website or npm publication are separate release steps.

Sources:
- npm run check
- rg -n 'agent_next.candidate_goals|next_recommendation.candidate_goals|Context export|上下文导出' README.md .opennori/protocol.md plugins/opennori/skills
- README.md
- .opennori/protocol.md
- plugins/opennori/skills/nori/SKILL.md
- plugins/opennori/skills/nori-acceptance/SKILL.md
- plugins/opennori/skills/nori-reporting/SKILL.md

## Files

- Criterion source: criteria/AC-Z-18/criterion.json
- Status projection: criteria/AC-Z-18/status.json
- Evidence ledger: criteria/AC-Z-18/evidence
- Artifacts: criteria/AC-Z-18/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
