# opennori-self Acceptance Report

## Decision Summary

Completion: Complete: all required acceptance criteria have passing or waived evidence.
Objective complete: yes
Confidence: confident
Review risks: none
Current gap: None. All required acceptance criteria have passing or waived evidence.
User intervention: No user intervention is currently required.
Recommended next action: This OpenNori goal is complete. If the user has asked to continue, the agent should prepare the next human-facing NoriBrief from current context and user intent.
Workflow status: complete

## Goal

让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。

## Acceptance Basis

Status: approved
Summary: Refresh completion judgment evidence to Project Profile terminology.

## Project Profile Compliance

<none>

## Acceptance Status

| ID | Layer | Status | Confidence | Evidence | Basis |
| --- | --- | --- | --- | --- | --- |
| AC-P-1 | protocol | passing | verified | project-profile-report-surface-review: Active Nori Contract dossier shows goal, layered criteri… | tool-observation |
| AC-P-2 | protocol | passing | verified | protocol-boundary-review: OpenNori check now stays an objective state-health surface: runtime r… | tool-observation |
| AC-P-3 | protocol | passing | verified | review-result: opennori next/status return current_gap, completion answer, intervention, archit… | tool-observation |
| AC-P-4 | protocol | passing | verified | review-result: High-risk passing evidence now preserves the agent-submitted objective result wh… | tool-observation |
| AC-P-5 | protocol | passing | verified | project-profile-report-rendering-review: OpenNori report leads with decision summary, goal, acc… | tool-observation |
| AC-P-6 | protocol | passing | verified | review-result: Report and status expose evidence kind, basis, confidence, sources, reviewabilit… | tool-observation |
| AC-P-7 | protocol | passing | verified | review-result: Evidence sources remain flexible but reviewable: commands, artifacts, URLs, path… | tool-observation |
| AC-P-8 | protocol | passing | verified | review-result: Evidence basis distinguishes tool observations, artifact reviews, protocol check… | tool-observation |
| AC-P-9 | protocol | passing | verified | review-result: Evidence records and reports show reviewability and limitations, and evidence_he… | tool-observation |
| AC-P-10 | protocol | passing | verified | review-result: A single AC can carry multiple evidence sources without fixed adapters; the CLI… | tool-observation |
| AC-P-11 | protocol | passing | verified | review-result: OpenNori Skills tell agents how to map natural language evidence requests to ope… | tool-observation |
| AC-P-12 | protocol | passing | verified | skill-boundary-review: Existing-project AC review is now Skill-driven rather than a CLI word-li… | tool-observation |
| AC-P-13 | protocol | passing | verified | review-result: Acceptance report starts with Decision Summary before the detailed AC table, the… | tool-observation |
| AC-O-1 | operator | passing | verified | acceptance-draft-guard-review: A natural-language goal no longer becomes a blindly approvable g… | tool-observation |
| AC-O-2 | operator | passing | verified | review-result: Approval and criterion update flows preserve the acceptance basis and keep compl… | tool-observation |
| AC-O-3 | operator | passing | verified | review-result: resume/status recover active goals from .opennori active files, including curren… | tool-observation |
| AC-O-4 | operator | passing | verified | completion-judgment-project-profile-review: When the user asks if work is done, status/report a… | tool-observation |
| AC-O-5 | operator | passing | verified | review-result: Blocked criteria and violated required profile items produce intervention.requir… | tool-observation |
| AC-O-6 | operator | passing | verified | review-result: criterion update rewrites the user-facing AC, clears stale criterion evidence, p… | tool-observation |
| AC-O-7 | operator | passing | verified | review-result: brainstorm produces selectable acceptance directions with user value, observable… | tool-observation |
| AC-O-8 | operator | passing | verified | project-profile-source-directory-verification: OpenNori initializes .opennori/profile/profile.j… | tool-observation |
| AC-Z-1 | productization | passing | verified | review-result: OpenNori exposes package-local Codex Plugin Skills for agent discovery: the mark… | tool-observation |
| AC-Z-2 | productization | passing | verified | review-result: Install preview only manages OpenNori project state: .opennori directories, prot… | tool-observation |
| AC-Z-3 | productization | passing | verified | review-result: changes groups .opennori/examples acceptance artifacts separately from implement… | tool-observation |
| AC-Z-4 | productization | passing | verified | review-result: list shows multiple active OpenNori goals and resume requires explicit --goal wh… | tool-observation |
| AC-Z-5 | productization | passing | verified | review-result: archive moves complete or blocked goals out of active into completed/blocked whi… | tool-observation |
| AC-Z-6 | productization | passing | verified | review-result: OpenNori install and tests create .opennori active/completed/blocked/reports/bra… | tool-observation |
| AC-Z-7 | productization | passing | verified | review-result: Install dry-run and manifest expose project registration details users can judge… | tool-observation |
| AC-Z-8 | productization | passing | verified | status-no-current-recovery: OpenNori status/resume/report now return routeable no-current-goal… | tool-observation |
| AC-Z-9 | productization | passing | verified | review-result: install dry-run reports create/exists/skip/update/overwrite actions with will_wr… | tool-observation |
| AC-Z-10 | productization | passing | verified | review-result: destructive install/overwrite flows require a dry-run preview and explicit --con… | tool-observation |
| AC-Z-11 | productization | passing | verified | review-result: uninstall previews removals, preserves .opennori state by default, and requires… | tool-observation |
| AC-Z-12 | productization | passing | verified | review-result: OpenNori report and context export now include data.agent_next alongside next_re… | tool-observation |
| AC-Z-13 | productization | passing | high | verification: Doctor/check/report now expose invalid architecture evidence files with a concret… | tool-observation |
| AC-Z-14 | productization | passing | verified | review-result: agent_next now carries candidate_goals for ready_for_next_loop, including draft_… | tool-observation |
| AC-Z-15 | productization | passing | verified | review-result: evidence add accepts source, source-command, source-path, and source-url flags s… | tool-observation |
| AC-Z-16 | productization | passing | high | local-global-bin-link-fix: Dogfood found npm link created a global opennori command pointing at… | tool-observation |
| AC-Z-17 | productization | passing | verified | review-result: README and website quickstart lead with short commands: try once with npx openno… | tool-observation |
| AC-A-1 | architecture | passing | verified | review-result: OpenNori now routes agents to architecture review before non-trivial implementat… | tool-observation |
| AC-A-2 | architecture | passing | verified | review-result: Evidence add now returns next_recommendation and agent_next, so agents can route… | tool-observation |
| AC-A-3 | architecture | passing | high | verification: Project AGENTS guidance now preserves the architecture artifact boundary: profile… | artifact-review |
| AC-A-4 | architecture | passing | verified | test-summary: Architecture Challenge command records evidence-backed baseline conflicts and mar… | tool-observation |
| AC-A-5 | architecture | passing | verified | review-result: Status, report, and context export now pass ArchitectureState into completionAns… | tool-observation |
| AC-A-6 | architecture | passing | verified | review-result: opennori check/report/context export are clean for opennori-self after architect… | tool-observation |
| AC-A-7 | architecture | passing | verified | review-result: Unhealthy build-vs-buy decisions now appear as build_vs_buy review risks in comp… | tool-observation |
| AC-A-8 | architecture | passing | verified | core-review-projection-boundary-refactor: OpenNori now has a core ReviewState projection shared… | tool-observation |
| AC-A-9 | architecture | passing | verified | artifact-review: README, protocol, package Skills, and website describe OpenNori as Product AC… | tool-observation |
| AC-A-10 | architecture | passing | verified | dogfood-result: OpenNori was dogfooded in the separate opennori-site repo under the current Plu… | tool-observation |
| AC-Z-18 | productization | passing | verified | artifact-review: README now explains that agent_next.candidate_goals is the Skill routing surfa… | tool-observation |
| AC-Z-19 | productization | passing | verified | confirmed-init-routing-smoke: Confirmed opennori init on a fresh project creates .opennori stat… | tool-observation |
| AC-Z-20 | productization | passing | verified | behavior-test: Draft Nori Contracts now keep workflow status as draft until user approval; temp… | protocol-check |
| AC-D-1 | acceptance | passing | verified | dashboard-outcome-hud-verification: Dashboard first screen now leads with Outcome Overview, Dec… | tool-observation |
| AC-D-2 | acceptance | passing | verified | dashboard-activity-workflow: OpenNori now gives Skills a dashboard_activity routing surface, le… | tool-observation |
| AC-D-3 | acceptance | passing | verified | dashboard-execution-presence-review: Dashboard event focus now follows execution-relevant OpenN… | tool-observation |
| AC-D-4 | acceptance | passing | verified | dashboard-observation-boundary: Dashboard now presents user intervention as an agent-conversati… | tool-observation |
| AC-Z-21 | productization | passing | verified | project-profile-language-boundary-review: OpenNori preserves language preference across user-re… | tool-observation |
| AC-O-9 | operator | passing | verified | review-result: OpenNori autogoal is implemented as a packaged Skill-driven convergence mode tha… | tool-observation |
| AC-O-10 | operator | passing | verified | review-result: OpenNori now supports adopting an in-progress AC discussion as a standard draft… | tool-observation |
| AC-O-11 | operator | passing | verified | review-result: OpenNori now directs visible interface goals through UI/UX acceptance discovery… | tool-observation |
| AC-O-12 | operator | passing | high | review-result: OpenNori now instructs agents to expand complete product, complete feature, full… | artifact-review |
| AC-O-13 | operator | passing | high | review-result: OpenNori now requires complete-product autogoal coverage self-check before draft… | tool-observation |
| AC-A-11 | architecture | passing | verified | review-result: OpenNori now records Architecture Requirement as explicit agent/user state and n… | tool-observation |
| AC-A-12 | architecture | passing | verified | review-result: OpenNori validation is split into layered Vitest tags and npm scripts: npm test/… | tool-observation |
| AC-O-14 | operator | passing | verified | review-result: AC Review Loop now documents and tests the safe draft criterion add path, preven… | artifact-review |
| AC-O-15 | operator | passing | high | asset-review: Enhanced autogoal discovery is documented as nori-autogoal Skill behavior and sur… | artifact_review |
| AC-O-16 | operator | passing | high | review-result: Enhanced autogoal now leaves a user-visible confirmation surface: Skill replies… | tool-observation |
| AC-O-17 | operator | passing | verified | draft-revision-boundary-verification: Draft criterion revision remains goal-dossier state while… | tool-observation |
| AC-O-18 | operator | passing | high | review-result: Acceptance Surface Modeling now covers all OpenNori packaged Skill bodies and fr… | tool-observation |
| AC-D-5 | acceptance | passing | verified | dashboard-project-profile-verification: Dashboard now exposes Project Profile as a readonly pro… | tool-observation |
| AC-P-14 | protocol | passing | verified | report-rendering-test: OpenNori report rendering now keeps the Acceptance Status table compact… | tool-observation |
| AC-P-15 | protocol | passing | verified | test-system-refactor-review: OpenNori test coverage has been reorganized around objective proto… | tool-observation |
| AC-P-16 | protocol | passing | verified | protocol-dashboard-review: Dashboard status projection now uses the goal dossier model directly… | tool-observation |

## Acceptance Details

### AC-P-1

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在编辑器或文件浏览器里打开 active Nori Contract 后，能在 60 秒内看懂目标、分层验收标准、每条状态和当前缺口。
- Measurement: 打开 .opennori/active/<goal>.acceptance.md 并阅读。
- Passing threshold: 不读聊天历史、不读实现说明，60 秒内能判断任务在验收层面的状态和下一条缺口。
- Evidence: project-profile-report-surface-review: Active Nori Contract dossier shows goal, layered criteria,
  criterion statuses, Project Profile compliance, and the current rule in one readable review surface.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-21T13:34:19.202Z
- Sources:
  - type=command, label=node ./bin/opennori.js status --root . --json, command=node ./bin/opennori.js status --root
    . --json
  - type=artifact, label=.opennori/current/opennori-self/README.md, path=.opennori/current/opennori-self/README.md
  - type=artifact, label=.opennori/current/opennori-self/contract.json,
    path=.opennori/current/opennori-self/contract.json
  - type=artifact, label=.opennori/current/opennori-self/ledger.json,
    path=.opennori/current/opennori-self/ledger.json
- Reviewability: Open .opennori/current/opennori-self/README.md and confirm the readable contract surface leads with
  goal, criteria, status, Project Profile compliance, and current gap/rule without requiring chat
  history.
- Limitations: This verifies the generated active goal dossier and status projection. It does not replace user
  review of whether future contract prose is sufficiently detailed.

### AC-P-2

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我运行 opennori check 后，能区分客观状态健康检查和需要 agent 与我复核的 AC 质量判断，而不是以为 CLI 会替我判断 AC 好坏。
- Measurement: 对当前 active goal 运行 opennori check --json，并查看 README、AGENTS.md 和 OpenNori packaged Skills 对 AC
  质量边界的说明。
- Passing threshold: check 只报告 contract/ledger 结构、Architecture Baseline、Profile、build-vs-buy 和 evidence health
  等客观状态；不会因为某句自然语言像“修改字段”或“失败时有提示”就生成固定 quality gap；nori / nori-acceptance / nori-reporting Skills
  明确要求 agent 自行审查 AC 文字并向用户追问缺失的验收问题。
- Evidence: protocol-boundary-review: OpenNori check now stays an objective state-health surface: runtime
  reviewAcceptanceQuality returns a non-authoritative clear compatibility surface, check describes
  contract structure/architecture/profile/evidence health, README/protocol/AGENTS and packaged Skills
  assign subjective AC quality to agent/user review, and npm run check passes.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-18T02:52:27.180Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=artifact, label=src/acceptance.ts, path=src/acceptance.ts
  - type=artifact, label=src/cli/commands/check.ts, path=src/cli/commands/check.ts
  - type=artifact, label=src/agent-next.ts, path=src/agent-next.ts
  - type=artifact, label=src/core/report.ts, path=src/core/report.ts
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=AGENTS.md, path=AGENTS.md
  - type=artifact, label=plugins/opennori/skills/nori-acceptance/SKILL.md,
    path=plugins/opennori/skills/nori-acceptance/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-reporting/SKILL.md,
    path=plugins/opennori/skills/nori-reporting/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
- Reviewability: Rerun npm run check, inspect check JSON for objective acceptance_review summary, and read
  README/AGENTS plus nori/nori-acceptance/nori-reporting Skills for the agent-side AC quality rules.
- Limitations: This proves the OpenNori code and packaged Skills no longer hard-code subjective AC-quality
  decisions. It does not mean every future agent will ask perfect questions; that remains Skill
  behavior and user review.

### AC-P-3

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我运行 opennori next 或 opennori status 后，看到的是当前验收缺口和完成判断，而不是任务步骤列表。
- Measurement: 运行 opennori next/status 并查看返回的 current_gap、completion 和 intervention。
- Passing threshold: 输出默认回答“当前差哪条 AC、是否完成、是否需要人类动作”，不把过程任务当作主线。
- Evidence: review-result: opennori next/status return current_gap, completion answer, intervention,
  architecture, and next_recommendation instead of a process-step list.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:15.023Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-P-4

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我查看高风险 AC 的状态时，能看到 agent 自我总结或弱证据即使被记录为 passing，也不会让 OpenNori 给出无风险的确信完成结论。
- Measurement: 给 high risk AC 添加只有 agent summary 的 passing 证据，再查看 status、check 或 report。
- Passing threshold: 高风险 AC 的证据记录保持 agent 提交的客观 result，但 CLI 必须暴露 review risk、confidence 或 evidence_health
  警告，让用户知道还需要可复查来源、人类确认、限制说明或 waiver；CLI 不用硬编码强弱词表直接替用户裁判主观充分性。
- Evidence: review-result: High-risk passing evidence now preserves the agent-submitted objective result while
  exposing review risk through confidence and evidence_health instead of hard-downgrading by a fixed
  strong/weak evidence list. Evidence health also treats non-context custom sources such as
  screenshot, diff, log, command, artifact, URL, label, and summary-bearing sources as reviewable, so
  agent evidence remains flexible while context-only architecture sources still cannot prove Product
  AC by themselves.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-19T05:05:19.709Z
- Sources:
  - type=architecture-apply, label=ac-p-4-high-risk-review-risk-boundary,
    path=.opennori/architecture/evidence/ac-p-4-high-risk-review-risk-boundary.json, summary=Architecture Baseline
    alignment context. This is not Product AC evidence by itself., role=context
  - type=command, label=npm run typecheck, command=npm run typecheck
  - type=command, label=npx vitest run test/core.test.js, command=npx vitest run test/core.test.js
  - type=command, label=npx vitest run test/core.test.js --testNamePattern 'evidence health|flexible reviewable
    sources|custom non-context source|high-risk agent observation', command=npx vitest run test/core.test.js
    --testNamePattern 'evidence health|flexible reviewable sources|custom non-context source|high-risk agent
    observation'
  - type=command, label=npx vitest run test/cli-commands.test.js --testNamePattern dashboard, command=npx vitest run
    test/cli-commands.test.js --testNamePattern dashboard
  - type=command, label=rg -n 'PRODUCT_EVIDENCE_SOURCE_TYPES|strong-evidence-required|DEFAULT_CRITERIA|DISCOVERY_GAP
    S|BRAINSTORM_CANDIDATES|draft --goal|--from-discovery|--from-brainstorm|--from-next-candidate' src test
    plugins/opennori/skills README.md .opennori/protocol.md AGENTS.md, command=rg -n
    'PRODUCT_EVIDENCE_SOURCE_TYPES|strong-evidence-required|DEFAULT_CRITERIA|DISCOVERY_GAPS|BRAINSTORM_CANDIDATES|dr
    aft --goal|--from-discovery|--from-brainstorm|--from-next-candidate' src test plugins/opennori/skills README.md
    .opennori/protocol.md AGENTS.md
  - type=artifact, label=src/core/evidence.ts, path=src/core/evidence.ts
  - type=artifact, label=src/core/report.ts, path=src/core/report.ts
  - type=artifact, label=src/agent-next.ts, path=src/agent-next.ts
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=plugins/opennori/skills/nori-evidence/SKILL.md,
    path=plugins/opennori/skills/nori-evidence/SKILL.md
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run the listed typecheck, Vitest, and rg commands; inspect src/core/evidence.ts for objective
  risk-gate/evidence-health behavior and test/core.test.js for high-risk and custom source coverage.
- Limitations: This verifies the CLI boundary and evidence-health state behavior in the local worktree. It does not
  prove future agents will choose strong enough evidence; Skills and user review still decide
  subjective sufficiency.

### AC-P-5

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我运行 opennori report 后，能看到目标、分层 AC 状态、证据摘要、当前缺口、是否需要我介入和结论。
- Measurement: 运行 opennori report 或让 Codex 生成 OpenNori 报告。
- Passing threshold: 报告默认围绕验收状态和证据组织，不把过程任务当作主线。
- Evidence: project-profile-report-rendering-review: OpenNori report leads with decision summary, goal,
  acceptance basis, Project Profile Compliance, acceptance status, evidence health, user intervention,
  and conclusion.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-21T13:34:39.553Z
- Sources:
  - type=command, label=node ./bin/opennori.js report --root . --json, command=node ./bin/opennori.js report --root
    . --json
  - type=artifact, label=src/core/report.ts, path=src/core/report.ts
  - type=artifact, label=.opennori/reports/opennori-self.report.md, path=.opennori/reports/opennori-self.report.md
- Reviewability: Run opennori report and inspect the generated Markdown. Confirm it separates Product acceptance,
  Project Profile Compliance, Architecture Baseline, evidence health, user intervention, and final
  conclusion without making process tasks the main storyline.
- Limitations: This verifies current report structure and terminology. It does not prove every future report will
  have ideal natural-language wording.

### AC-P-6

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我查看 OpenNori 报告时，能知道每条通过、阻塞或豁免的 AC 是基于什么证据判断的。
- Measurement: 给 AC 添加不同来源的证据后运行 opennori report 或 opennori status。
- Passing threshold: 报告或状态输出展示证据摘要、判断基础、证据强度和剩余限制；不会只显示 agent 自我结论。
- Evidence: review-result: Report and status expose evidence kind, basis, confidence, sources, reviewability,
  limitations, and gate for passing, blocked, and waived criteria.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:15.176Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-P-7

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我不需要限制 agent 使用哪种取证工具，但我能复查 agent 引用的证据来源。
- Measurement: 让 agent 用任意验证方式完成一条 AC，并查看该 AC 的证据来源。
- Passing threshold: 证据来源可以是命令、产物、URL、截图、diff、人类确认或其他引用；每个来源都包含用户可理解的 label 或复查线索。
- Evidence: review-result: Evidence sources remain flexible but reviewable: commands, artifacts, URLs, paths,
  and arbitrary source metadata are preserved and shown in status/report.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:15.227Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-P-8

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我能区分证据是来自工具观察、人类确认、产物审查、协议校验，还是 agent 的判断。
- Measurement: 给不同 basis 的证据运行 status/report。
- Passing threshold: 输出明确展示证据 basis；agent 判断可以记录，但不会伪装成工具验证或人类确认。
- Evidence: review-result: Evidence basis distinguishes tool observations, artifact reviews, protocol checks,
  human confirmations, and agent observations in status/report/context export.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:15.379Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-P-9

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我能看到证据的复查方式和限制，而不是只看到通过结论。
- Measurement: 添加带复查说明和限制说明的证据后运行 report。
- Passing threshold: 报告展示 reviewability 和 limitations；限制不会被隐藏在实现日志里。
- Evidence: review-result: Evidence records and reports show reviewability and limitations, and evidence_health
  warns when those fields are missing before confident completion.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:15.435Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-P-10

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我能看到一条 AC 可以由多个证据来源共同支撑，而不要求 agent 把它们拆成固定适配器。
- Measurement: 为一条 AC 添加包含多个来源的证据后查看 evidence record 和 report。
- Passing threshold: 同一条证据可以包含多个 sources；报告能合并展示这些来源，并保留 agent 的自由取证空间。
- Evidence: review-result: A single AC can carry multiple evidence sources without fixed adapters; the CLI
  preserves command, artifact, URL, path, and custom metadata sources.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:15.489Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-P-11

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在 Codex 对话中说“把这次验证作为证据”后，agent 能按 OpenNori 结构记录，而不要求我记住 CLI 参数。
- Measurement: 查看 OpenNori Skill 导出的证据记录说明，并检查 agent 使用自然语言到 CLI 的映射。
- Passing threshold: Skill 明确要求 agent 自由选择验证方式，但记录证据时说明 basis、sources、reviewability、confidence 和 limitations。
- Evidence: review-result: OpenNori Skills tell agents how to map natural language evidence requests to opennori
  evidence add with basis, sources, reviewability, confidence, and limitations.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:15.541Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-P-12

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我让 agent 升级或继续一个已经使用 OpenNori 的项目时，能看到 agent 会用 OpenNori Skills 复核旧 AC 是否仍足够可验收，但项目状态检查不会把主观 AC
  质量写成硬编码 CLI 裁判。
- Measurement: 查看 opennori upgrade/check 的项目状态输出、nori-acceptance Skill、nori-reporting Skill、README 和测试，确认旧 contract
  不被自动改写，主观 AC 复核由 agent 提问和用户确认完成。
- Passing threshold: upgrade/check 保留并报告现有 contract/evidence/report 状态，不因固定词表重写或 hard-fail 旧 AC；测试不再断言某句自然语言必须触发特定 gap id
  或问题文本；Skills 明确要求 agent 对“修改字段”“整体情况”“长期资产”等含糊表述追问具体入口、对象、规则、状态、失败恢复和边界。
- Evidence: skill-boundary-review: Existing-project AC review is now Skill-driven rather than a CLI word-list
  audit: tests no longer assert natural-language ACs must trigger fixed gap ids/questions; discover
  tests only cover question-source state; project-health, acceptance, reporting, root Skills, AGENTS,
  README, and protocol tell agents to inspect vague old ACs and ask user-facing questions without
  mutating existing contracts.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-18T02:52:39.807Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=plugins/opennori/skills/nori-project-health/SKILL.md,
    path=plugins/opennori/skills/nori-project-health/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-acceptance/SKILL.md,
    path=plugins/opennori/skills/nori-acceptance/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-reporting/SKILL.md,
    path=plugins/opennori/skills/nori-reporting/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=examples/opennori-self.json, path=examples/opennori-self.json
- Reviewability: Rerun npm run check, inspect discovery/check tests for objective assertions only, and read the
  packaged Skills to verify agent-side rules for reviewing vague existing ACs.
- Limitations: This protects OpenNori from hard-coded subjective AC-quality tests and validators. Real old-project
  AC revision still depends on the agent loading the Skills and the user confirming the revised
  contract.

### AC-P-13

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我打开 opennori report 后，能先看到完成结论、当前缺口和是否需要我介入，再查看详细 AC 表格。
- Measurement: 运行 opennori report 并阅读报告顶部内容，再向下查看 Acceptance Status 表格。
- Passing threshold: 报告在详细表格前显示 Decision Summary，包含 completion、current gap、user intervention 和 workflow status；blocked
  报告也先显示需要用户采取的动作。
- Evidence: review-result: Acceptance report starts with Decision Summary before the detailed AC table, then
  includes Evidence Health before user intervention and conclusion.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:15.593Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-O-1

- Layer: operator
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在 Codex 对话里说“用 OpenNori 跑这个任务：目标是 X”后，能看到一份待确认的人类视角验收草案。
- Measurement: 在 Codex 对话中查看 agent 返回的验收草案。
- Passing threshold: 草案只描述用户通过工具执行操作后能完成的判断或动作；用户能直接 approve 或 revise。
- Evidence: acceptance-draft-guard-review: A natural-language goal no longer becomes a blindly approvable
  generic Nori Contract: generic draft output carries a discovery-required acceptance basis, and
  nori-acceptance instructs agents to show ACCEPTANCE-BASIS questions before asking for approval.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-15T08:20:44.764Z
- Sources:
  - type=command, label=npx vitest run test/cli-commands.test.js test/core.test.js, command=npx vitest run
    test/cli-commands.test.js test/core.test.js
  - type=command, label=npm run check, command=npm run check
  - type=artifact, label=src/acceptance.ts, path=src/acceptance.ts
  - type=artifact, label=plugins/opennori/skills/nori-acceptance/SKILL.md,
    path=plugins/opennori/skills/nori-acceptance/SKILL.md
  - type=artifact, label=test/core.test.js, path=test/core.test.js
- Reviewability: Inspect the nori-acceptance Skill and run tests covering generic draft review findings.
- Limitations: This does not generate a fully specific final contract by itself; it prevents premature approval and
  routes the agent back to discovery questions.

### AC-O-2

- Layer: operator
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在 Codex 对话里 approve 或 revise 验收标准后，能控制什么叫完成，而不是让 agent 自动决定完成定义。
- Measurement: 查看 active Nori Contract 中是否反映用户确认后的验收标准。
- Passing threshold: agent 在用户确认前不能进入 complete 判断；用户修改过的 AC 会成为后续状态判断依据。
- Evidence: review-result: Approval and criterion update flows preserve the acceptance basis and keep completion
  blocked until the user approves or revises the criteria.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:15.694Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-O-3

- Layer: operator
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在新的 Codex 会话里说“继续 OpenNori”后，agent 能恢复当前 active goal 并告诉我当前关键验收缺口。
- Measurement: 在新会话触发 OpenNori 恢复流程，观察 agent 返回内容。
- Passing threshold: 不依赖旧聊天上下文；能返回 goal id、当前状态、当前关键缺口和下一条需要证据的 AC。
- Evidence: review-result: resume/status recover active goals from .opennori active files, including
  current_gap, completion, evidence_health, architecture, and next_recommendation.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:15.744Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-O-4

- Layer: operator
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在 Codex 对话里问“现在完成了吗？”后，agent 只能基于 required AC 的状态和证据回答。
- Measurement: 向 agent 询问完成状态并检查回答依据。
- Passing threshold: 只有 required AC 全部 passing 或 waived 时才能回答 complete；否则必须指出未通过或 blocked 的 AC。
- Evidence: completion-judgment-project-profile-review: When the user asks if work is done, status/report answer
  from current_gap, required AC evidence, Project Profile compliance, Architecture Baseline state, and
  evidence_health.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-21T13:34:58.861Z
- Sources:
  - type=command, label=node ./bin/opennori.js status --root . --json, command=node ./bin/opennori.js status --root
    . --json
  - type=command, label=node ./bin/opennori.js report --root . --json, command=node ./bin/opennori.js report --root
    . --json
  - type=artifact, label=src/core/contract.ts, path=src/core/contract.ts
  - type=artifact, label=src/core/report.ts, path=src/core/report.ts
  - type=artifact, label=src/core/profile.ts, path=src/core/profile.ts
- Reviewability: Ask for status/report and confirm the completion answer is based on objective current_gap and
  required AC evidence, with Project Profile compliance and Architecture Baseline surfaced as review
  context instead of hidden agent self-certification.
- Limitations: This verifies completion routing and report/status surfaces in the current repository. It does not
  replace human acceptance of subjective product quality.

### AC-O-5

- Layer: operator
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在 Codex 对话里问“我需要做什么？”后，如果任务 blocked，能看到一个明确的人类动作。
- Measurement: 制造或查看 blocked 状态下的 OpenNori 报告或 agent 回复。
- Passing threshold: blocked 说明必须是用户可执行动作，例如确认取舍、提供权限、批准成本或选择方案，而不是技术日志。
- Evidence: review-result: Blocked criteria and violated required profile items produce intervention.required
  with a concrete user action instead of vague process status.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:15.844Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-O-6

- Layer: operator
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我发现新事实后在对话中修改某条 AC，agent 后续只按更新后的验收标准判断完成。
- Measurement: 用户提出 AC 修改后，查看 active contract、status 和 report。
- Passing threshold: 更新后的 AC 成为后续 completion 和 current_gap 的唯一验收依据；旧标准不会继续被当成完成条件。
- Evidence: review-result: criterion update rewrites the user-facing AC, clears stale criterion evidence,
  preserves acceptance basis, and makes future completion depend on the revised AC.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:15.902Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-O-7

- Layer: operator
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我说“OpenNori 先头脑风暴：想法 X”后，能看到几个可选择的验收方向，而不需要记住 CLI 用法。
- Measurement: 在 Codex 对话中触发 brainstorm，查看 agent 展示的候选方向。
- Passing threshold: 候选项围绕用户价值、可观察验收方式和风险组织；用户能选择或改写方向进入 draft；brainstorm 输出不能被当作 Nori Contract 或完成证据。
- Evidence: review-result: brainstorm produces selectable acceptance directions with user value, observable
  acceptance direction, and risk, without treating brainstorm output as a contract.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:15.952Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-O-8

- Layer: operator
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在 Codex 对话里声明必须使用某个 Skill、偏好某个技术栈、避免某个工具或指定安装策略后，agent 能把它记录为项目级 Project Profile，并在当前 goal
  完成前告诉我该 goal 是否遵守。
- Measurement: 在 Codex 对话中提出能力偏好后，查看 .opennori/profile/、status、report 或 dashboard 的 Project Profile compliance。
- Passing threshold: 用户不需要记住 CLI；Project Profile 保存在 .opennori/profile/，不被复制进 Nori Contract 或写成 Product AC；current goal 的
  ledger 只记录 profile_evidence；must 或 avoid 的违反会阻止 complete，prefer 作为 review risk 展示；没有 current goal
  时可查看/编辑 Project Profile 但不评价合规。
- Evidence: project-profile-source-directory-verification: OpenNori initializes .opennori/profile/profile.json
  as the project-level Project Profile source and .opennori/profile/README.md as a generated review
  surface; goal ledgers store only profile_evidence compliance records.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-21T13:40:42.523Z
- Sources:
  - type=command, label=node ./bin/opennori.js init --root . --confirm --json, command=node ./bin/opennori.js init
    --root . --confirm --json
  - type=command, label=npm run test:profile, command=npm run test:profile
  - type=artifact, label=src/core/profile.ts, path=src/core/profile.ts
  - type=artifact, label=src/lifecycle/install.ts, path=src/lifecycle/install.ts
  - type=artifact, label=src/lifecycle/manifest.ts, path=src/lifecycle/manifest.ts
  - type=artifact, label=test/cli-lifecycle.test.js, path=test/cli-lifecycle.test.js
  - type=artifact, label=.opennori/profile/profile.json, path=.opennori/profile/profile.json
  - type=artifact, label=.opennori/profile/README.md, path=.opennori/profile/README.md
- Reviewability: Inspect .opennori/profile/profile.json and README.md, lifecycle install actions, manifest managed
  files, and profile tests. Confirm profile.json is source data, README is generated from it, and
  current goal ledgers contain only compliance evidence.
- Limitations: This verifies project-state initialization and scope boundaries. It does not add Project Profile
  preferences to this repository; the current Project Profile remains empty until a user or agent
  records preferences.

### AC-Z-1

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我获取 OpenNori 包后，我的 agent 能通过 Codex Plugin 发现 OpenNori Skills，而不需要我记住内部 Skill 名或手动查找能力入口。
- Measurement: 查看 Codex Plugin manifest、package Skills、README 和 opennori doctor 输出。
- Passing threshold: 包内包含 .codex-plugin/plugin.json 且 skills 指向 ./skills/；nori 总入口和子 Skills 说明自然语言路由；doctor 报告
  plugin_manifest、plugin_skills 和 manifest_plugin_state；用户能判断 Plugin Skills 可用。
- Evidence: review-result: OpenNori exposes package-local Codex Plugin Skills for agent discovery: the
  marketplace points to plugins/opennori, plugin.json points to ./skills, package Skills describe
  natural-language routing, and doctor reports Plugin manifest, marketplace, Skills, and manifest
  state as healthy.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-13T15:02:52.086Z
- Sources:
  - type=command, label=node ./bin/opennori.js doctor --root . --json, command=node ./bin/opennori.js doctor --root
    . --json
  - type=artifact, label=.agents/plugins/marketplace.json, path=.agents/plugins/marketplace.json
  - type=artifact, label=plugins/opennori/.codex-plugin/plugin.json, path=plugins/opennori/.codex-plugin/plugin.json
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=src/lifecycle/doctor/plugin-health.ts, path=src/lifecycle/doctor/plugin-health.ts
- Reviewability: Inspect plugin manifest, marketplace metadata, package Skills, and doctor data.plugin/checks.
- Limitations: This validates the source checkout package assets; external package installation should be
  smoke-tested after publish.

### AC-Z-2

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我运行 opennori install 后，能把 OpenNori 放入当前项目的可用入口，并且不会意外覆盖已有内容。
- Measurement: 在一个已有项目中运行安装入口并查看安装结果。
- Passing threshold: 安装前能看到将创建或跳过的入口；已有内容默认不被覆盖；失败时说明用户需要做什么。
- Evidence: review-result: Install preview only manages OpenNori project state: .opennori directories, protocol,
  guide, manifest, agent routes, and architecture directories are create/skip/update actions, with no
  destructive writes unless explicitly confirmed.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-13T15:02:52.322Z
- Sources:
  - type=command, label=node ./bin/opennori.js install --root . --dry-run --json, command=node ./bin/opennori.js
    install --root . --dry-run --json
  - type=artifact, label=src/lifecycle/install.ts, path=src/lifecycle/install.ts
  - type=artifact, label=src/lifecycle/managed-files.ts, path=src/lifecycle/managed-files.ts
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run install dry-run and inspect install_plan actions plus lifecycle install tests.
- Limitations: Dry-run proves the plan surface; actual overwrite paths still require explicit confirmation and
  should be retested in fixture projects.

### AC-Z-3

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在 Git 或 PR diff 中审查 agent 本轮改动后，能区分验收证据变化和实现过程噪音。
- Measurement: 查看本轮 diff 或报告变更摘要。
- Passing threshold: 默认摘要围绕 AC 状态变化、证据变化和用户影响组织；实现过程只作为附属证据出现。
- Evidence: review-result: changes groups .opennori/examples acceptance artifacts separately from implementation
  files so PR review can separate evidence state from code changes.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:16.144Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-Z-4

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我运行 opennori list 后，能看到多个 active goals，并能明确选择要继续的目标。
- Measurement: 创建多个 active goals 后运行 opennori list，并用 --goal 指定 resume/status/report 的目标。
- Passing threshold: 多个目标不会被 agent 随机选择；用户能看见目标列表、状态、当前缺口和对应路径。
- Evidence: review-result: list shows multiple active OpenNori goals and resume requires explicit --goal when
  more than one active contract exists.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:16.193Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-Z-5

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我运行归档入口后，completed 或 blocked 中保留报告，active 中不再出现这个目标。
- Measurement: 对 complete 或 blocked goal 执行归档，再运行 opennori list 并打开归档产物。
- Passing threshold: 归档不会丢失 Nori Contract、evidence record 或 report；active 列表只显示仍需推进的目标。
- Evidence: review-result: archive moves complete or blocked goals out of active into completed/blocked while
  preserving evidence and reports.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:16.242Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-Z-6

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在项目目录运行 OpenNori 后，能看到 OpenNori 状态集中在 .opennori 目录里，而不是散落到通用 process 目录。
- Measurement: 运行 opennori install、draft、brainstorm、report 或 archive 后查看项目目录。
- Passing threshold: OpenNori 默认只把协议、active goal、报告、归档和 brainstorm 写入 .opennori；不创建 process/acceptance 或
  process/development-protocols。
- Evidence: review-result: OpenNori install and tests create .opennori
  active/completed/blocked/reports/brainstorms/architecture directories and do not create a process
  directory.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:16.291Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-Z-7

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我运行 opennori install 后，能看到当前项目的 OpenNori 接入登记信息，并判断版本、托管入口、active goals、Plugin Skill
  状态和协议能力是否可信。
- Measurement: 运行 opennori install --dry-run 或 opennori install 后查看输出和 .opennori/manifest.json。
- Passing threshold: 输出包含 create、skip、overwrite 或 update 语义；manifest 说明 OpenNori 版本、managed files、active goals、plugin
  状态、architecture 状态和协议能力；已有用户内容默认不被覆盖。
- Evidence: review-result: Install dry-run and manifest expose project registration details users can judge:
  OpenNori version, active goals, managed files, protocol capabilities, architecture directories, and
  package Plugin state.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-13T15:02:52.562Z
- Sources:
  - type=command, label=node ./bin/opennori.js install --root . --dry-run --json, command=node ./bin/opennori.js
    install --root . --dry-run --json
  - type=artifact, label=.opennori/manifest.json, path=.opennori/manifest.json
  - type=artifact, label=src/lifecycle/manifest.ts, path=src/lifecycle/manifest.ts
  - type=artifact, label=src/lifecycle/install.ts, path=src/lifecycle/install.ts
- Reviewability: Run install dry-run and inspect .opennori/manifest.json plus manifest/install source.
- Limitations: This verifies current local project state; package release validation should rerun after version
  changes.

### AC-Z-8

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我运行 opennori doctor 后，能判断当前项目是 ready、needs-action 还是 broken，并知道下一步修复动作。
- Measurement: 在已安装项目、缺少接入登记的项目、Plugin 资产异常或 active goal 异常的项目中运行 opennori doctor。
- Passing threshold: 输出包含整体健康状态、逐项检查结果、active goal 可恢复性、packaged Plugin Skill 状态、manifest plugin state 和可执行的 recovery 建议。
- Evidence: status-no-current-recovery: OpenNori status/resume/report now return routeable no-current-goal or
  health recovery state instead of unexpected_error when a project has no current Nori Contract. In
  agent-workbench, status now returns ok true with status needs-action, reason no_current_goal,
  agent_next health_needs_recovery, failed checks for missing .opennori/current and .opennori/drafts,
  and a short TTY summary pointing to recovery.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-17T07:52:23.659Z
- Sources:
  - type=command, label=node ./bin/opennori.js status --root /Users/jarl/code/jarlone/agent-workbench --json,
    command=node ./bin/opennori.js status --root /Users/jarl/code/jarlone/agent-workbench --json
  - type=command, label=script -q /dev/null node ./bin/opennori.js status --root
    /Users/jarl/code/jarlone/agent-workbench, command=script -q /dev/null node ./bin/opennori.js status --root
    /Users/jarl/code/jarlone/agent-workbench
  - type=command, label=npx vitest run test/cli-commands.test.js -t 'status commands return|status routes
    incomplete', command=npx vitest run test/cli-commands.test.js -t 'status commands return|status routes
    incomplete'
  - type=command, label=npx vitest run, command=npx vitest run
  - type=artifact, label=src/cli/runtime.ts, path=src/cli/runtime.ts
  - type=artifact, label=src/cli/command-tree.ts, path=src/cli/command-tree.ts
  - type=artifact, label=src/cli/human-output.ts, path=src/cli/human-output.ts
  - type=artifact, label=test/core.test.js, path=test/core.test.js
- Reviewability: Rerun the status command against a project with initialized but empty or incomplete .opennori state
  and confirm there is no unexpected_error; inspect agent_next.state and the TTY summary.
- Limitations: This validates local source behavior. npm/global users receive it after the next publish or local
  plugin/CLI sync.

### AC-Z-9

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我预览 OpenNori 安装时，能判断每个项目入口会被创建、跳过、更新还是覆盖，并确认 dry-run 不会写入项目。
- Measurement: 运行 opennori install --dry-run，查看 install plan，再检查项目文件是否未被写入。
- Passing threshold: install plan 对每个入口显示 action、kind、managed、would_write、will_write、destructive 和 reason；dry-run 下
  will_write 为 0；覆盖类动作必须被标记为 destructive。
- Evidence: review-result: install dry-run reports create/exists/skip/update/overwrite actions with will_write,
  would_write, destructive, managed, and reason fields while writing nothing.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:16.436Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-Z-10

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我执行可能覆盖已有 OpenNori 入口的安装时，必须先看到预览并显式确认，才能真正写入项目。
- Measurement: 在已有 OpenNori 入口的项目中运行 opennori install --force、opennori install --force --dry-run 和确认后的安装。
- Passing threshold: 未确认的真实 --force 安装会失败并提示先 dry-run；dry-run 可展示 destructive overwrite；只有带显式确认的 --force 才会执行覆盖写入。
- Evidence: review-result: destructive install/overwrite flows require a dry-run preview and explicit --confirm
  before writing, with tests covering confirm_required behavior.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:16.484Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-Z-11

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我卸载 OpenNori 前，能预览将移除什么，并确认默认卸载不会丢失 active goals、证据、报告或归档。
- Measurement: 在已安装且有 active goal 的项目中运行 opennori uninstall --dry-run、未确认 uninstall、确认 uninstall 和 include-state
  uninstall。
- Passing threshold: 默认 uninstall plan 标明 entry assets 会被移除、验收状态会被 preserve；未确认真实卸载会失败；确认后只移除入口资产；只有显式 --include-state
  --confirm 才会删除 .opennori 状态目录。
- Evidence: review-result: uninstall previews removals, preserves .opennori state by default, and requires
  explicit --include-state plus --confirm before removing OpenNori state.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:16.532Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-Z-12

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我安装或获取 OpenNori 后，agent 能通过一组职责清晰的 OpenNori Plugin
  Skills，把自然语言请求稳定映射到验收发现、架构基线、证据、能力偏好、项目健康、报告和下一轮候选目标，而不需要我记住 Skill 名或 CLI 参数。
- Measurement: 查看 .codex-plugin/plugin.json、plugins/opennori/skills/nori*/SKILL.md、opennori doctor、opennori
  status/report/context export，以及典型自然语言场景下的 Skill 路由说明。
- Passing threshold: Skill Pack 不只是命令清单：每个 Skill 都包含触发语义、agent 应先读取的状态、用户回复形态、状态写入边界、handoff 到其他 Skill
  的条件和误用防护；总入口能处理继续、完成判断、记录证据、能力偏好、架构优先、项目健康和 candidate_goals；所有 Skill 都保持 Plugin-first，不要求项目内 Skill
  copy/sync，不把 architecture/profile/build-vs-buy/candidate_goals 写成 Product AC 或过程计划。
- Evidence: review-result: OpenNori report and context export now include data.agent_next alongside
  next_recommendation, so Skills and review tools can use the same deterministic routing surface
  instead of inferring next actions from report context.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-15T12:22:55.433Z
- Sources:
  - type=command, label=npm run typecheck, command=npm run typecheck
  - type=command, label=npm test -- --run test/cli-commands.test.js test/core.test.js, command=npm test -- --run
    test/cli-commands.test.js test/core.test.js
  - type=artifact, label=src/cli/commands/reporting.ts, path=src/cli/commands/reporting.ts
  - type=artifact, label=src/lifecycle/context-export.ts, path=src/lifecycle/context-export.ts
  - type=artifact, label=src/types.ts, path=src/types.ts
  - type=artifact, label=test/core.test.js, path=test/core.test.js
- Reviewability: Rerun the listed checks, then inspect opennori report --json and context export --json for
  data.agent_next matching the current completion route.
- Limitations: This aligns JSON routing surfaces; external tools must still decide how to display or use agent_next
  without taking over Codex.

### AC-Z-13

- Layer: productization
- Status: passing
- Confidence: high
- User acceptance criterion: 作为用户，我运行 opennori doctor 后，如果项目状态不健康，能直接看到一组可执行恢复动作。
- Measurement: 分别制造缺失 manifest、stale manifest、缺失 package Plugin assets 和损坏 active goal 的项目，然后运行 opennori doctor。
- Passing threshold: doctor 输出 status、失败 check、active_goal_issues、Plugin asset health 和 recovery_actions；recovery_actions
  说明要运行的 OpenNori 命令或要检查的 .opennori/active 文件位置。
- Evidence: verification: Doctor/check/report now expose invalid architecture evidence files with a concrete
  recovery action when profile-shaped JSON is misplaced under .opennori/architecture/evidence.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-20T10:20:09.146Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=artifact, label=src/lifecycle/doctor/project-health.ts, path=src/lifecycle/doctor/project-health.ts
  - type=artifact, label=src/cli/commands/check.ts, path=src/cli/commands/check.ts
  - type=artifact, label=src/core/report.ts, path=src/core/report.ts
  - type=artifact, label=test/core.test.js, path=test/core.test.js
- Reviewability: Rerun npm run check, node ./bin/opennori.js doctor --root /Users/jarl/code/jarlone/agent-workbench
  --json, and node ./bin/opennori.js check --root /Users/jarl/code/jarlone/agent-workbench --json;
  inspect the architecture_evidence doctor check and recovery action.
- Limitations: OpenNori intentionally does not auto-delete misplaced user/project files; it reports the broken
  state and recovery action for user or agent cleanup.

### AC-Z-14

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我让 agent 继续一个已经完成的 OpenNori goal 时，不需要每轮都追问下一步是什么；agent 能看到少量可开启下一份 Nori Contract 的人类目标候选。
- Measurement: 运行 opennori resume、opennori status、opennori next、opennori report 和 context export，查看 complete goal 的
  next_recommendation。
- Passing threshold: 已完成且无 review risk 的 goal 输出 ready-for-next-loop，并包含 candidate_goals；每个候选包含
  goal、user_value、acceptance_directions 和 risks，帮助 agent 进入下一轮 AC discovery，但不呈现为 phase、plan 或 task
  list。
- Evidence: review-result: agent_next now carries candidate_goals for ready_for_next_loop, including draft_args,
  draft_command, and draft_rule, so Skills can continue from the deterministic routing surface without
  reconstructing flags or treating candidates as approved AC.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-15T12:14:59.454Z
- Sources:
  - type=command, label=npm run typecheck, command=npm run typecheck
  - type=command, label=npm test -- --run test/cli-commands.test.js test/core.test.js, command=npm test -- --run
    test/cli-commands.test.js test/core.test.js
  - type=artifact, label=src/agent-next.ts, path=src/agent-next.ts
  - type=artifact, label=src/types.ts, path=src/types.ts
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-acceptance/SKILL.md,
    path=plugins/opennori/skills/nori-acceptance/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-reporting/SKILL.md,
    path=plugins/opennori/skills/nori-reporting/SKILL.md
- Reviewability: Rerun the listed checks and inspect resume/status JSON for data.agent_next.state=ready_for_next_loop
  with candidate_goals and draft metadata.
- Limitations: This exposes deterministic routing data for Skills; selecting, refining, and approving the next
  draft remains an agent/user judgment and candidates are not completion evidence.

### AC-Z-15

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我让 agent 记录验收证据时，不需要 agent 为常见来源手写复杂结构。
- Measurement: 运行 opennori evidence add，分别使用 --source-command、--source-path、--source-url 和自由 --source 记录证据，再查看
  status/report。
- Passing threshold: 证据来源能显示为 command、artifact、url 或自由 reference；report/status 中仍保留 basis、reviewability、limitations 和
  confidence。
- Evidence: review-result: evidence add accepts source, source-command, source-path, and source-url flags so
  agents can record common sources without hand-writing complex JSON.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T03:14:16.728Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and
  generated report.
- Limitations: This is local repository evidence for the current worktree; npm publishing and public site
  deployment are separate release steps.

### AC-Z-16

- Layer: productization
- Status: passing
- Confidence: high
- User acceptance criterion: 作为用户，我通过 npm 获取 OpenNori 后，能用 opennori 或 npx opennori 这个短入口开始，而不需要理解 install、root、dry-run、confirm
  或内部 Skill 参数。
- Measurement: 在全新临时项目中运行 opennori 或 npx opennori 等价入口，再确认 bootstrap 后运行 opennori doctor。
- Passing threshold: npm 包只提供 opennori 这个 bin；短入口默认展示首次接入 preview 且不写入项目；显式确认后只创建 .opennori 状态；不会向项目写入 package Skill
  assets；doctor 为 ready。
- Evidence: local-global-bin-link-fix: Dogfood found npm link created a global opennori command pointing at
  dist/bin/opennori.js, but the compiled dist file was not executable, so zsh reported permission
  denied. OpenNori package bin now points to the executable bin/opennori.js wrapper, which supports
  source checkouts and published packages; npm link now creates a PATH command that runs opennori init
  preview correctly.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-15T06:05:06.857Z
- Sources:
  - type=command, label=opennori init --json in a temporary directory, command=opennori init --json in a temporary
    directory
  - type=command, label=npm run check, command=npm run check
  - type=artifact, label=package.json, path=package.json
  - type=artifact, label=package-lock.json, path=package-lock.json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
- Reviewability: Inspect package bin metadata and the refreshed npm link symlink; rerun opennori init --json from any
  temporary project to confirm preview works without writing.
- Limitations: This verifies the local npm link development path on the current Node v22.19.0 environment;
  published npm behavior will be covered when the next package version is packed or published.

### AC-Z-17

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我第一次打开 README 或官网 Quick Start 时，能看到短到可以直接复制的 npx opennori 入口，而不是一串内部安装参数。
- Measurement: 阅读 README Try It 和官网首屏 Quick Start / Start 区域。
- Passing threshold: README 和官网第一眼 Quick Start 展示 npx opennori；更详细的 opennori bootstrap、install、dry-run、confirm 只作为 agent
  或高级用户的底层安全路径出现。
- Evidence: review-result: README and website quickstart lead with short commands: try once with npx opennori,
  pin with npm install -D opennori, then use opennori as the project-local entry.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-13T15:02:53.305Z
- Sources:
  - type=command, label=rg -n 'npx opennori|npm install -D opennori|opennori' README.md
    /Users/jarl/code/jarlone/opennori-site/src/pages/index.astro, command=rg -n 'npx opennori|npm install -D
    opennori|opennori' README.md /Users/jarl/code/jarlone/opennori-site/src/pages/index.astro
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=/Users/jarl/code/jarlone/opennori-site/src/pages/index.astro,
    path=/Users/jarl/code/jarlone/opennori-site/src/pages/index.astro
- Reviewability: Open README and website source, or run the rg command, to verify the visible quickstart copy.
- Limitations: This verifies local website source; public site deployment is a separate release step.

### AC-A-1

- Layer: architecture
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我用自然语言告诉 agent 一个非平凡目标后，能先看到 Product AC 和 Architecture Baseline，让我判断要完成什么以及准备按什么技术架构完成。
- Measurement: 在 OpenNori Skill 指引下查看 draft/discover 输出和 architecture baseline preview。
- Passing threshold: 用户能在实现开始前分别确认 Product AC 和 Architecture Baseline；baseline 不呈现为阶段计划或任务列表。
- Evidence: review-result: OpenNori now routes agents to architecture review before non-trivial implementation
  when Product AC is ready but the Architecture Baseline is missing; after baseline confirmation,
  agent_next returns to the current Product AC evidence gap.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-15T09:02:54.484Z
- Sources:
  - type=command, label=npx vitest run test/core.test.js test/cli-commands.test.js, command=npx vitest run
    test/core.test.js test/cli-commands.test.js
  - type=command, label=npm run check, command=npm run check
  - type=artifact, label=src/core/report.ts, path=src/core/report.ts
  - type=artifact, label=src/agent-next.ts, path=src/agent-next.ts
  - type=artifact, label=src/types.ts, path=src/types.ts
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
- Reviewability: Run the targeted tests and inspect status/resume JSON for agent_next.state architecture_needs_review
  before baseline confirmation and work_on_current_gap after baseline confirmation.
- Limitations: This verifies deterministic OpenNori state-layer routing; agent/user still decide whether a concrete
  task is trivial enough to waive architecture review.

### AC-A-2

- Layer: architecture
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我确认 Architecture Baseline 后，新开的 agent session 能通过 OpenNori Plugin Skills 和 .opennori
  状态识别这条架构约束，并知道后续实现必须沿用它。
- Measurement: 在新会话中查看 OpenNori Plugin Skills、.opennori/agent-guide.md、architecture baseline、可选 agent route 和
  architecture show/status 输出。
- Passing threshold: 用户能判断新 session 不依赖旧聊天上下文也能通过 Plugin Skills 或 .opennori 状态找到架构约束；报告明确提示 agent 应提出 challenge 而不是静默替换。
- Evidence: review-result: Evidence add now returns next_recommendation and agent_next, so agents can route
  after recording evidence instead of guessing whether to continue a gap, review architecture, report
  completion risk, or start the next loop.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-15T10:20:29.878Z
- Sources:
  - type=command, label=npx vitest run test/core.test.js -t 'high-risk criteria require strong evidence before
    passing', command=npx vitest run test/core.test.js -t 'high-risk criteria require strong evidence before
    passing'
  - type=command, label=npx vitest run test/cli-commands.test.js -t 'evidence add command module records flexible
    reviewable sources', command=npx vitest run test/cli-commands.test.js -t 'evidence add command module records
    flexible reviewable sources'
  - type=command, label=npx tsc --noEmit, command=npx tsc --noEmit
  - type=artifact, label=src/cli/commands/evidence/add.ts, path=src/cli/commands/evidence/add.ts
  - type=artifact, label=plugins/opennori/skills/nori-evidence/SKILL.md,
    path=plugins/opennori/skills/nori-evidence/SKILL.md
  - type=artifact, label=test/core.test.js, path=test/core.test.js
- Reviewability: Run the listed tests and inspect evidence add JSON for next_recommendation and data.agent_next after
  evidence writes.
- Limitations: This verifies deterministic routing in the evidence command; downstream agents still need to follow
  the returned Skill.

### AC-A-3

- Layer: architecture
- Status: passing
- Confidence: high
- User acceptance criterion: 作为用户，我可以选择 OpenNori 内置优秀架构 profile，也可以声明自己的项目架构 profile，并让它影响 baseline 和完成判断。
- Measurement: 运行 architecture profiles、architecture profile --from 和 architecture baseline --profile。
- Passing threshold: 内置 profile 和项目 profile 都能列出；项目 profile 可生成 baseline；技术偏好不会被写成 Product AC。
- Evidence: verification: Project AGENTS guidance now preserves the architecture artifact boundary: profiles,
  baselines, decisions, challenges, and apply records each have distinct directories, and invalid
  architecture evidence routes to project health.
- Basis: artifact-review
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-20T10:25:55.423Z
- Sources:
  - type=architecture-apply, label=ac-a-3-architecture-evidence-boundary,
    path=.opennori/architecture/evidence/ac-a-3-architecture-evidence-boundary.json, summary=Architecture Baseline
    alignment context. This is not Product AC evidence by itself., role=context
  - type=artifact, label=AGENTS.md, path=AGENTS.md
  - type=artifact, label=plugins/opennori/skills/nori-architecture-brainstorm/SKILL.md,
    path=plugins/opennori/skills/nori-architecture-brainstorm/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-architecture-apply/SKILL.md,
    path=plugins/opennori/skills/nori-architecture-apply/SKILL.md
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Inspect AGENTS.md, packaged architecture Skills, README, and protocol for the same directory
  boundary.
- Limitations: This is guidance and state-boundary evidence; it does not judge subjective profile quality.

### AC-A-4

- Layer: architecture
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，当 agent 认为 baseline 不适合当前项目时，我看到明确 Architecture Challenge，而不是 agent 静默改架构。
- Measurement: 运行 opennori architecture challenge 后查看 status/report 和 challenge 文件。
- Passing threshold: challenge 展示当前 baseline、项目证据、冲突说明、建议修正和是否需要用户确认。
- Evidence: test-summary: Architecture Challenge command records evidence-backed baseline conflicts and marks
  architecture as challenged instead of allowing silent replacement.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-12T01:29:34.871Z
- Sources:
  - type=command, label=npm test, command=npm test
  - type=artifact, label=test/core.test.js, path=test/core.test.js
- Reviewability: Run npm test and inspect the architecture challenge regression test and Skill rules.
- Limitations: The self repo currently has no open challenge because the current baseline is valid; behavior is
  covered in isolated test projects.

### AC-A-5

- Layer: architecture
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我查看 status/report 时，能看到 Product decision 和 Architecture decision 分开呈现。
- Measurement: 运行 opennori status、opennori report 和 context export。
- Passing threshold: 输出分别展示产品 AC 状态、Architecture Baseline 状态、open challenges、build-vs-buy decisions、当前缺口和下一步证据。
- Evidence: review-result: Status, report, and context export now pass ArchitectureState into
  completionAnswer/nextRecommendation so Product AC completion and Architecture decision are shown
  separately; missing or challenged architecture becomes architecture_review without replacing
  current_gap.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-14T01:35:54.741Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=npx vitest run test/core.test.js -t 'architecture|build-vs-buy', command=npx vitest run
    test/core.test.js -t 'architecture|build-vs-buy'
  - type=artifact, label=src/core/report.ts, path=src/core/report.ts
  - type=artifact, label=src/architecture/report.ts, path=src/architecture/report.ts
  - type=artifact, label=src/cli/commands/acceptance/runtime-status.ts,
    path=src/cli/commands/acceptance/runtime-status.ts
  - type=artifact, label=src/lifecycle/context-export.ts, path=src/lifecycle/context-export.ts
  - type=artifact, label=test/core.test.js, path=test/core.test.js
- Reviewability: Run the targeted tests and inspect status/report/context export wiring plus the missing architecture
  baseline test.
- Limitations: This verifies CLI/report surfaces; downstream UI or website renderers should continue to mirror the
  same fields.

### AC-A-6

- Layer: architecture
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我运行 doctor/check 时，能知道 Architecture Baseline 是否可用、Plugin Skills 是否随包可用、manifest
  是否记录该能力，以及项目提示是否过期。
- Measurement: 运行 opennori doctor/check，并查看缺失 baseline、缺失 Plugin assets、manifest stale 或项目提示过期时的输出。
- Passing threshold: doctor/check 返回 ready、needs-action 或 broken，并显示用户能执行或交给 agent 执行的恢复建议；恢复建议不要求把 OpenNori Skills
  复制进用户项目。
- Evidence: review-result: opennori check/report/context export are clean for opennori-self after
  architecture/build-vs-buy completion-risk wiring: architecture_check is clear, build_vs_buy is
  clear, evidence_health is clear, and completion is confident.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-14T01:36:08.467Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js check --root . --goal opennori-self --json, command=node
    ./bin/opennori.js check --root . --goal opennori-self --json
  - type=command, label=node ./bin/opennori.js report --root . --goal opennori-self --json, command=node
    ./bin/opennori.js report --root . --goal opennori-self --json
  - type=command, label=node ./bin/opennori.js context export --root . --goal opennori-self --output
    .opennori/reports/opennori-self.context.json --json, command=node ./bin/opennori.js context export --root .
    --goal opennori-self --output .opennori/reports/opennori-self.context.json --json
  - type=artifact, label=.opennori/reports/opennori-self.report.md, path=.opennori/reports/opennori-self.report.md
  - type=artifact, label=.opennori/reports/opennori-self.context.json,
    path=.opennori/reports/opennori-self.context.json
- Reviewability: Rerun the listed commands and inspect report/context export for confident completion and clear
  architecture/build-vs-buy state.
- Limitations: This records the current repository health; later managed-file or Skill asset changes should rerun
  doctor/check.

### AC-A-7

- Layer: architecture
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在 agent 准备自研基础设施前，能看到它已经比较过可复用选择，并说明为什么仍要自研或复用。
- Measurement: 查看 architecture build-vs-buy 输出、architecture decisions 记录、status 或 report。
- Passing threshold: 报告能让我判断 agent 是否检查过项目现有依赖、标准库、官方方案、成熟开源方案和自研理由；自研不能只有口头总结。
- Evidence: review-result: Unhealthy build-vs-buy decisions now appear as build_vs_buy review risks in
  completion and next_recommendation without creating synthetic Product AC or current_gap; tests cover
  missing reuse candidates and missing self-build reason.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-14T01:36:21.106Z
- Sources:
  - type=command, label=npx vitest run test/core.test.js -t 'build-vs-buy', command=npx vitest run test/core.test.js
    -t 'build-vs-buy'
  - type=artifact, label=src/core/report.ts, path=src/core/report.ts
  - type=artifact, label=src/architecture/build-vs-buy.ts, path=src/architecture/build-vs-buy.ts
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=plugins/opennori/skills/nori-build-vs-buy/SKILL.md,
    path=plugins/opennori/skills/nori-build-vs-buy/SKILL.md
- Reviewability: Run the build-vs-buy targeted test and inspect the build-vs-buy health plus completion review-risk
  assertions.
- Limitations: This proves build-vs-buy health reporting and completion confidence semantics, not the quality of
  every individual future architecture decision.

### AC-A-8

- Layer: architecture
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我查看 OpenNori 自身 dogfood 状态时，能知道 Architecture Baseline 已建立，但后续架构修复是否真的完成不能被最小可运行结果误报。
- Measurement: 查看 OpenNori 自身 status/report、Architecture Baseline、build-vs-buy decision、代码结构审查和后续架构修复证据。
- Passing threshold: 报告能清楚显示 baseline 已建立、当前仍有哪些架构风险或未完成缺口；如果核心结构仍未完成修复，目标不能显示 complete。
- Evidence: core-review-projection-boundary-refactor: OpenNori now has a core ReviewState projection shared by
  lifecycle goalReviewState and report rendering. The projection derives current gap, completion, user
  intervention, acceptance review, evidence health, Project Profile compliance, and next
  recommendation from contract, ledger, Project Profile, and ArchitectureState. Lifecycle adds only
  agent_next, while report rendering consumes the same projection instead of recomputing a parallel
  outcome model.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-23T09:18:36.846Z
- Sources:
  - type=architecture-apply, label=opennori-self-core-review-projection-boundary,
    path=.opennori/architecture/evidence/opennori-self-core-review-projection-boundary.json, summary=Architecture
    Baseline alignment context. This is not Product AC evidence by itself., role=context
  - type=command, label=npx tsc --noEmit --pretty false, command=npx tsc --noEmit --pretty false
  - type=command, label=npm run test:reporting, command=npm run test:reporting
  - type=command, label=npm run test:cli, command=npm run test:cli
  - type=command, label=npx vitest run test/mcp.test.ts test/cli-reporting.test.js test/cli-human-output.test.js,
    command=npx vitest run test/mcp.test.ts test/cli-reporting.test.js test/cli-human-output.test.js
  - type=command, label=npm run lint, command=npm run lint
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=command, label=node ./bin/opennori.js status --root . --json, command=node ./bin/opennori.js status --root
    . --json
  - type=command, label=node ./bin/opennori.js context export --root . --json, command=node ./bin/opennori.js
    context export --root . --json
  - type=artifact, label=src/core/review-state.ts, path=src/core/review-state.ts
  - type=artifact, label=src/lifecycle/goal-review-state.ts, path=src/lifecycle/goal-review-state.ts
  - type=artifact, label=src/core/report-render.ts, path=src/core/report-render.ts
  - type=artifact, label=src/architecture/report.ts, path=src/architecture/report.ts
  - type=artifact, label=src/cli/commands/reporting.ts, path=src/cli/commands/reporting.ts
- Reviewability: Inspect src/core/review-state.ts and confirm it owns deterministic outcome projection below
  lifecycle and kernel. Inspect lifecycle/reporting files to confirm they consume that projection, and
  lifecycle alone adds agent_next. Rerun the listed commands.
- Limitations: This verifies outcome projection sharing for lifecycle status/report/context surfaces. It does not
  change report Markdown structure, dashboard visuals, persisted protocol fields, or subjective
  Skill/user acceptance-quality review.

### AC-A-9

- Layer: architecture
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我打开 README 或官网时，能理解 OpenNori 同时提供产品验收、架构基线、Plugin Skills、证据和完成判断，而不是过程模板工具。
- Measurement: 阅读 README、官网首页、protocol 和 OpenNori Skills。
- Passing threshold: 用户能看到 Architecture Baseline、Architecture Challenge、build-vs-buy、Plugin Skills、项目 profile 和 Product
  AC 分离的说明与用例。
- Evidence: artifact-review: README, protocol, package Skills, and website describe OpenNori as Product AC plus
  Architecture Baseline plus Plugin Skills plus flexible evidence and completion judgment, with
  natural-language examples for users.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-13T15:03:36.060Z
- Sources:
  - type=command, label=rg -n 'Product AC|Architecture Baseline|Plugin Skills|evidence|completion|npx opennori'
    README.md .opennori/protocol.md plugins/opennori/skills /Users/jarl/code/jarlone/opennori-site/src/pages/index.a
    stro, command=rg -n 'Product AC|Architecture Baseline|Plugin Skills|evidence|completion|npx opennori' README.md
    .opennori/protocol.md plugins/opennori/skills /Users/jarl/code/jarlone/opennori-site/src/pages/index.astro
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-architecture-brainstorm/SKILL.md,
    path=plugins/opennori/skills/nori-architecture-brainstorm/SKILL.md
  - type=artifact, label=/Users/jarl/code/jarlone/opennori-site/src/pages/index.astro,
    path=/Users/jarl/code/jarlone/opennori-site/src/pages/index.astro
- Reviewability: Read README/protocol/Skills and website source, then run the rg command to verify current product
  language.
- Limitations: Website source is local; public deployment verification is separate.

### AC-A-10

- Layer: architecture
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我能在一个非 OpenNori 核心仓库里，按新的 Plugin-first 边界完整跑通自然语言目标、Product AC、Architecture
  Baseline、执行、证据、报告和完成判断。
- Measurement: 选择一个非 OpenNori 核心仓库，使用当前 OpenNori 从目标到报告跑完；过程中只通过 Plugin Skills 和 .opennori 状态驱动 OpenNori 能力。
- Passing threshold: 报告同时呈现产品完成状态、架构健康状态、Plugin package 能力、证据、未解决风险和是否需要用户确认；用户不需要记住 CLI 参数；doctor/check 不依赖项目内 Skill
  资产副本。
- Evidence: dogfood-result: OpenNori was dogfooded in the separate opennori-site repo under the current
  Plugin-first boundary: a natural-language website goal became Product AC, an Astro Architecture
  Baseline and build-vs-buy decision were confirmed, homepage content was implemented, reviewable
  evidence was recorded, report/status completed, and the dogfood validated active-goal write locking.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-13T15:03:36.293Z
- Sources:
  - type=command, label=cd /Users/jarl/code/jarlone/opennori-site && node
    /Users/jarl/code/jarlone/opennori/bin/opennori.js status --root . --goal opennori-site-plugin-first --json,
    command=cd /Users/jarl/code/jarlone/opennori-site && node /Users/jarl/code/jarlone/opennori/bin/opennori.js
    status --root . --goal opennori-site-plugin-first --json
  - type=command, label=cd /Users/jarl/code/jarlone/opennori-site && node
    /Users/jarl/code/jarlone/opennori/bin/opennori.js report --root . --goal opennori-site-plugin-first --json,
    command=cd /Users/jarl/code/jarlone/opennori-site && node /Users/jarl/code/jarlone/opennori/bin/opennori.js
    report --root . --goal opennori-site-plugin-first --json
  - type=command, label=cd /Users/jarl/code/jarlone/opennori-site && npm run build, command=cd
    /Users/jarl/code/jarlone/opennori-site && npm run build
  - type=command, label=cd /Users/jarl/code/jarlone/opennori && npx vitest run test/core.test.js -t 'concurrent
    evidence writes', command=cd /Users/jarl/code/jarlone/opennori && npx vitest run test/core.test.js -t
    'concurrent evidence writes'
  - type=artifact, label=/Users/jarl/code/jarlone/opennori-site/.opennori/active/opennori-site-plugin-first.acceptan
    ce.md, path=/Users/jarl/code/jarlone/opennori-site/.opennori/active/opennori-site-plugin-first.acceptance.md
  - type=artifact, label=/Users/jarl/code/jarlone/opennori-site/.opennori/active/opennori-site-plugin-first.evidence
    .json, path=/Users/jarl/code/jarlone/opennori-site/.opennori/active/opennori-site-plugin-first.evidence.json
  - type=artifact, label=/Users/jarl/code/jarlone/opennori-site/.opennori/reports/opennori-site-plugin-first.report.
    md, path=/Users/jarl/code/jarlone/opennori-site/.opennori/reports/opennori-site-plugin-first.report.md
  - type=artifact, label=/Users/jarl/code/jarlone/opennori-site/.opennori/architecture/baseline.md,
    path=/Users/jarl/code/jarlone/opennori-site/.opennori/architecture/baseline.md
  - type=artifact, label=src/cli/runtime.ts, path=src/cli/runtime.ts
  - type=artifact, label=test/core.test.js, path=test/core.test.js
- Reviewability: Review opennori-site status/report/build output and listed .opennori artifacts; rerun the concurrent
  evidence test for state consistency.
- Limitations: Dogfood covered a static Astro website repo and local CLI behavior; it did not validate a
  third-party production app or remote deployed website.

### AC-Z-18

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我第一次阅读 OpenNori 的 README、官网或 Plugin 说明时，理解 OpenNori 是一个 agent capability bundle：Codex Plugin
  负责分发发现，packaged Skills 负责 agent 行为协议，opennori CLI 负责确定性状态读写，.opennori 负责项目状态；我不会被引导把 Plugin、Skills 或
  CLI 当成三种可拆开的独立产品路径。
- Measurement: 阅读 README Install/Quick Start、官网 Start 区域、Plugin longDescription、nori/nori-project-health
  Skills、protocol，并检查测试对主路径文案和 Skill 边界的断言。
- Passing threshold: 用户主路径表达为安装和使用 OpenNori capability bundle；CLI 被说明为 Skills 使用的 deterministic state layer 和高级/CI
  入口，而不是与 Plugin 并列的替代使用方式；文档和 Skill 明确不要继续使用半残模式，缺 Plugin/Skills/CLI/state 任一关键能力时应通过 doctor/health
  引导补齐；测试防止重新出现 Choose one path、Try CLI once、Pin CLI to this project 这类拆分心智。
- Evidence: artifact-review: README now explains that agent_next.candidate_goals is the Skill routing surface
  for completed-goal continuation, while next_recommendation.candidate_goals remains the fuller
  report/context explanation surface.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-15T12:28:26.739Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=rg -n 'agent_next.candidate_goals|next_recommendation.candidate_goals|Context export|上下文导出'
    README.md .opennori/protocol.md plugins/opennori/skills, command=rg -n
    'agent_next.candidate_goals|next_recommendation.candidate_goals|Context export|上下文导出' README.md
    .opennori/protocol.md plugins/opennori/skills
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-acceptance/SKILL.md,
    path=plugins/opennori/skills/nori-acceptance/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-reporting/SKILL.md,
    path=plugins/opennori/skills/nori-reporting/SKILL.md
- Reviewability: Rerun npm run check and inspect README/protocol/Skills for the agent_next routing language.
- Limitations: This is documentation alignment for the current source package; public website or npm publication
  are separate release steps.

### AC-Z-19

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我第一次安装 OpenNori 时，只需要运行一个明确的 OpenNori setup 入口，就能预览并确认安装完整 capability bundle：Codex
  Plugin、packaged Skills、全局 opennori CLI 和当前项目 .opennori 状态；安装后我可以用 opennori init
  初始化任意项目，而不需要分别理解插件安装、npm 全局安装和项目状态参数。
- Measurement: 在临时项目中运行 opennori setup 的 preview/confirm 路径，查看 README、官网 Start 区域、nori-project-health Skill 和
  doctor 输出。
- Passing threshold: setup 默认先展示将执行的 Codex Plugin 注册、packaged Skills 检查、全局 CLI 安装、项目初始化和 doctor 检查；未确认不写入；确认后使用官方 codex
  plugin CLI 注册 Plugin、使用 npm 全局安装 opennori、创建 .opennori 状态并跑 doctor；README/官网把 npx opennori setup
  作为首次安装主路径，把手动 codex/npm 命令放在高级或恢复说明中。
- Evidence: confirmed-init-routing-smoke: Confirmed opennori init on a fresh project creates .opennori state,
  leaves active goals empty, and returns initialized_no_active_contract with next guidance to turn the
  stated goal into human-centered AC rather than inspect empty directories or repeat setup.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-15T08:02:36.952Z
- Sources:
  - type=command, label=tmp=$(mktemp -d /tmp/opennori-step2-fix-XXXXXX); node ./bin/opennori.js init --root "$tmp"
    --confirm --json; node ./bin/opennori.js doctor --root "$tmp" --json, command=tmp=$(mktemp -d
    /tmp/opennori-step2-fix-XXXXXX); node ./bin/opennori.js init --root "$tmp" --confirm --json; node
    ./bin/opennori.js doctor --root "$tmp" --json
  - type=command, label=npm run check, command=npm run check
  - type=artifact, label=src/agent-next.ts, path=src/agent-next.ts
  - type=artifact, label=plugins/opennori/skills/nori-project-health/SKILL.md,
    path=plugins/opennori/skills/nori-project-health/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-acceptance/SKILL.md,
    path=plugins/opennori/skills/nori-acceptance/SKILL.md
- Reviewability: Rerun the smoke and confirm .opennori/active is empty but agent_next.state is
  initialized_no_active_contract with recommended_skill nori-acceptance.
- Limitations: This validates local source behavior; published users need the next npm/plugin release to receive
  the updated routing text.

### AC-Z-20

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我让 agent 从已完成目标的 candidate_goals 继续生成下一份 Nori Contract 草案时，看到的不是空泛候选包装，而是能指导我怎么验收的用户动作、结果和通过标准。
- Measurement: 运行 opennori draft --from-next-candidate 生成 opennori-adoption-dogfood、real-user-validation 或
  next-loop-usability 草案，并阅读每条 AC 的 measurement 和 threshold。
- Passing threshold: 草案仍保持 draft/ACCEPTANCE-BASIS 待用户批准；每条 AC 的 measurement/threshold
  说明用户入口、操作、报告/证据复查或摩擦点判断方式；不再出现“按这条候选方向检查新的目标结果、状态或报告”这类空泛模板。
- Evidence: behavior-test: Draft Nori Contracts now keep workflow status as draft until user approval; temporary
  project draft output and the Agent Workbench draft both show ledger.status=draft while AC rows
  remain unknown.
- Basis: protocol-check
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-17T09:18:38.874Z
- Sources:
  - type=command, label=npx vitest run test/core.test.js -t 'draft requires user approval|next-loop candidates',
    command=npx vitest run test/core.test.js -t 'draft requires user approval|next-loop candidates'
  - type=command, label=tmp project: opennori draft reports ledger_status=draft and current_gap=ACCEPTANCE-BASIS,
    command=tmp project: opennori draft reports ledger_status=draft and current_gap=ACCEPTANCE-BASIS
  - type=artifact, label=src/core/contract.ts, path=src/core/contract.ts
  - type=artifact, label=src/core/evidence.ts, path=src/core/evidence.ts
  - type=artifact, label=test/core.test.js, path=test/core.test.js
- Reviewability: Inspect the listed files and rerun the targeted vitest command or create a temporary draft contract.
- Limitations: This evidence covers draft workflow semantics, not the subjective quality of each drafted AC.

### AC-D-1

- Layer: acceptance
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我运行 opennori dashboard --root . 并打开本地页面后，能不用阅读 CLI 日志就看出当前由哪个 agent/Skill
  在推进、目标是什么、当前验收缺口是什么、是否需要我介入、Architecture Baseline 是否有效，以及当前完成判断。
- Measurement: 启动 dashboard，触发或模拟 agent activity，分别查看桌面与窄屏页面的首屏状态。
- Passing threshold: 页面以视觉化 acceptance loop 和少量状态面板展示 agent activity、goal、current gap、need user、architecture
  decision、completion decision 和 latest event；有活动动效但不呈现聊天记录、过程任务列表、证据账本或完成权威入口；状态变化来自 /api/snapshot 与
  /api/events。
- Evidence: dashboard-outcome-hud-verification: Dashboard first screen now leads with Outcome Overview,
  Decision, Current gap, Next, and Project Profile impact. The kernel snapshot exposes outcome_summary
  so the UI does not force users to infer completion from radar nodes, event logs, or the Project
  Profile drawer.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-22T01:08:33.731Z
- Sources:
  - type=command, label=npx tsc --noEmit --pretty false, command=npx tsc --noEmit --pretty false
  - type=command, label=npm run test:dashboard, command=npm run test:dashboard
  - type=artifact, label=src/kernel/snapshot.ts, path=src/kernel/snapshot.ts
  - type=artifact, label=src/dashboard/src/App.tsx, path=src/dashboard/src/App.tsx
  - type=artifact, label=src/dashboard/src/types.ts, path=src/dashboard/src/types.ts
  - type=artifact, label=src/types.ts, path=src/types.ts
  - type=artifact, label=test/cli-dashboard.test.js, path=test/cli-dashboard.test.js
  - type=artifact, label=dashboard/index.html, path=dashboard/index.html
  - type=artifact, label=output/playwright/dashboard-outcome-hud.png,
    path=output/playwright/dashboard-outcome-hud.png
- Reviewability: Run opennori dashboard --root . and inspect the left HUD. It should show Outcome Overview, Decision,
  Current gap, Next, and Project Profile impact before agent activity or event logs. Check
  /api/snapshot for outcome_summary and rerun dashboard tests.
- Limitations: This evidence verifies the current OpenNori self dashboard on localhost and keeps the screenshot in
  ignored local output. It does not test every possible external project profile combination visually.

### AC-D-2

- Layer: acceptance
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我打开 OpenNori dashboard 观察 agent 工作时，agent 使用 OpenNori Skill 推进当前验收缺口后，我能看到 live activity 显示
  agent、Skill、目标、当前 gap、状态和摘要；如果有多个 active goals，agent 不会把活动误绑定到错误目标。
- Measurement: 在包含单个和多个 active goals 的项目中运行 activity start/heartbeat/finish，并查看 activity show、dashboard snapshot 和
  agent_next.dashboard_activity。
- Passing threshold: Skill 可从 agent_next.dashboard_activity 或低参数 activity 命令发布 start/heartbeat/finish；唯一当前 gap 可自动绑定
  goal/gap，多目标歧义返回明确恢复动作；activity 只进入 .opennori/activity/events/snapshots，不改变 evidence/report
  completion。
- Evidence: dashboard-activity-workflow: OpenNori now gives Skills a dashboard_activity routing surface, lets
  activity start/heartbeat/finish infer the unique current goal/gap, refuses ambiguous multi-goal
  activity, and keeps activity out of evidence/completion state.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-16T07:58:26.468Z
- Sources:
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js status --root . --goal opennori-self --json, command=node
    ./bin/opennori.js status --root . --goal opennori-self --json
  - type=command, label=tmp=$(mktemp -d /tmp/opennori-activity-smoke-XXXXXX); node ./bin/opennori.js draft --root
    "$tmp" --goal "Ship dashboard activity" --json >/dev/null; node ./bin/opennori.js approve --root "$tmp"
    --summary "Approved" --json >/dev/null; node ./bin/opennori.js activity start --root "$tmp" --skill
    nori-evidence --state verifying --summary "Verifying the current gap" --json, command=tmp=$(mktemp -d
    /tmp/opennori-activity-smoke-XXXXXX); node ./bin/opennori.js draft --root "$tmp" --goal "Ship dashboard
    activity" --json >/dev/null; node ./bin/opennori.js approve --root "$tmp" --summary "Approved" --json
    >/dev/null; node ./bin/opennori.js activity start --root "$tmp" --skill nori-evidence --state verifying
    --summary "Verifying the current gap" --json
  - type=artifact, label=src/agent-next.ts, path=src/agent-next.ts
  - type=artifact, label=src/kernel/activity.ts, path=src/kernel/activity.ts
  - type=artifact, label=src/cli/commands/activity.ts, path=src/cli/commands/activity.ts
  - type=artifact, label=src/kernel/snapshot.ts, path=src/kernel/snapshot.ts
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Rerun npm run check, inspect status agent_next.dashboard_activity for an explicit goal, run the
  temporary activity smoke to see inferred goal/gap in snapshot, and inspect tests that prove
  ambiguous multi-goal activity fails closed without writing evidence.
- Limitations: This verifies the local CLI/Skill protocol and dashboard projection behavior. It does not prove a
  human watched a real long-running external project through the dashboard; that remains a broader
  dogfood scenario.

### AC-D-3

- Layer: acceptance
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我打开 OpenNori dashboard 观察 agent 执行时，首屏就能看出当前 agent 是否正在活动、使用哪个
  Skill、正在推进哪个验收缺口，以及活动是否已经过期；我不需要展开详情面板或阅读事件日志才能判断当前执行态。
- Measurement: 启动 dashboard，分别模拟 active activity、waiting user、expired/idle activity，在桌面和窄屏截图中查看首屏状态。
- Passing threshold: 首屏有清晰的 live activity 主视觉：显示 agent/Skill、state、summary、current gap、last seen 或 stale
  标记；active/verifying 有明显但不过度的动效，idle/expired 降低视觉权重；不新增聊天记录、过程任务列表、证据账本或完成权威入口。
- Evidence: dashboard-execution-presence-review: Dashboard event focus now follows execution-relevant OpenNori
  events beyond activity.started: ac.finished, evidence.added, architecture.changed, profile.changed,
  gap.changed, report.generated, and activity.finished can refresh the selected current gap, while
  idle snapshots still show the last agent event instead of looking disconnected.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-20T13:58:33.394Z
- Sources:
  - type=command, label=npm run typecheck:dashboard, command=npm run typecheck:dashboard
  - type=command, label=npm run test:quick, command=npm run test:quick
  - type=command, label=npm run test:dashboard, command=npm run test:dashboard
  - type=artifact, label=src/dashboard/src/api.ts, path=src/dashboard/src/api.ts
  - type=artifact, label=src/dashboard/src/selection.ts, path=src/dashboard/src/selection.ts
  - type=artifact, label=src/dashboard/src/App.tsx, path=src/dashboard/src/App.tsx
  - type=artifact, label=test/dashboard-selection.test.ts, path=test/dashboard-selection.test.ts
- Reviewability: Run the listed dashboard tests and inspect selection.ts to confirm event-to-gap focus behavior; open
  the dashboard during agent activity to see current execution state and latest agent event without
  reading raw logs first.
- Limitations: This covers event focus and visible execution presence for the dashboard projection. It does not
  turn the dashboard into an agent runtime or completion authority.

### AC-D-4

- Layer: acceptance
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在 OpenNori dashboard 看到需要用户介入时，页面只告诉我应该回到 agent 对话里确认、修改或豁免，而不会提供 dashboard 内的确认、拒绝、waive
  或写状态按钮。
- Measurement: 启动 dashboard，制造 need_user / waiting_user 状态，检查页面首屏和控制区；同时对常见确认型 dashboard API 路径发送 POST。
- Passing threshold: 页面清楚显示 dashboard 是 observation surface / reply in agent chat；可见控件只用于刷新或查看快照；POST
  /api/confirm、/api/approve、/api/waive、/api/evidence、/api/activity 等控制型请求返回 method_not_allowed；Product
  AC、evidence、profile、architecture 和 report 状态只能由 agent 对话中的 OpenNori Skill/CLI 路径写入。
- Evidence: dashboard-observation-boundary: Dashboard now presents user intervention as an agent-conversation
  reply boundary, not an in-dashboard confirmation flow. The built React app shows Agent reply /
  Control boundary / reply in agent chat, packaged Skills and docs forbid dashboard confirmation
  controls, and dashboard HTTP rejects confirmation-style POST control paths with method_not_allowed.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-16T10:12:26.488Z
- Sources:
  - type=command, label=npm run typecheck:dashboard && npm run build:dashboard && npx vitest run
    test/cli-commands.test.js -t "dashboard rejects non-GET|dashboard exposes observation only|dashboard serves the
    built React app|dashboard command can start|dashboard SSE emits", command=npm run typecheck:dashboard && npm run
    build:dashboard && npx vitest run test/cli-commands.test.js -t "dashboard rejects non-GET|dashboard exposes
    observation only|dashboard serves the built React app|dashboard command can start|dashboard SSE emits"
  - type=command, label=npm run check, command=npm run check
  - type=artifact, label=src/dashboard/src/App.tsx, path=src/dashboard/src/App.tsx
  - type=artifact, label=src/dashboard/src/components/AcceptanceLoop.tsx,
    path=src/dashboard/src/components/AcceptanceLoop.tsx
  - type=artifact, label=src/kernel/http/app.ts, path=src/kernel/http/app.ts
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=AGENTS.md, path=AGENTS.md
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-reporting/SKILL.md,
    path=plugins/opennori/skills/nori-reporting/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-project-health/SKILL.md,
    path=plugins/opennori/skills/nori-project-health/SKILL.md
  - type=artifact, label=plugins/opennori/.codex-plugin/plugin.json, path=plugins/opennori/.codex-plugin/plugin.json
- Reviewability: Run npm run check, inspect the dashboard bundle/source for Agent reply and reply in agent chat, and
  rerun the dashboard control-write tests to confirm POST confirmation endpoints are rejected.
- Limitations: This verifies the current local dashboard and package assets. It does not add a browser screenshot
  for a forced need_user fixture, and future UI work must keep the same observation-only boundary.

### AC-Z-21

- Layer: productization
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我对 agent 说“验收标准用中文”或“write this contract in English”后，能在 agent 展示的发现问题、Nori
  Contract、status/report 摘要和下一轮候选目标中看到我要求的语言；如果我已经有一份批准过的契约，OpenNori 不会在我未确认时把它改成另一种语言。
- Measurement: 在对话或命令输出中分别生成中文和英文的 brainstorm、discover、draft、status/report/next-candidate 内容；再用一个已有 current
  contract 做普通证据写入和显式语言确认，观察可读契约标题、字段说明和报告/候选目标语言变化。
- Passing threshold: 新目标的可读内容按用户要求显示中文或英文；用户不需要记忆底层参数；旧 contract 在普通 status/report/check/evidence
  写入后仍保持原展示语言；只有用户明确批准改变展示语言后，后续契约和报告才显示新语言；底层协议字段保持稳定，不影响 agent 继续读取状态。
- Evidence: project-profile-language-boundary-review: OpenNori preserves language preference across
  user-reviewable contract assets and Project Profile prose: packaged Skills route wrong-language
  Project Profile and project Architecture Profile content back to profile/architecture Skills; stable
  ids and protocol fields remain English, and CLI does not auto-translate existing approved contracts
  without explicit user-approved revision.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-21T13:35:19.621Z
- Sources:
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-acceptance/SKILL.md,
    path=plugins/opennori/skills/nori-acceptance/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-autogoal/SKILL.md,
    path=plugins/opennori/skills/nori-autogoal/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-capability-profile/SKILL.md,
    path=plugins/opennori/skills/nori-capability-profile/SKILL.md
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Inspect packaged Skills, README, protocol, and .opennori/profile/README.md. Confirm language
  preference is handled in Skill/user-review behavior, Project Profile user-readable prose is treated
  as project-level content, and protocol field names remain stable English.
- Limitations: This verifies product rules and current assets. It does not implement CLI auto-translation, by
  design; wrong-language prose is corrected through Skill-driven revision and user confirmation.

### AC-O-9

- Layer: operator
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我给 agent 一个粗略 idea 并要求使用 OpenNori autogoal 后，最终看到并批准的是标准 Nori Contract Draft，而不是新的 autogoal
  专用产物、MVP/第一版/原型、过程计划或任务列表。
- Measurement: 用户在 Codex 对话中说“用 OpenNori autogoal 把这个 idea 变成可验收目标”，agent 读取项目上下文并输出标准 Nori Contract Draft；用户检查
  packaged Skills、Plugin manifest、README/protocol 和生成的 draft 形态。
- Passing threshold: autogoal 由 packaged Skill 驱动，并明确要求保持用户完整意图、不把大目标降级为 MVP/第一版/原型；输出形态与手动多轮澄清后的 Nori Contract Draft
  一致，包含 Goal、用户视角 AC、Measure/Passes when、假设和只影响完成定义的问题；approve 后进入普通 OpenNori current
  gap/evidence/status/report 生命周期；CLI 只保存标准 draft 或 brief source，不把主观 AC 质量写成硬 validator。
- Evidence: review-result: OpenNori autogoal is implemented as a packaged Skill-driven convergence mode that
  outputs the standard Nori Contract Draft. The root and acceptance Skills route rough-idea/autogoal
  requests to nori-autogoal, the new Skill instructs agents to preserve the full idea and avoid
  MVP/phase/task-list downgrades, draft --brief renders assumptions and open questions in ordinary
  acceptance markdown, and README plus the public site explain the user-facing behavior.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-18T07:11:52.007Z
- Sources:
  - type=architecture-apply, label=ac-o-9-autogoal-standard-contract-draft,
    path=/Users/jarl/code/jarlone/opennori/.opennori/architecture/evidence/ac-o-9-autogoal-standard-contract-draft.j
    son, summary=Architecture Baseline alignment context. This is not Product AC evidence by itself., role=context
  - type=command, label=npm run check, command=npm run check
  - type=command, label=pnpm build (opennori-site), command=pnpm build (opennori-site)
  - type=artifact, label=plugins/opennori/skills/nori-autogoal/SKILL.md,
    path=plugins/opennori/skills/nori-autogoal/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-acceptance/SKILL.md,
    path=plugins/opennori/skills/nori-acceptance/SKILL.md
  - type=artifact, label=src/core/contract.ts, path=src/core/contract.ts
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=/Users/jarl/code/jarlone/opennori-site/src/pages/index.astro,
    path=/Users/jarl/code/jarlone/opennori-site/src/pages/index.astro
- Reviewability: Rerun npm run check in /Users/jarl/code/jarlone/opennori, rerun pnpm build in
  /Users/jarl/code/jarlone/opennori-site, inspect the packaged nori-autogoal/root/acceptance Skills,
  and inspect the core.test autogoal brief case showing a normal Nori Contract Draft with assumptions
  and open questions.
- Limitations: This verifies local implementation, packaged Skill behavior text, CLI standard draft rendering,
  README, and site content. It does not publish a new npm package or deploy the website in this slice,
  and future agent output quality still depends on the loaded Skill and user approval.

### AC-O-10

- Layer: operator
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在非 OpenNori 项目里已经和 agent 讨论过目标和 AC 后，要求 OpenNori 接管这段讨论时，最终看到的是基于已有讨论整理出的标准 Nori Contract
  Draft，并且状态保持 draft/need user，而不是重新 autogoal、直接开始实现或把讨论记录当作完成证据。
- Measurement: 用户在 agent 对话中提供已有目标、AC、假设和未决问题后，说‘用 OpenNori 接管我们刚才讨论的 AC，整理成 Nori Contract Draft，不要开始实现，先给我确认。’
- Passing threshold: agent 使用 nori-acceptance 将已有讨论材料整理为标准 draft Nori Contract，写入 .opennori/drafts，展示
  Goal、AC、衡量方式、通过条件、假设和开放问题；status/report 表达 need user approve/revise，不进入 current/active、不记录 passing
  evidence、不走 autogoal 的粗略 idea 收敛路径。
- Evidence: review-result: OpenNori now supports adopting an in-progress AC discussion as a standard draft Nori
  Contract. The root nori Skill routes 'take over the AC we just discussed' to nori-acceptance,
  nori-acceptance prepares a brief with acceptance_basis.source conversation and writes only
  .opennori/drafts via draft --brief, nori-autogoal explicitly hands off already discussed AC material
  instead of treating it as a rough idea, and docs/site/default prompts show the user-facing phrase.
  Objective tests verify the adopted conversation brief remains draft with ACCEPTANCE-BASIS as current
  gap, no current contract, assumptions/open questions rendered, and no
  implementation/task-list/autogoal artifact wording.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-18T08:22:44.589Z
- Sources:
  - type=architecture-apply, label=opennori-self-ac-o-10-aligned,
    path=.opennori/architecture/evidence/opennori-self-ac-o-10-aligned.json, summary=Architecture Baseline alignment
    context. This is not Product AC evidence by itself., role=context
  - type=command, label=npm run check, command=npm run check
  - type=command, label=pnpm build (opennori-site), command=pnpm build (opennori-site)
- Reviewability: Rerun npm run check in /Users/jarl/code/jarlone/opennori, rerun pnpm build in
  /Users/jarl/code/jarlone/opennori-site, inspect the packaged nori/nori-acceptance/nori-autogoal
  Skills and test/core.test.js conversation adoption brief test, then verify README/site examples show
  the natural-language adoption prompt.
- Limitations: This verifies local source, packaged Skill behavior, deterministic draft state, tests, and website
  text. It does not publish npm or deploy the website in this slice; future agent behavior still
  depends on the installed Plugin cache being synced to this version.

### AC-O-11

- Layer: operator
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我给 agent 一个包含页面、应用、Dashboard、Desktop、工作台、表单或其他可见交互界面的目标时，OpenNori 能引导 agent 自动挖掘 UI/UX
  体验验收，而不是只生成数据、状态或功能完成 AC。
- Measurement: 阅读 nori、nori-acceptance、nori-autogoal packaged Skills、OpenNori protocol、README 和自验收报告，并用界面类目标检查
  agent 应追问或补齐哪些体验维度。
- Passing threshold: Skills 明确要求界面类目标覆盖入口与导航、信息层级、空态/加载/错误/成功状态、操作反馈、可读性、视觉一致性、恢复路径和不应暴露的 UI 边界；这些要求以 agent
  行为协议和用户确认表达，不写成 CLI hard validator 或固定词表测试。
- Evidence: review-result: OpenNori now directs visible interface goals through UI/UX acceptance discovery as
  packaged Skill behavior rather than CLI subjective validation. The root nori Skill routes missing
  UI/UX AC and interface-only functional AC back to nori-acceptance; nori-acceptance requires
  agent/user discovery for interface entry, navigation, hierarchy, states, feedback, readability,
  consistency, recovery, and UI boundaries; nori-autogoal includes the same UX acceptance dimensions
  when deriving a standard Nori Contract Draft from a rough interface idea. README, AGENTS, protocol,
  self contract, and the website explain the behavior, and objective tests verify the packaged Skill
  assets and AC-O-11 without encoding a UI-quality word list.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-18T12:54:18.347Z
- Sources:
  - type=architecture-apply, label=ac-o-11-visible-interface-ux-discovery,
    path=.opennori/architecture/evidence/ac-o-11-visible-interface-ux-discovery.json, summary=Architecture Baseline
    alignment context. This is not Product AC evidence by itself., role=context
  - type=command, label=npx vitest run test/core.test.js -t "Codex Plugin manifest exposes OpenNori Skills for agent
    discovery|protocol v1 example contains concrete user tool operations", command=npx vitest run test/core.test.js
    -t "Codex Plugin manifest exposes OpenNori Skills for agent discovery|protocol v1 example contains concrete user
    tool operations"
  - type=command, label=git diff --check, command=git diff --check
  - type=command, label=pnpm build (in /Users/jarl/code/jarlone/opennori-site), command=pnpm build (in
    /Users/jarl/code/jarlone/opennori-site)
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-acceptance/SKILL.md,
    path=plugins/opennori/skills/nori-acceptance/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-autogoal/SKILL.md,
    path=plugins/opennori/skills/nori-autogoal/SKILL.md
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=AGENTS.md, path=AGENTS.md
  - type=artifact, label=examples/opennori-self.json, path=examples/opennori-self.json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=/Users/jarl/code/jarlone/opennori-site/src/pages/index.astro,
    path=/Users/jarl/code/jarlone/opennori-site/src/pages/index.astro
- Reviewability: Inspect the referenced Skills and docs for the agent behavior protocol, inspect
  examples/opennori-self.json for AC-O-11, rerun the targeted Vitest command and git diff --check in
  the OpenNori repo, then run pnpm build in opennori-site to verify the public messaging compiles.
- Limitations: This proves OpenNori's packaged capability now instructs agents to discover UI/UX acceptance for
  visible interface goals and keeps that judgment outside CLI hard validators. It does not prove every
  future agent will ask perfect UX questions; users still approve or revise each Nori Contract.

### AC-O-12

- Layer: operator
- Status: passing
- Confidence: high
- User acceptance criterion: 作为用户，我告诉 agent 要做完整产品、完整功能闭环、完整应用、完整 Dashboard 或完整工作台时，OpenNori 会让 agent 充分展开用户可验收 AC，而不是默认压缩成少量
  MVP、第一版或 happy-path AC。
- Measurement: 阅读 nori、nori-acceptance、nori-autogoal packaged Skills、本机 OpenNori 开发 Skills、OpenNori
  protocol、README、官网和自验收报告；用完整产品类目标检查 agent 是否会覆盖足够的验收面，并让用户显式确认保留完整闭环或缩小范围。
- Passing threshold: Skills 明确要求完整产品类目标默认展开完整验收面，包括用户角色、入口与导航、核心工作流、状态转换、数据规则、权限与边界、失败与恢复、持久化、UI/UX、报告或审查方式；AC
  数量可以按目标需要增加，执行仍按当前缺口推进；只有用户明确要求原型、MVP、第一版或缩小范围时，agent 才能压缩完成定义；该规则只写入 Skill 行为协议、文档、用户确认和资产测试，不写成
  CLI hard validator 或固定自然语言词表。
- Evidence: review-result: OpenNori now instructs agents to expand complete product, complete feature, full app,
  full dashboard, and full workbench goals into a full human-reviewable acceptance surface instead of
  a compact MVP-style AC set. The rule is present in packaged Skills, local development Skills,
  protocol, README, Plugin prompt, objective asset tests, self example, and the public website
  content.
- Basis: artifact-review
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-18T13:53:05.841Z
- Sources:
  - type=architecture-apply, label=ac-o-12-full-product-acceptance-surface,
    path=.opennori/architecture/evidence/ac-o-12-full-product-acceptance-surface.json, summary=Architecture Baseline
    alignment context. This is not Product AC evidence by itself., role=context
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-acceptance/SKILL.md,
    path=plugins/opennori/skills/nori-acceptance/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-autogoal/SKILL.md,
    path=plugins/opennori/skills/nori-autogoal/SKILL.md
  - type=artifact, label=/Users/jarl/code/jarlone/.agents/skills/nori-product-development/SKILL.md,
    path=/Users/jarl/code/jarlone/.agents/skills/nori-product-development/SKILL.md
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
  - type=artifact, label=AGENTS.md, path=AGENTS.md
  - type=artifact, label=examples/opennori-self.json, path=examples/opennori-self.json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=/Users/jarl/code/jarlone/opennori-site/src/pages/index.astro,
    path=/Users/jarl/code/jarlone/opennori-site/src/pages/index.astro
- Reviewability: Review the listed Skill, documentation, example, test, and website files. Run the targeted asset
  tests and website build to confirm the rule remains present without adding a CLI subjective
  validator.
- Limitations: This evidence proves the OpenNori product assets and user-facing website now express the
  complete-product acceptance behavior. It does not prove that every future agent will apply the Skill
  perfectly, and it intentionally does not add a hard-coded natural-language AC quality validator.

### AC-O-13

- Layer: operator
- Status: passing
- Confidence: high
- User acceptance criterion: 作为用户，我用 OpenNori autogoal 定义完整产品、完整 Dashboard 或完整工作台时，agent 在写入 Nori Contract Draft
  前会先做验收面覆盖自检，并把独立用户判断面拆成独立 AC，而不是把项目概览、资产、记忆、能力、知识库、检索、审计、UI 状态和恢复路径压进少量大 AC。
- Measurement: 阅读 nori、nori-acceptance、nori-autogoal packaged Skills、本机开发 Skills、OpenNori protocol、README、官网和测试资产；用
  AW 完整项目工作台提示词检查 agent 是否会先列出 coverage map，再生成足够细分的标准 Nori Contract Draft。
- Passing threshold: Skills 明确要求完整产品类 autogoal 在 draft 前执行 coverage self-check，覆盖用户角色、入口/导航、项目列表与切换、核心对象列表与详情、只读预览、状态与空态/
  加载/错误/成功、来源/审计、记忆、能力、外部知识库、检索、权限/安全边界、持久化、失败恢复和最终 review/report；如果一条 AC 混入多个独立用户判断面，agent
  必须拆分或标为需修订；旧的压缩 draft 不能被 approve，应重新生成。该规则仍属于 Skill 行为协议、用户确认和资产测试，不写成 CLI hard validator
  或自然语言质量词表。
- Evidence: review-result: OpenNori now requires complete-product autogoal coverage self-check before draft
  approval through packaged Skills, local development Skills, protocol, docs, website copy, and asset
  tests. The rules tell agents to map user-visible surfaces to planned AC boundaries, split unrelated
  user judgments, and route compressed drafts back to acceptance revision instead of asking for
  approval.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-18T15:18:18.106Z
- Sources:
  - type=architecture-apply, label=ac-o-13-autogoal-coverage-self-check,
    path=.opennori/architecture/evidence/ac-o-13-autogoal-coverage-self-check.json, summary=Architecture Baseline
    alignment context. This is not Product AC evidence by itself., role=context
  - type=command, label=npx vitest run test/core.test.js -t 'protocol v1 example contains concrete user tool
    operations|Codex Plugin manifest exposes OpenNori Skills for agent discovery', command=npx vitest run
    test/core.test.js -t 'protocol v1 example contains concrete user tool operations|Codex Plugin manifest exposes
    OpenNori Skills for agent discovery'
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node ./bin/opennori.js plugin sync --local --confirm --json, command=node ./bin/opennori.js
    plugin sync --local --confirm --json
  - type=command, label=rg -n 'coverage self-check|coverage map|independent user judgment|bundles unrelated
    surfaces|覆盖面自检' /Users/jarl/.codex/plugins/cache/opennori/opennori/0.1.9/skills, command=rg -n 'coverage
    self-check|coverage map|independent user judgment|bundles unrelated surfaces|覆盖面自检'
    /Users/jarl/.codex/plugins/cache/opennori/opennori/0.1.9/skills
  - type=command, label=pnpm build in /Users/jarl/code/jarlone/opennori-site, command=pnpm build in
    /Users/jarl/code/jarlone/opennori-site
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-acceptance/SKILL.md,
    path=plugins/opennori/skills/nori-acceptance/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-autogoal/SKILL.md,
    path=plugins/opennori/skills/nori-autogoal/SKILL.md
  - type=artifact, label=/Users/jarl/code/jarlone/.agents/skills/nori/SKILL.md,
    path=/Users/jarl/code/jarlone/.agents/skills/nori/SKILL.md
  - type=artifact, label=/Users/jarl/code/jarlone/.agents/skills/nori-acceptance/SKILL.md,
    path=/Users/jarl/code/jarlone/.agents/skills/nori-acceptance/SKILL.md
  - type=artifact, label=/Users/jarl/code/jarlone/.agents/skills/nori-autogoal/SKILL.md,
    path=/Users/jarl/code/jarlone/.agents/skills/nori-autogoal/SKILL.md
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=AGENTS.md, path=AGENTS.md
  - type=artifact, label=examples/opennori-self.json, path=examples/opennori-self.json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=/Users/jarl/code/jarlone/opennori-site/src/pages/index.astro,
    path=/Users/jarl/code/jarlone/opennori-site/src/pages/index.astro
- Reviewability: Review the referenced packaged Skills, local development Skills, protocol, README, AGENTS, self
  example, tests, website copy, and synced plugin cache. Rerun the targeted Vitest command, npm run
  check, plugin cache rg check, and opennori-site pnpm build.
- Limitations: This proves OpenNori capability assets and local plugin cache now instruct agents to run coverage
  self-check and split complete-product AC before approval. It intentionally does not add CLI
  subjective AC quality scoring, and future draft quality still depends on the loaded Skill and user
  approval.

### AC-A-11

- Layer: architecture
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我让 agent 处理一个 OpenNori goal 时，能看到 Architecture Baseline 是否需要由 agent/user 明确判断并记录，而不是 CLI 因为存在
  goal 就默认所有 AC 都必须走架构 review。
- Measurement: 分别用简单 goal、非平凡 goal 和用户 waiver 场景检查 status/check/agent_next、architecture show、README/Skills 和测试；确认简单
  goal 可以记录 architecture not_required 并直接进入 evidence，非平凡 goal 记录 required 后才路由 baseline，waiver 有明确
  reason 和 review 风险表达。
- Passing threshold: OpenNori 提供 architecture requirement 状态（unknown/required/not_required/waived）和记录入口；Skill 要求 agent
  判断非平凡性并写入该状态；CLI 不再用 Boolean(goalId) 作为是否需要 baseline 的依据，只根据已记录
  requirement、baseline、challenge、build-vs-buy 和 evidence 状态做确定性路由；该机制不把技术架构写成 Product AC，也不让 CLI
  通过自然语言硬判非平凡。
- Evidence: review-result: OpenNori now records Architecture Requirement as explicit agent/user state and no
  longer treats Boolean(goalId) as requiring Architecture Baseline. Unknown routes to
  architecture_requirement_needs_decision; required routes to baseline review or current-gap work when
  baseline is valid; not_required routes to Product AC evidence; waived continues with review risk.
  Packaged Skills, README, protocol, AGENTS, schema, check/doctor/status/report/agent_next, and tests
  were updated.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-19T03:21:27.488Z
- Sources:
  - type=architecture-apply, label=ac-a-11-architecture-requirement-routing,
    path=/Users/jarl/code/jarlone/opennori/.opennori/architecture/evidence/ac-a-11-architecture-requirement-routing.
    json, summary=Architecture Baseline alignment context. This is not Product AC evidence by itself., role=context
  - type=command, label=npm run typecheck, command=npm run typecheck
  - type=command, label=npx vitest run test/core.test.js --testNamePattern
    'architecture|requirement|doctor|schema|high-risk|build-vs-buy|context export', command=npx vitest run
    test/core.test.js --testNamePattern 'architecture|requirement|doctor|schema|high-risk|build-vs-buy|context
    export'
  - type=command, label=npx vitest run test/cli-commands.test.js test/core.test.js --testNamePattern '^(?!.*human
    output summarizes doctor check status report and dashboard).*(architecture|requirement|doctor|schema|check
    command module|resume command module|status command module|report command module|high-risk|build-vs-buy|context
    export).*', command=npx vitest run test/cli-commands.test.js test/core.test.js --testNamePattern '^(?!.*human
    output summarizes doctor check status report and dashboard).*(architecture|requirement|doctor|schema|check
    command module|resume command module|status command module|report command module|high-risk|build-vs-buy|context
    export).*'
  - type=artifact, label=src/architecture/requirement.ts, path=src/architecture/requirement.ts
  - type=artifact, label=src/cli/commands/architecture/requirement.ts,
    path=src/cli/commands/architecture/requirement.ts
  - type=artifact, label=schemas/architecture-requirement.schema.json,
    path=schemas/architecture-requirement.schema.json
  - type=artifact, label=plugins/opennori/skills/nori-architecture-brainstorm/SKILL.md,
    path=plugins/opennori/skills/nori-architecture-brainstorm/SKILL.md
  - type=artifact, label=test/core.test.js, path=test/core.test.js
- Reviewability: Inspect the new requirement state schema/module/CLI, run status/check on
  required/not_required/waived fixtures, and rerun the listed typecheck and Vitest commands.
- Limitations: Full npm run check may still fail in this sandbox if tests attempt to bind the local dashboard
  server to 127.0.0.1; the relevant non-dashboard targeted suites passed.

### AC-A-12

- Layer: architecture
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我让 agent 用 OpenNori 起草、追问、记录证据或继续下一轮目标时，CLI 不会用内置自然语言模板、词表或候选目标替我判断主观产品语义；这些判断由 packaged
  Skills、agent 和用户确认完成。
- Measurement: 用户或评审者检查 opennori draft/discover/brainstorm/status/report/context export、CLI 源码、测试和 OpenNori Skills。
- Passing threshold: CLI 只校验和保存 contract/evidence/profile/architecture/report 的客观结构、状态一致性和 review risk；不再内置默认 Product
  AC、固定 discovery gap 词表、固定 brainstorm 候选、完成后自动生成下一轮产品目标，或把高风险证据强弱直接硬改为主观完成裁判；Skills 明确负责生成/复核
  AC、候选目标和证据充分性。
- Evidence: review-result: OpenNori validation is split into layered Vitest tags and npm scripts: npm
  test/test:quick runs a true fast smoke subset, domain scripts run
  acceptance/architecture/dashboard/docs/evidence/lifecycle/profile/reporting/schema tests, and
  check:full remains the release-grade full gate. Test-internal duplicate npm run build calls were
  removed from built-dist package tests so full validation does not rebuild twice inside Vitest.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-20T11:19:57.455Z
- Sources:
  - type=reference, label=command:npm run check
  - type=reference, label=command:npm run test:acceptance
  - type=reference, label=command:npm run test:schema
  - type=reference, label=command:npm run test:dashboard
  - type=reference, label=command:npm run test:package
  - type=reference, label=command:npm run test:architecture
  - type=reference, label=command:npm run check:full
  - type=reference, label=command:git diff --check
  - type=reference, label=artifact:package.json
  - type=reference, label=artifact:vitest.config.ts
  - type=reference, label=artifact:test/core.test.js
  - type=reference, label=artifact:test/cli-commands.test.js
  - type=reference, label=artifact:README.md
  - type=reference, label=artifact:AGENTS.md
- Reviewability: Review package scripts, Vitest tag config, test tags, README/AGENTS verification instructions, and
  rerun the listed commands.
- Limitations: Quick tests are intentionally a smoke subset; domain scripts and check:full remain required for
  broader changes, lifecycle/package boundaries, and release validation.

### AC-O-14

- Layer: operator
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在 agent 生成 Nori Contract Draft 后，不会一次面对一大段所有 AC 的理解，而是能从 AC-1 开始逐条确认 agent 对当前 AC
  的具体理解，全部确认后再决定 approve。
- Measurement: 阅读 nori、nori-acceptance、nori-autogoal packaged Skills、README、protocol、AGENTS、agent_next 输出和 draft
  next_actions，检查 draft 后是否要求 AC Review Loop：先概览，再逐条确认当前 AC。
- Passing threshold: agent 在请求最终 approve 前必须先展示 compact overview，然后一次只解释当前 AC
  的具体理解：精确用户入口、对象或字段、可见状态/提示/结果、不通过样例和具体证据对象；用户用 confirm AC-<n> 或 revise AC-<n>: ... 推进；全部 AC
  逐条确认前不得运行 approve；批量解释、早期 approve 或泛化理解不能作为批准依据；该规则只在 Skill 行为协议、文档、agent_next 提示和资产测试中表达，不写成 CLI 主观
  validator、实现计划或证据声明。
- Evidence: review-result: AC Review Loop now documents and tests the safe draft criterion add path, preventing
  agents from manually patching draft acceptance/evidence/manifest files when a missing AC is
  discovered.
- Basis: artifact-review
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-20T09:44:04.642Z
- Sources:
  - type=command, label=npx vitest run test/core.test.js -t 'criterion add|Codex Plugin manifest exposes OpenNori
    Skills|public product surfaces', command=npx vitest run test/core.test.js -t 'criterion add|Codex Plugin
    manifest exposes OpenNori Skills|public product surfaces'
  - type=command, label=npx vitest run test/cli-commands.test.js -t 'criterion add', command=npx vitest run
    test/cli-commands.test.js -t 'criterion add'
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-acceptance/SKILL.md,
    path=plugins/opennori/skills/nori-acceptance/SKILL.md
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
  - type=artifact, label=AGENTS.md, path=AGENTS.md
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=src/cli/commands/acceptance/criterion.ts, path=src/cli/commands/acceptance/criterion.ts
- Reviewability: Inspect the listed Skills, docs, CLI help text, and tests; rerun the two targeted Vitest commands to
  confirm draft criterion add keeps drafts unapproved and synchronized.
- Limitations: This verifies the packaged OpenNori assets and CLI behavior in this source checkout. Future Codex
  sessions need plugin sync or a published package update before the new Skill wording is loaded.

### AC-O-15

- Layer: operator
- Status: passing
- Confidence: high
- User acceptance criterion: 作为用户，我要求 OpenNori autogoal 增强模式或让 agent 先自己 grill 一个粗略想法时，agent 会先自行展开使用场景、假设、边界和关键问题，再把结果收敛成标准 Nori
  Contract Draft。
- Measurement: 阅读 nori、nori-autogoal packaged Skill、OpenNori protocol、README、官网和测试资产；用 todolist 这类粗略 idea 检查 agent
  是否先做 Enhanced Discovery，而不是直接生成少量泛化 AC 或向用户抛完整问卷。
- Passing threshold: Skills 明确要求增强 autogoal 仍是 Skill 行为而不是新 CLI 或新产物；agent
  自行展开用户角色、入口、场景、数据对象与规则、状态转换、非法输入、成功反馈、持久化、失败/恢复、UI/UX、复查方式、假设和
  out-of-scope；只把会改变完成定义的关键问题交给用户确认；最后仍写入标准 Nori Contract Draft，并进入逐条 AC Review Loop。
- Evidence: asset-review: Enhanced autogoal discovery is documented as nori-autogoal Skill behavior and surfaced
  in product docs/site/tests without adding a new CLI artifact.
- Basis: artifact_review
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-20T03:09:12.733Z
- Sources:
  - type=artifact, label=plugins/opennori/skills/nori-autogoal/SKILL.md,
    path=plugins/opennori/skills/nori-autogoal/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=examples/opennori-self.json, path=examples/opennori-self.json
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=../opennori-site/src/pages/index.astro, path=../opennori-site/src/pages/index.astro
- Reviewability: Review the listed assets for Enhanced Discovery, self-grill/todolist routing, standard Nori Contract
  Draft output, and no new CLI command or artifact.
- Limitations: This verifies packaged behavior instructions and documentation surfaces; real project quality still
  depends on the agent applying the Skill and the user confirming AC in conversation.

### AC-O-16

- Layer: operator
- Status: passing
- Confidence: high
- User acceptance criterion: 作为用户，我要求 OpenNori autogoal 增强模式后，能从 agent 回复、draft 状态和 report/status 中看出 Enhanced Discovery
  是否真的被使用，而不是只能相信 agent 自称用了增强模式。
- Measurement: 查看 nori-autogoal/nori Skills、OpenNori protocol、AGENTS、README、draft markdown/status/report 输出和测试。
- Passing threshold: 增强 autogoal 的用户可见回复必须包含 Enhanced Discovery checked；标准 Nori Contract Draft 的 acceptance_basis 必须持久化
  source=autogoal、mode=enhanced、coverage_summary、assumptions、open_questions 和可选 out_of_scope；opennori
  status/resume/report 和 acceptance markdown 能展示这些来源元数据；缺少该确认面时 Skill 不得要求用户 approve；该机制不创建新
  CLI、新产物、过程日志或主观 hard validator。
- Evidence: review-result: Enhanced autogoal now leaves a user-visible confirmation surface: Skill replies must
  show Enhanced Discovery checked, drafts persist source/mode/coverage metadata, and
  status/report/acceptance markdown expose that metadata for review.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-20T04:02:52.493Z
- Sources:
  - type=reference, label=artifact:plugins/opennori/skills/nori-autogoal/SKILL.md
  - type=reference, label=artifact:plugins/opennori/skills/nori/SKILL.md
  - type=reference, label=artifact:.opennori/protocol.md
  - type=reference, label=artifact:AGENTS.md
  - type=reference, label=artifact:README.md
  - type=reference, label=artifact:src/core/contract.ts
  - type=reference, label=artifact:src/core/report.ts
  - type=reference, label=artifact:src/cli/commands/acceptance/runtime-status.ts
  - type=reference, label=artifact:src/cli/commands/acceptance/draft.ts
  - type=reference, label=artifact:src/cli/human-output.ts
  - type=reference, label=artifact:test/core.test.js
  - type=reference, label=artifact:test/cli-commands.test.js
  - type=reference, label=artifact:../opennori-site/src/pages/index.astro
- Reviewability: Review the listed Skills, protocol, README, CLI rendering code, tests, and website copy; run the
  enhanced autogoal targeted Vitest command, npm run check, opennori status/check, and opennori-site
  pnpm build.
- Limitations: This verifies persisted and visible confirmation surfaces for enhanced autogoal. It intentionally
  does not make CLI judge whether the agent's scenario expansion is subjectively sufficient; users
  still review and confirm the draft.

### AC-O-17

- Layer: operator
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我在 draft 的 AC Review Loop 里修订某条 AC 后，OpenNori 仍然把这份 Nori Contract 保持为待确认草案，而不会把
  acceptance_basis 自动标成 approved、不会跳到 profile/architecture/implementation，也不会把修订本身当作 evidence。
- Measurement: 在一个带有 required Project Profile 的 draft 上运行 criterion update --from-draft，然后查看
  status/current_gap、draft evidence JSON、acceptance markdown、nori-acceptance Skill 和协议文档。
- Passing threshold: 修订 draft AC 后 acceptance_basis.status 仍为 draft，approved_at 不存在，source/mode/coverage 等 basis metadata
  保留，workflow_status 为 draft，current_gap 为 ACCEPTANCE-BASIS；只有最终 approve 后才能进入
  profile、architecture、implementation 或 evidence 路由。已批准 current contract 的 criterion update 仍会清理该 AC
  的旧 evidence 并产生新的 evidence gap。
- Evidence: draft-revision-boundary-verification: Draft criterion revision remains goal-dossier state while
  Project Profile is separate project state. The criterion update path synchronizes contract.json,
  ledger.json, criterion README/status, and manifest for draft/current AC revisions; Project Profile
  requirements are created through profile add under .opennori/profile and no longer embedded into
  draft ledgers. The acceptance tests exercise a draft with a required Project Profile preference and
  verify acceptance_basis remains draft after criterion update.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-21T13:27:23.872Z
- Sources:
  - type=architecture-apply, label=opennori-self-ac-o-17-project-profile-draft-revision,
    path=.opennori/architecture/evidence/opennori-self-ac-o-17-project-profile-draft-revision.json,
    summary=Architecture Baseline alignment context. This is not Product AC evidence by itself., role=context
  - type=command, label=npm run test:acceptance, command=npm run test:acceptance
  - type=command, label=npm run test:profile, command=npm run test:profile
  - type=command, label=npx tsc --noEmit --pretty false, command=npx tsc --noEmit --pretty false
  - type=artifact, label=src/cli/commands/acceptance/criterion.ts, path=src/cli/commands/acceptance/criterion.ts
  - type=artifact, label=src/cli/commands/profile/add.ts, path=src/cli/commands/profile/add.ts
  - type=artifact, label=test/cli-acceptance.test.js, path=test/cli-acceptance.test.js
  - type=artifact, label=test/cli-profile.test.js, path=test/cli-profile.test.js
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
  - type=artifact, label=AGENTS.md, path=AGENTS.md
- Reviewability: Inspect the listed command modules and tests. In test/cli-acceptance.test.js, verify the draft
  revision fixture creates Project Profile with profile add and still asserts acceptance_basis.status
  remains draft after criterion update. Rerun acceptance/profile tests and typecheck.
- Limitations: This proves state synchronization and Project Profile separation for draft AC revision. It does not
  replace the user's AC Review Loop confirmation of whether the revised AC wording is semantically
  correct.

### AC-O-18

- Layer: operator
- Status: passing
- Confidence: high
- User acceptance criterion: 作为用户，我给 agent 一个 UI、CRUD、Dashboard、表单、列表、设置页、管理台或其它可见产品目标时，OpenNori 能让所有相关 Skills 先守住可验收表面模型，再写
  AC、进入架构、记录证据、检查健康或报告完成，而不是生成、接受或绕过宽泛 outcome AC。
- Measurement: 阅读全部 packaged Skills：nori、nori-acceptance、nori-autogoal、nori-evidence、nori-reporting、nori-architectu
  re-brainstorm、nori-architecture-apply、nori-architecture-challenge、nori-build-vs-buy、nori-capability-
  profile、nori-project-health，以及 README、protocol、AGENTS 和资产测试；用项目 CRUD 目标检查新增、查看或选择、编辑、删除或解绑等 AC
  是否描述用户入口、可见触发、交互面、字段或规则、反馈、状态变化、失败或取消边界和证据形态，并确认 architecture/profile/build-vs-buy/health 不能绕过该建模。
- Passing threshold: Skills 把 Acceptance Surface Modeling 写成跨 Skill 的 agent runtime contract：draft、autogoal、AC Review
  Loop、evidence、reporting、architecture brainstorm/apply/challenge、build-vs-buy、capability profile 和
  project health 都必须在可见产品表面缺少 actor、entry、visible trigger、object、action、interaction surface、required
  information、feedback、state change、persistence、destructive boundary 或 evidence shape 时回到
  nori-acceptance；未知项要问单个会改变完成定义的问题，或写成明确假设进入 AC Review Loop；任何旁路都不能把宽泛 AC 当作 confidently
  acceptable；该机制不变成 CLI hard validator、固定目标类型词表、自然语言好坏单元测试或实现计划。
- Evidence: review-result: Acceptance Surface Modeling now covers all OpenNori packaged Skill bodies and
  frontmatter trigger descriptions. The root router and acceptance/autogoal Skills route broad
  UI/CRUD/dashboard/list/form/settings/admin goals into operation-path modeling; evidence/reporting
  refuse confident passing/completion without the modeled path; architecture
  brainstorm/apply/challenge, build-vs-buy, capability profile, and project health route missing
  product-surface semantics back to nori-acceptance instead of bypassing Product AC. The behavior
  remains Skill/user review plus asset tests, not a CLI hard validator or fixed natural-language
  AC-quality test.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-20T07:20:17.204Z
- Sources:
  - type=architecture-apply, label=opennori-self-ac-o-18-aligned,
    path=.opennori/architecture/evidence/opennori-self-ac-o-18-aligned.json, summary=Architecture Baseline alignment
    context. This is not Product AC evidence by itself., role=context
  - type=command, label=npx vitest run test/core.test.js --testNamePattern 'protocol v1 example|Codex Plugin
    manifest', command=npx vitest run test/core.test.js --testNamePattern 'protocol v1 example|Codex Plugin
    manifest'
  - type=command, label=npm run check, command=npm run check
  - type=command, label=node -e frontmatter skill metadata read-back, command=node -e frontmatter skill metadata
    read-back
  - type=command, label=git diff --check, command=git diff --check
  - type=artifact, label=plugins/opennori/skills/nori/SKILL.md, path=plugins/opennori/skills/nori/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-acceptance/SKILL.md,
    path=plugins/opennori/skills/nori-acceptance/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-autogoal/SKILL.md,
    path=plugins/opennori/skills/nori-autogoal/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-evidence/SKILL.md,
    path=plugins/opennori/skills/nori-evidence/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-reporting/SKILL.md,
    path=plugins/opennori/skills/nori-reporting/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-architecture-brainstorm/SKILL.md,
    path=plugins/opennori/skills/nori-architecture-brainstorm/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-architecture-apply/SKILL.md,
    path=plugins/opennori/skills/nori-architecture-apply/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-architecture-challenge/SKILL.md,
    path=plugins/opennori/skills/nori-architecture-challenge/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-build-vs-buy/SKILL.md,
    path=plugins/opennori/skills/nori-build-vs-buy/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-capability-profile/SKILL.md,
    path=plugins/opennori/skills/nori-capability-profile/SKILL.md
  - type=artifact, label=plugins/opennori/skills/nori-project-health/SKILL.md,
    path=plugins/opennori/skills/nori-project-health/SKILL.md
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=AGENTS.md, path=AGENTS.md
  - type=artifact, label=README.md, path=README.md
  - type=artifact, label=.opennori/protocol.md, path=.opennori/protocol.md
- Reviewability: Inspect every listed packaged Skill, especially frontmatter description and Misuse Guards. Rerun the
  targeted Vitest command, npm run check, the Node frontmatter read-back script, and git diff --check.
- Limitations: This proves the packaged Skill behavior protocols, trigger metadata, docs, and tests encode the
  operation-path boundary. It does not prove every future agent will ask perfect product questions;
  users still confirm or revise AC through the AC Review Loop.

### AC-D-5

- Layer: acceptance
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我打开 OpenNori dashboard 后，能点击顶部 Project Profile 图标，在右侧只读浮窗查看项目级 Profile 偏好，以及当前 goal
  对这些偏好的合规状态、阻塞项、review 风险和证据摘要。
- Measurement: 启动 dashboard，在有 current goal、没有 current goal、存在和不存在 Project Profile items 的项目中点击顶部 Project Profile
  图标，并切换 UI Panel / Raw JSON 查看浮窗内容。
- Passing threshold: 右侧 overlay 浮窗展示 Project Profile item 总数、must/prefer/avoid 分布、当前 goal compliance
  complete/blocking/review 状态、每个 item 的 type/name/strength/purpose/scope/install policy/latest
  compliance evidence；没有 current goal 时显示 Project Profile 已加载但合规未评价，而不是显示完成；没有 profile 时显示空态；浮窗只读，不提供
  add/check/evidence/waive/confirm 等写状态按钮；Profile 不被渲染为 Product AC 节点；打开或关闭浮窗前后，radar/main
  区域不重新分配布局宽度。
- Evidence: dashboard-project-profile-verification: Dashboard now exposes Project Profile as a readonly
  project-level overlay and evaluates compliance only when a current goal exists. The header button is
  labeled Inspect Project Profile, the profile node raw data distinguishes project_only from
  current_goal_compliance, no-current-goal snapshots still include Project Profile but mark compliance
  not evaluated, and the overlay stays read-only without add/check/evidence/waive/confirm controls.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-21T13:27:41.043Z
- Sources:
  - type=architecture-apply, label=opennori-self-ac-d-5-project-profile-dashboard,
    path=.opennori/architecture/evidence/opennori-self-ac-d-5-project-profile-dashboard.json, summary=Architecture
    Baseline alignment context. This is not Product AC evidence by itself., role=context
  - type=command, label=npm run test:dashboard, command=npm run test:dashboard
  - type=command, label=npm run test:profile, command=npm run test:profile
  - type=command, label=npx tsc --noEmit --pretty false, command=npx tsc --noEmit --pretty false
  - type=command, label=node ./bin/opennori.js check --root . --json, command=node ./bin/opennori.js check --root .
    --json
  - type=artifact, label=src/kernel/snapshot.ts, path=src/kernel/snapshot.ts
  - type=artifact, label=src/dashboard/src/App.tsx, path=src/dashboard/src/App.tsx
  - type=artifact, label=src/dashboard/src/selection.ts, path=src/dashboard/src/selection.ts
  - type=artifact, label=src/dashboard/src/components/InspectNodePanel.tsx,
    path=src/dashboard/src/components/InspectNodePanel.tsx
  - type=artifact, label=src/dashboard/src/types.ts, path=src/dashboard/src/types.ts
  - type=artifact, label=test/cli-dashboard.test.js, path=test/cli-dashboard.test.js
  - type=artifact, label=test/dashboard-selection.test.ts, path=test/dashboard-selection.test.ts
  - type=artifact, label=dashboard/index.html, path=dashboard/index.html
- Reviewability: Inspect the listed dashboard and kernel files. Confirm the header icon label is Inspect Project
  Profile, profile rawData scope is project_only when there is no current goal and
  current_goal_compliance when active, no-current snapshots include Project Profile without marking
  compliance complete, and the panel exposes no write actions. Rerun dashboard/profile tests and
  typecheck.
- Limitations: This verifies the dashboard state model, built assets, and test coverage. It does not include a
  fresh browser screenshot in this evidence record; visual inspection can still be done by running
  opennori dashboard locally.

### AC-P-14

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为用户，我打开包含长 AC、长证据、多来源、reviewability 和 limitations 的 opennori report 后，仍然能顺畅阅读每条验收状态和证据依据，而不会被超长
  Markdown 表格行破坏阅读体验。
- Measurement: 生成一份包含长中文 AC、多个证据 sources、长 reviewability 和 limitations 的 OpenNori report，并用真实 AW 报告类场景检查 Acceptance
  Status 和后续详情排版。
- Passing threshold: Acceptance Status 只保留短摘要列；长 user story、证据摘要、来源、reviewability 和 limitations 进入逐条 AC 详情块；常见 Markdown
  渲染器中不会出现几千字符的证据表格行，sources 以列表形式可复查。
- Evidence: report-rendering-test: OpenNori report rendering now keeps the Acceptance Status table compact and
  moves long user stories, measurement, thresholds, evidence summary, multiple sources, reviewability,
  and limitations into per-criterion Acceptance Details blocks. The reporting test creates a long
  Chinese AC with command/path/url sources and asserts the old oversized table columns are gone, the
  compact table is present, sources render as a list, and no generated report line exceeds 240
  characters.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-21T02:49:11.936Z
- Sources:
  - type=architecture-apply, label=opennori-self-ac-p-14-report-readability,
    path=.opennori/architecture/evidence/opennori-self-ac-p-14-report-readability.json, summary=Architecture
    Baseline alignment context. This is not Product AC evidence by itself., role=context
  - type=command, label=npm run test:reporting, command=npm run test:reporting
  - type=command, label=npm run test:quick, command=npm run test:quick
  - type=command, label=npm run test:cli, command=npm run test:cli
  - type=command, label=npm run typecheck, command=npm run typecheck
  - type=artifact, label=src/core/report.ts, path=src/core/report.ts
  - type=artifact, label=test/reporting.test.js, path=test/reporting.test.js
  - type=artifact, label=.opennori/architecture/evidence/opennori-self-ac-p-14-report-readability.json,
    path=.opennori/architecture/evidence/opennori-self-ac-p-14-report-readability.json
- Reviewability: Inspect src/core/report.ts for the compact Acceptance Status table and Acceptance Details renderer;
  inspect test/reporting.test.js for the long-report fixture and line-length assertion; rerun npm run
  test:reporting plus npm run test:quick, npm run test:cli, and npm run typecheck.
- Limitations: This verifies Markdown report readability and evidence preservation for long report content. It does
  not prove every external Markdown viewer renders identically, and it does not replace human review
  of the generated report layout.

### AC-P-15

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: 作为 OpenNori 维护者或用户，我查看测试体系时，能清楚区分自动化测试只保护客观协议、状态、CLI、schema、report 和资产结构，而 AC 质量、UI/CRUD/Dashboard
  操作路径挖掘、Enhanced Discovery 和 Skill 判断效果留给 Skills、dogfood、eval prompts 与用户复核。
- Measurement: 打开 docs/testing.md、AGENTS.md、test/ 目录、package.json 测试脚本和本机 nori-product-development Skill；再运行 quick
  与对应领域测试脚本。
- Passing threshold: test/core.test.js 只保留窄核心不变量；原 cli-commands 巨型测试被拆成
  test/cli-*.test.js；acceptance/evidence/reporting/profile/lifecycle/architecture/docs-schema
  等领域测试各自覆盖客观状态；文档和 Skill 明确禁止用自然语言词表或固定 prompt 断言来证明 agent 主观能力；npm run test:quick 和领域脚本可单独运行并通过。
- Evidence: test-system-refactor-review: OpenNori test coverage has been reorganized around objective protocol
  boundaries instead of one giant core/CLI suite. core.test.js now contains only narrow core
  invariants; the former CLI mega-suite is split into focused cli-domain files; acceptance, evidence,
  reporting, profile, lifecycle, architecture, docs-schema, and dashboard tests own their domains.
  docs/testing.md, AGENTS.md, and the local nori-product-development Skill state that automated tests
  must not prove subjective AC quality, UI/CRUD/Dashboard discovery quality, enhanced autogoal
  judgment, or exact prompt wording; those belong to Skills, dogfood, eval prompts, and user review.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-21T02:51:17.013Z
- Sources:
  - type=architecture-apply, label=opennori-self-ac-p-15-test-system-boundary,
    path=.opennori/architecture/evidence/opennori-self-ac-p-15-test-system-boundary.json, summary=Architecture
    Baseline alignment context. This is not Product AC evidence by itself., role=context
  - type=command, label=npm run lint, command=npm run lint
  - type=command, label=npm run typecheck, command=npm run typecheck
  - type=command, label=npm run test:quick, command=npm run test:quick
  - type=command, label=npm run test:docs, command=npm run test:docs
  - type=command, label=npm run test:schema, command=npm run test:schema
  - type=command, label=npm run test:reporting, command=npm run test:reporting
  - type=command, label=npm run test:cli, command=npm run test:cli
  - type=command, label=rg -n 'cli-commands\.test|test/cli-commands' AGENTS.md docs test package.json
    /Users/jarl/code/jarlone/.agents/skills/nori-product-development/SKILL.md, command=rg -n
    'cli-commands\.test|test/cli-commands' AGENTS.md docs test package.json
    /Users/jarl/code/jarlone/.agents/skills/nori-product-development/SKILL.md
  - type=artifact, label=docs/testing.md, path=docs/testing.md
  - type=artifact, label=AGENTS.md, path=AGENTS.md
  - type=artifact, label=/Users/jarl/code/jarlone/.agents/skills/nori-product-development/SKILL.md,
    path=/Users/jarl/code/jarlone/.agents/skills/nori-product-development/SKILL.md
  - type=artifact, label=test/core.test.js, path=test/core.test.js
  - type=artifact, label=test/acceptance.test.js, path=test/acceptance.test.js
  - type=artifact, label=test/evidence.test.js, path=test/evidence.test.js
  - type=artifact, label=test/reporting.test.js, path=test/reporting.test.js
  - type=artifact, label=test/profile.test.js, path=test/profile.test.js
  - type=artifact, label=test/lifecycle.test.js, path=test/lifecycle.test.js
  - type=artifact, label=test/architecture.test.js, path=test/architecture.test.js
  - type=artifact, label=test/docs-schema.test.js, path=test/docs-schema.test.js
  - type=artifact, label=test/cli-core.test.js, path=test/cli-core.test.js
  - type=artifact, label=test/cli-lifecycle.test.js, path=test/cli-lifecycle.test.js
  - type=artifact, label=test/cli-human-output.test.js, path=test/cli-human-output.test.js
  - type=artifact, label=test/cli-acceptance.test.js, path=test/cli-acceptance.test.js
  - type=artifact, label=test/cli-reporting.test.js, path=test/cli-reporting.test.js
  - type=artifact, label=test/cli-architecture.test.js, path=test/cli-architecture.test.js
  - type=artifact, label=test/cli-profile.test.js, path=test/cli-profile.test.js
  - type=artifact, label=test/cli-dashboard.test.js, path=test/cli-dashboard.test.js
  - type=artifact, label=test/cli-evidence.test.js, path=test/cli-evidence.test.js
  - type=artifact, label=test/support/cli.js, path=test/support/cli.js
  - type=artifact, label=test/support/command-fixtures.js, path=test/support/command-fixtures.js
  - type=artifact, label=package.json, path=package.json
- Reviewability: Open docs/testing.md, AGENTS.md, package.json scripts, and the listed test files. Confirm
  core.test.js is narrow, there is no remaining test/cli-commands reference, the CLI suite is split by
  command domain, and the docs/Skill explicitly keep subjective agent ability out of automated tests.
  Rerun the listed lint/typecheck/domain commands.
- Limitations: This proves the repository test architecture and current focused verification. It does not prove
  future Skills will always produce ideal ACs; that remains an agent Skill, dogfood, eval, and human
  review responsibility.

### AC-P-16

- Layer: protocol
- Status: passing
- Confidence: verified
- User acceptance criterion: As an OpenNori maintainer or agent user, I can open the current goal directory and each criterion
  dossier README to understand the goal, AC status, evidence, and next gap without reading a flat
  ledger first.
- Measurement: Inspect .opennori/current/<goal-id>/README.md and .opennori/current/<goal-id>/criteria/<AC-id>/READM
  E.md after drafting, approving, recording evidence, reporting, or archiving a goal.
- Passing threshold: Goal state is stored as a goal directory; every Product AC has its own criteria/<AC-id>/ directory
  with criterion.json as the AC source of truth, status.json as rebuildable status projection,
  evidence/ and artifacts/ subdirectories, and README.md as a generated human review surface;
  status/report/dashboard/doctor/manifest use the directory model and no normal
  current/draft/completed/blocked state relies on flat <goal>.acceptance.md + <goal>.evidence.json
  pairs.
- Evidence: protocol-dashboard-review: Dashboard status projection now uses the goal dossier model directly:
  snapshots include goal-level dossier paths and each criterion includes its own dossier paths,
  including README, criterion source, status projection, evidence directory, and artifacts directory.
- Basis: tool-observation
- Evidence result: passing
- Evidence gate: accepted
- Evidence recorded: 2026-06-21T10:26:07.803Z
- Sources:
  - type=command, label=npm run test:dashboard, command=npm run test:dashboard
  - type=command, label=npm run test:quick, command=npm run test:quick
- Reviewability: Inspect /api/snapshot or .opennori/snapshots/current.json after refreshSnapshot; the goal.dossier
  and criteria[].dossier fields should point to the physical goal and criterion dossier files.
- Limitations: This is a read-only dashboard projection of the dossier model. It does not make Markdown
  authoritative over JSON and does not introduce flat legacy state.


## Current Acceptance Gap

None. All required acceptance criteria have passing or waived evidence.

## Acceptance Review

Status: clear
Summary: Subjective acceptance quality is reviewed by OpenNori Skills and the user; CLI checks only report objective contract state.

## Evidence Health

Status: clear
Summary: Latest evidence is reviewable enough for the current contract.

## User Intervention

No user intervention is currently required.

## Conclusion

Current status: complete

## Architecture Baseline

Architecture decision: valid
Requirement: required - OpenNori self-goal changes architecture requirement routing, persisted state schema, CLI routes, packaged Skills, lifecycle checks, and tests.
Baseline: typescript-agent-state-cli (active)
Technical baseline: 5 runtime, 7 module, 5 contract, 5 flow, 7 dependency, 6 reference items
Challenge: none
Architecture apply records: 54
Architecture evidence health: clear
Build-vs-buy: clear (17 decisions)
Agent guide: installed

Paths:
- .opennori/architecture/baseline.md
- .opennori/agent-guide.md

Architecture apply records:
- AC-A-11: aligned (typescript-agent-state-cli) - Architecture Requirement routing keeps subjective non-trivial judgment in Skills and agent-user review, then stores explicit requirement state for deterministic CLI routing.
- AC-A-12: aligned (typescript-agent-state-cli) - Acceptance discovery, brainstorm, draft, AC quality review, and next-loop handoff now use Skill-prepared inputs and agent/user judgment; the CLI only validates objective state shape and stores provided data.
- AC-A-3: aligned (typescript-agent-state-cli) - Architecture profile import keeps managed project profiles under architecture/profiles and reserves architecture/evidence for architecture apply records.
- AC-A-3: aligned (typescript-agent-state-cli) - Architecture Profile and Baseline now require concrete technical architecture sections while keeping subjective architecture quality in Skills and user review.
- AC-O-11: aligned (typescript-agent-state-cli) - Visible interface UI/UX acceptance discovery is implemented as packaged Skill behavior and user-review guidance, not as CLI subjective validation.
- AC-O-12: aligned (typescript-agent-state-cli) - Complete product acceptance expansion is implemented in packaged Skill behavior, local development Skills, protocol, README, website, and objective asset tests while keeping subjective AC quality out of CLI hard validators.
- AC-O-13: aligned (typescript-agent-state-cli) - Complete-product autogoal coverage self-check is implemented in packaged Skills, local development Skills, protocol, README, website, and objective asset tests without adding CLI subjective validators.
- AC-O-14: aligned (typescript-agent-state-cli) - AC-O-14 keeps draft approval semantics in packaged Skills and documentation while CLI only routes agents toward the one-AC-at-a-time review loop.
- AC-O-9: aligned (typescript-agent-state-cli) - Autogoal was implemented as packaged Skill-driven convergence into the existing Nori Contract Draft path, without adding a separate Autogoal Contract or MVP workflow.
- AC-P-4: aligned (typescript-agent-state-cli) - High-risk evidence handling now preserves objective evidence results while surfacing confidence and evidence_health review risks; the CLI does not use fixed strong/weak natural-language evidence lists to rewrite subjective sufficiency.
- AC-A-12: aligned (typescript-agent-state-cli) - CLI boundary audit kept subjective product semantics in Skills and narrowed hard validation to objective contract, ledger, evidence, architecture, lifecycle, and schema integrity.
- AC-A-8: aligned (typescript-agent-state-cli) - MCP read-only context server uses the official @modelcontextprotocol/sdk stdio transport and registers only context, snapshot, and doctor resources over existing OpenNori projections.
- AC-D-1: aligned (typescript-agent-state-cli) - Dashboard Outcome HUD keeps the React/Vite/Tailwind dashboard as a readonly observation surface while surfacing completion decision, current gap, user intervention, next action, and Project Profile impact from kernel snapshot projection.
- AC-D-5: aligned (typescript-agent-state-cli) - Dashboard Profile drawer follows the confirmed dashboard web architecture: React/Vite/Tailwind/Motion renders a readonly overlay, kernel snapshot exposes capability_profile and capability_compliance, and .opennori remains the source of truth.
- AC-D-5: aligned (typescript-agent-state-cli) - Dashboard observes Project Profile and current-goal compliance without becoming a write surface.
- AC-O-10: aligned (typescript-agent-state-cli) - Conversation-to-contract adoption is implemented as Skill-driven nori-acceptance behavior backed by the existing standard draft path, without adding a new CLI workflow or autogoal artifact.
- AC-O-17: aligned (typescript-agent-state-cli) - Draft criterion revision semantics remain goal-scoped while Project Profile stays project-scoped.
- AC-O-18: aligned (typescript-agent-state-cli) - Acceptance Surface Modeling stays in packaged Skills, protocol, README, AGENTS, and asset tests while CLI remains deterministic state storage rather than a subjective AC validator.
- AC-O-8: aligned (typescript-agent-state-cli) - Project Profile scope is now project-level while current goal ledgers store only profile_evidence compliance records.
- AC-P-14: aligned (typescript-agent-state-cli) - Report readability work stays inside the confirmed TypeScript agent-state CLI baseline: src/core/report.ts owns human report rendering, tests stay in reporting/domain suites, and .opennori remains the evidence source of truth.
- AC-P-15: aligned (typescript-agent-state-cli) - The test-system refactor follows the confirmed TypeScript agent-state CLI baseline by preserving domain modules and deterministic test surfaces while moving subjective agent judgment out of hard-coded tests.
- AC-P-16: aligned (typescript-agent-state-cli) - Goal and criterion dossier state follows the confirmed TypeScript agent-state CLI baseline: structured JSON remains authoritative, generated README files are review surfaces, and CLI/domain modules keep deterministic .opennori writes.
- AC-A-8: aligned (typescript-agent-state-cli) - Acceptance module responsibilities are split into Skill-prepared input normalization, subjective-review surface, and discovery/brainstorm Markdown rendering while keeping src/acceptance.ts as the stable export.
- AC-A-8: aligned (typescript-agent-state-cli) - Activity CLI responses will become lightweight dashboard signal acknowledgements while the full dashboard snapshot remains available as the persisted snapshot projection.
- AC-A-8: aligned (typescript-agent-state-cli) - Activity CLI command code will be split so dashboard activity remains a lightweight signal surface: argument normalization, target handling, signal writing, snapshot summary projection, and command definitions stay separated.
- AC-A-8: aligned (typescript-agent-state-cli) - Split AgentNext construction, dashboard activity command templates, and doctor active-goal helpers while preserving agent-next routing functions.
- AC-A-8: aligned (typescript-agent-state-cli) - AgentNext routing is split into lifecycle readiness, recommendation routing, and architecture-apply handoff modules while keeping src/agent-next.ts as the compatibility export.
- AC-A-8: aligned (typescript-agent-state-cli) - Split Architecture Profile content, model validation, and storage facade boundaries while keeping subjective architecture quality in Skills and user review.
- AC-A-8: aligned (typescript-agent-state-cli) - Split the CLI command layer into registry, policy, resolver, runner, and compatibility barrel modules while keeping citty as the command framework.
- AC-A-8: aligned (typescript-agent-state-cli) - Split the CLI runtime boundary into executor, active-goal args, active-goal store, active-goal lock, and a compatibility runtime barrel while preserving deterministic .opennori state semantics.
- AC-A-8: aligned (typescript-agent-state-cli) - Completion logic now separates acceptance basis view, intervention, review risks, completion answer, and next recommendation routing behind a compatibility export.
- AC-A-8: aligned (typescript-agent-state-cli) - Context export will be split into read-only state collection, review payload assembly, and explicit artifact writing so external review tools can inspect OpenNori context without becoming a second runtime or report authority.
- AC-A-8: aligned (typescript-agent-state-cli) - Report rendering and lifecycle status should consume the same core review projection instead of each path recomputing current gap, completion, evidence health, profile compliance, intervention, and recommendation.
- AC-A-8: aligned (typescript-agent-state-cli) - Core shared helpers were split into protocol, IO, goal-state, dossier rendering, and dossier persistence modules while preserving shared.ts as a compatibility barrel.
- AC-A-8: aligned (typescript-agent-state-cli) - Criterion status projections now use per-criterion ledger timestamps so recording one AC evidence does not make unrelated AC status files look updated.
- AC-A-8: aligned (typescript-agent-state-cli) - Split dashboard inspect rendering into node-type read-only panels while keeping the dashboard as an observation surface over projected OpenNori state.
- AC-A-8: aligned (typescript-agent-state-cli) - Dashboard radar model will separate OpenNori read-only node semantics from geometric layout and visual style helpers.
- AC-A-8: aligned (typescript-agent-state-cli) - Dashboard radar projection now has a dedicated model boundary; React renders readonly nodes, links, grid, and styles from that model instead of owning projection logic.
- AC-A-8: aligned (typescript-agent-state-cli) - Dashboard App shell now owns subscription and selection state while header, outcome HUD, inspect drawer, event console, and view helpers live in focused read-only modules.
- AC-A-8: aligned (typescript-agent-state-cli) - Split the Product evidence state boundary into source normalization, risk gate, workflow status, evidence view, pruning, health, and recording modules while keeping evidence.ts as a compatibility export.
- AC-A-8: aligned (typescript-agent-state-cli) - Generated acceptance Markdown is now an explicit review-surface-only helper rather than a contract state or import layer.
- AC-A-8: aligned (typescript-agent-state-cli) - Goal review outcome assembly will be centralized as a read-only lifecycle projection so status, resume, report, check, and context export do not each assemble completion, current gap, evidence health, architecture, profile, and agent_next independently.
- AC-A-8: aligned (typescript-agent-state-cli) - Kernel activity responsibilities will be split into target resolution, activity storage, and event projection so dashboard live activity remains a projection over current OpenNori state rather than a second workflow state layer.
- AC-A-8: aligned (typescript-agent-state-cli) - Kernel snapshot building will be split into active/no-goal read models, criteria projection, agent activity summary, and history summary so dashboard/MCP observe a clear outcome model instead of a mixed builder.
- AC-A-8: aligned (typescript-agent-state-cli) - Lifecycle external command stdout parsing stays inside narrow adapters instead of setup or plugin-sync orchestration.
- AC-A-8: aligned (typescript-agent-state-cli) - Lifecycle command probes moved behind adapters; MCP is documented as a future read-only context surface; Markdown parsing remains a non-authoritative recovery helper.
- AC-A-8: aligned (typescript-agent-state-cli) - Extracted shared lifecycle external-command action infrastructure used by setup and plugin sync while preserving setup/plugin-sync preview and confirm semantics.
- AC-A-8: aligned (typescript-agent-state-cli) - MCP resource payload types are separated from read-only resource construction.
- AC-A-8: aligned (typescript-agent-state-cli) - Plugin sync lifecycle responsibilities will be split into type definitions, action builders, plan construction, and execution orchestration while preserving preview-first Codex Plugin cache refresh semantics.
- AC-A-8: aligned (typescript-agent-state-cli) - Split OpenNori completion/routing decisions from Markdown report rendering while preserving src/core/report.ts as the public compatibility export.
- AC-A-8: aligned (typescript-agent-state-cli) - Setup lifecycle responsibilities will be split into setup type definitions, action builders, plan construction, and execution orchestration while preserving preview-first bundle setup semantics.
- AC-A-8: aligned (typescript-agent-state-cli) - Dashboard active snapshot will consume the shared GoalReviewState outcome projection so status, report, context export, and dashboard do not grow separate completion authorities.
- AC-A-8: aligned (typescript-agent-state-cli) - Snapshot projection now separates builder, outcome, path, and persistence boundaries while keeping MCP and dashboard on the same read-only projection.
- AC-A-8: aligned (typescript-agent-state-cli) - Split the OpenNori protocol type surface into domain modules while preserving src/types.ts as the compatibility barrel.
