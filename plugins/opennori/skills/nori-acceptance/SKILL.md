---
name: nori-acceptance
description: Discover, draft, approve, and revise human-centered OpenNori acceptance criteria from natural-language goals, fuzzy ideas, Skill-prepared brainstorm directions, next outcomes, or user corrections. Use when completion meaning is unclear, AC quality is being discussed, a human-facing outcome needs a Nori Contract, or UI/CRUD/dashboard/list/form/settings/admin work needs Acceptance Surface Modeling with concrete user operation paths before approval.
---

## Mission

Help the agent and user define what "done" means from the human user's point of view.

Good AC says what entry the user uses, what operation or judgment they perform, what result they see, and how they can decide it is acceptable. It does not describe the agent's implementation path.

When the user explicitly asks for autogoal or wants OpenNori to derive a full contract from a rough idea with fewer clarification rounds, hand off to `nori-autogoal`. Autogoal still produces the same standard Nori Contract Draft; it is not a separate artifact type.

When the user has already been discussing goal and AC with the agent and asks OpenNori to take over that discussion, do not restart from autogoal or discovery from zero. Preserve the conversation's existing goal, candidate AC, assumptions, and unresolved questions; turn them into a standard draft Nori Contract that still needs user approval.

When the root `nori` Skill or CLI JSON reports `data.agent_next.state: initialized_no_active_contract`, treat that as the normal starting point for this Skill. The project is ready; it needs a human-centered Nori Contract, not lifecycle repair. If the user already stated a goal earlier in the same conversation, use that goal instead of asking them to repeat it.

AC quality is a Skill responsibility, not a CLI validator. Do not wait for
`opennori check` to prove that an AC is vague or specific enough. The CLI
stores drafts, contracts, evidence, and objective state; this Skill must use
the conversation, project context, and user intent to decide what questions to
ask before approval.

Before drafting or approving Product AC for any visible product surface, build
an Acceptance Surface Model. A visible product surface is any place where the
user judges completion through a concrete entry, object, action, state, or
feedback: UI screens, CRUD objects, dashboards, lists, tables, forms, settings,
editors, inspectors, previews, management consoles, desktop windows, CLI
prompts, MCP/tool-facing user flows, or similar user-facing workflows.

Do not jump from intent to broad outcome criteria such as "project CRUD works",
"user can manage projects", "settings can be modified", or "dashboard shows the
state". For each user-facing capability, identify:

- actor: who operates or judges.
- entry: where the user starts.
- visible trigger: button, icon, menu item, command, shortcut, empty-state
  action, row action, or automatic prompt.
- object: what entity is being acted on.
- action: create, read, update, delete, link, unlink, select, preview, export,
  recover, or another user-visible operation.
- interaction surface: modal, drawer, page, inline edit, system picker, context
  menu, table row, command output, dashboard panel, or another visible surface.
- required information: fields, selections, defaults, read-only values,
  validation rules, and optional values.
- feedback: success, loading, empty, error, cancel, disabled, confirmation, and
  recovery states.
- state change: what becomes visible immediately afterward.
- persistence: what should remain true after refresh, restart, rerun, or
  reopening.
- destructive boundary: what is removed, unlinked, hidden, archived, or
  explicitly not deleted.
- evidence shape: what screenshot, browser run, command output, state read-back,
  report, artifact, or human confirmation would let the user judge it.

If any model item changes what "done" means and is unknown, ask the single most
completion-changing question or write a clear recommended assumption into the
draft basis and AC Review Loop. Do not silently invent the UI shape, fields, or
destructive behavior as final AC.

The model must land in the draft criteria, not only in discovery notes. For
visible product surfaces, a draft criterion is not ready for approval unless:

- `user_story` names the user's role, entry, object, and operation or judgment.
- `measurement` names the concrete operation path: entry, visible trigger,
  interaction surface, object/action, and required information or states.
- `threshold` names the visible feedback, immediate state change, persistence
  or destructive boundary, failure/recovery behavior, and evidence shape.

If the operation path is missing from the criterion text, revise the criterion
before asking for approval. Do not rely on a separate coverage map, private
reasoning, architecture baseline, or future implementation plan to carry these
completion semantics.

When the user's goal is a complete product, complete feature loop, full app,
full dashboard, full workbench, or otherwise asks for a complete delivery, do
not default to a compact 3-5 item AC set. First define the full acceptance
surface the user would need to judge the product as complete. It is acceptable
for the Nori Contract to contain more AC when the goal genuinely has more user
judgment surfaces. Later implementation still proceeds one current gap at a
time; do not confuse execution sequencing with narrowing the completion
definition.

For complete-product drafts, inspect whether the criteria were compressed. A
draft is not ready for approval when one criterion bundles several independent
user judgments such as project overview, assets, memory, external knowledge,
capabilities, search, audit, UI state, persistence, and recovery. Run a coverage
self-check, then split unrelated surfaces before asking for approval.

After any draft is generated, run an AC Review Loop before asking for final
approval. First show a compact contract and coverage overview so the user knows
the whole draft shape. Then review only one AC at a time: explain your
understanding in human terms for the current AC, ask the user to confirm that AC
or revise it, and move to the next AC only after confirmation. Final `approve`
is only valid after every AC has been confirmed in this loop. The review is not
an implementation plan and not a second contract. Each current-AC explanation
must be concrete enough for the user to catch a wrong interpretation: name the
actual screen, route, command, object, field, state, message, boundary, failure
example, or artifact from that AC. If the explanation could be copied unchanged
to another AC or another project, it is too generic. If you cannot make the
interpretation specific from the draft and conversation, revise the AC or ask
the missing completion-changing question before continuing the loop.

## Start Here

1. Read current OpenNori state with doctor/list/resume/status when a goal may already exist, and follow `data.agent_next` when present.
2. If `agent_next.state` is `initialized_no_active_contract`, use the user's natural-language goal from the current conversation when present; ask for the goal only when it is missing; then begin discovery/draft.
3. If the user is still exploring an idea, create brainstorm candidates before drafting a contract.
4. If the user asks to "take over", "capture", "adopt", "整理我们刚才讨论的 AC", or otherwise indicates the AC discussion is already in progress, collect the current conversation's goal, candidate AC, assumptions, and open questions into a temporary NoriBrief and run `opennori draft --brief <brief.json> --root <repo> --json`. Keep `acceptance_basis.status: "draft"` and use `acceptance_basis.source: "conversation"`. Show the standard draft overview, then start the one-AC-at-a-time AC Review Loop from the first unconfirmed AC. Ask for final approve only after the user has confirmed every AC. Do not start implementation.
5. If the user has a goal but the completion surface is vague, ask the missing
   acceptance questions yourself; optionally use `opennori discover` as a
   scratch question source, but do not treat its gap ids or wording as
   authoritative.
   Build an Acceptance Surface Model before drafting visible product goals:
   actor, entry, visible trigger, object, action, interaction surface, required
   information, feedback, state change, persistence, destructive boundary, and
   evidence shape. If "project CRUD" is the target, separate add/select/edit/unlink or
   delete flows and expose whether each flow uses a button, icon, menu, system
   picker, modal, inline edit, confirmation dialog, or another user-visible
   surface.
   For complete-product goals, expand the full acceptance surface before
   approval instead of compressing it into a starter slice. If scope must be
   reduced, ask the user whether they intentionally want a prototype, MVP,
   first version, or narrower goal.
6. For complete-product drafts, create or review a coverage map before approval:
   user roles, entry/navigation, object lists, object detail, read-only previews,
   state transitions, data rules, permissions, empty/loading/error/success
   states, persistence, failure recovery, memory, capability surfaces, external
   knowledge, search/index, timeline/audit, and final report/review. The map is
   not a separate contract; it is the review surface that prevents compressed AC.
7. Split a criterion when it mixes independent user judgments. A criterion may
   include sub-states of one surface, but it should not combine unrelated
   surfaces such as project overview plus Markdown preview plus HTML preview
   plus memory plus capabilities plus knowledge base. If a draft has that shape,
   mark it as needing revision instead of asking for approval.
8. For UI, CRUD, Dashboard, list, table, form, settings, admin, preview, or
   management-surface criteria, inspect `user_story`, `measurement`, and
   `threshold` before approval. If the measurement does not name entry,
   visible trigger, interaction surface, object/action, and required
   information or states, or if the threshold does not name feedback, state
   change, persistence or destructive boundary, failure/recovery, and evidence
   shape, revise that draft criterion first.
9. If a draft or current contract exists, inspect it yourself before claiming
   the AC is good enough. CLI `acceptance_review` may be present for
   compatibility, but it is not the source of truth for subjective AC quality.
10. If the draft came from a generic goal or has `ACCEPTANCE-BASIS`, show the
   user the missing acceptance questions before asking for approval; the draft
   is still a starting point.
11. Before asking the user to approve a draft, run the AC Review Loop. Show a compact list of all AC first, then review only the current AC with a concrete AC Interpretation Review: exact user entry, target object or field, visible state/message/result, non-passing examples, and reviewable evidence object for that AC. Ask the user to reply `confirm AC-<n>` to continue, or `revise AC-<n>: ...` to correct it. If the interpretation is generic, the draft is not ready for approval. If the interpretation is more specific than the criterion text, update the draft criterion so the new completion semantics live in `user_story`, `measurement`, or `threshold` instead of only in the chat reply. If the user says an interpretation is wrong, revise the AC or ask the missing completion-changing question before moving on. If the explanation reveals hidden assumptions, put them into the draft assumptions or AC wording instead of leaving them only in prose.
12. If `agent_next.state` is `completion_needs_review` and `agent_next.recommended_skill` is `nori-acceptance`, treat existing passing evidence as provisional: explain the unresolved acceptance ambiguity, ask only the missing questions that affect user judgment, then revise criteria or record explicit user-approved assumptions. Do not ask the user to simply accept risk before making the missing acceptance surface understandable.
13. If the user has confirmed every AC in the review loop and then approves the Nori Contract, persist that decision before implementation continues. If the user replies `approve` before all ACs were reviewed one by one, do not run `opennori approve`; continue from the first unconfirmed AC.
14. After `opennori approve`, read the returned `data.agent_next`. If it says `architecture_requirement_needs_decision`, hand off to `nori-architecture-brainstorm` to decide and record required/not_required/waived before implementation or evidence work. If it says `architecture_needs_review`, hand off to the recommended architecture Skill before non-trivial implementation continues.
15. If `agent_next.state` is `ready_for_next_loop` and the user asked to continue, use the completed contract context and the user's latest intent to identify the next human-facing outcome. Prepare a full NoriBrief yourself and run `opennori draft --brief <brief.json> --root <repo> --json`. Do not expect the CLI to invent product candidate goals.
16. If a dashboard is being watched or `agent_next.dashboard_activity` is present and a current goal/gap exists, publish live acceptance activity while drafting or revising: start before acceptance work, heartbeat only during longer work, and finish when the turn ends. Prefer the returned command template; otherwise use `opennori activity start --root <repo> --skill nori-acceptance --state thinking --summary "..." --json` and let the CLI infer the unique current goal/gap.
17. Preserve the user's Contract language preference. Infer it from the goal and conversation by default; if the user explicitly asks for Chinese, Simplified Chinese, English, or similar wording, pass `--language zh-CN` or `--language en` to brainstorm/discover/draft. Do not ask the user to remember this CLI flag.
18. Do not silently translate an already approved or current Nori Contract. If the user explicitly asks to change its presentation language, revise the visible contract as needed and record the user's approval with `opennori approve --no-from-draft --language zh-CN|en --summary "<approval>" --root <repo> --json`.

Useful state commands:

- `opennori brainstorm --idea "<idea>" --candidates '<candidates.json>' --root <repo> --json`
- `opennori discover --goal "<goal>" --questions '<questions.json>' --root <repo> --json`
- `opennori draft --brief <brief.json> --root <repo> --json`
- `opennori approve --root <repo> --summary "<approval>" --json`
- `opennori approve --no-from-draft --language zh-CN|en --root <repo> --summary "<approval>" --json`
- `opennori criterion update --root <repo> --from-draft --goal <goal-id> --criterion <id> --user-story "..." --measurement "..." --threshold "..." --json` for draft AC review revisions.
- `opennori criterion update --root <repo> --criterion <id> --user-story "..." --measurement "..." --threshold "..." --json` for already approved current-contract revisions.
- `opennori activity start|heartbeat|finish --root <repo> --skill nori-acceptance --state thinking --summary "..." --json` (required dashboard signal when the dashboard is observed and a current goal/gap exists)

## Natural-Language Mapping

- "I want to build X" -> discover missing acceptance details, then draft Product AC.
- "Build the full product", "ship the complete feature", "完整产品", "完整功能闭环", "完整应用", "完整 Dashboard", "完整工作台", or "不要 MVP" -> draft a full acceptance surface. Cover all user-visible roles, entries, workflows, states, rules, permissions, persistence, failure/recovery, UI/UX, reporting/review method, and explicit boundaries that affect whether the user can accept the whole product.
- "Why are there so few AC", "these AC are too broad", "为什么 AC 这么少", "这几条 AC 太粗", or a complete-product draft bundles many surfaces into a few broad criteria -> explain that the draft failed coverage review, show the missing surfaces, and revise or regenerate the draft before approval.
- "Use OpenNori autogoal", "用 OpenNori autogoal", or "I only have a rough idea" -> hand off to `nori-autogoal` for Skill-driven convergence into a standard Nori Contract Draft.
- "Use OpenNori to take over the AC we just discussed", "整理我们刚才讨论的 AC", "把上面的 AC 收敛成 Nori Contract Draft", or "不要开始实现，先给我确认" -> adopt the in-progress conversation into a standard draft Nori Contract with `acceptance_basis.source: "conversation"`; ask for approve/revise before implementation.
- "Use Chinese AC", "验收标准用中文", "write this contract in English" -> keep the user-visible goal, discovery questions, AC, and next-loop draft in that language by passing the matching `--language`; protocol field names remain stable English.
- "Change this existing contract to Chinese/English" -> explain that existing approved/current contracts are not silently translated; revise any visible wording that needs translation, then ask for approval and use `approve --no-from-draft --language ...`.
- "Brainstorm this idea" -> produce selectable acceptance directions; ask which direction should become the contract.
- "This AC is too vague" -> ask only questions that change completion judgment.
- "project CRUD", "manage projects", "管理项目", "新增/编辑/删除", "list/form/table/settings/dashboard" with broad AC -> run Acceptance Surface Modeling before approval. Split create/read/update/delete/link/unlink/select/preview operations when they have different entries, visible triggers, interaction surfaces, required fields, feedback, persistence, or destructive boundaries.
- User answers discovery questions -> convert the answers into a complete NoriBrief with concrete Product AC, run `opennori draft --brief`, then show the draft overview and start the one-AC-at-a-time AC Review Loop before final approval.
- "confirm AC-1", "AC-1 对", "确认 AC-1" -> mark that AC as conversation-confirmed and continue the AC Review Loop with the next unconfirmed AC. Do not run `opennori approve` until every AC has been confirmed.
- "revise AC-1: ...", "AC-1 应该是..." -> revise that draft criterion or the draft assumptions with `criterion update --from-draft`, then restart review for the changed AC before continuing. This keeps `acceptance_basis.status` as `draft`; do not treat the revision as approval.
- "Approve these AC" -> if every AC has not already been confirmed one by one in this conversation, do not approve yet. Start or continue the AC Review Loop from the first unconfirmed AC. Only after all ACs are confirmed should you write approval, read `agent_next`, and route to architecture review, evidence, or reporting from that returned state.
- "Change AC-2 to mean..." on an approved current contract -> update that criterion and treat older evidence for it as stale.
- Complete goal with `agent_next.state: ready_for_next_loop` -> infer or ask for the next human-facing outcome, prepare a complete NoriBrief, run `opennori draft --brief`, then show the draft overview and start the AC Review Loop with concrete Measure / Passes when text.
- Drafted brief output -> inspect the draft yourself, ask missing acceptance questions first, then start the one-AC-at-a-time AC Review Loop. Do not ask for blind approval and do not dump every AC interpretation as the approval surface.
- `completion_needs_review` with `recommended_skill: nori-acceptance` -> explain that the contract is objectively evidenced but not confidently acceptable yet; identify the unresolved ambiguity from the AC text and user context, ask concrete missing questions, and revise AC before reporting confident completion.

Discovery answer shape for agent-created temporary files:

```json
{
  "missing-user-entry": "...",
  "missing-field-scope": "...",
  "missing-validation-rule": "...",
  "missing-success-signal": "...",
  "missing-persistence-scope": "...",
  "missing-failure-case": "...",
  "missing-out-of-scope-boundary": "...",
  "missing-review-method": "..."
}
```

The user should never need to memorize this structure; the Skill prepares it from the conversation.

Conversation adoption brief shape for agent-created temporary files:

```json
{
  "goal_id": "optional-stable-goal-id",
  "goal": "Goal already discussed with the user.",
  "presentation": { "language": "zh-CN" },
  "acceptance_basis": {
    "status": "draft",
    "summary": "Draft adopted from an in-progress AC discussion. User approval is still required.",
    "source": "conversation",
    "assumptions": ["Existing assumptions preserved from the discussion."],
    "open_questions": ["Only questions that still change completion meaning."]
  },
  "criteria": [
    {
      "id": "AC-1",
      "user_story": "As a user, ...",
      "measurement": "The user ...",
      "threshold": "Passes when ...",
      "risk": "medium"
    }
  ]
}
```

Conversation adoption is different from autogoal: autogoal starts from a rough idea and lets the Skill infer a full acceptance loop; adoption starts from already discussed AC material and preserves it as a draft without treating it as approved.

Language preference is also prepared by the Skill. If the user writes the goal in one language but answers discovery questions in another, prefer the user's explicit language request; when there is no explicit request, use the language that makes the final AC easiest for the user to review.

## Discovery Questions

Ask questions that affect user acceptance:

- Scope: which user role, screen, command, data object, or workflow is included.
- Operation: what exact user action or judgment happens.
- Field or input rules: editable fields, validation, defaults, limits, and excluded fields.
- Success signal: what the user sees after success.
- Persistence: what should still be true after refresh, restart, rerun, or reopening.
- Failure behavior: what the user sees when the operation cannot complete.
- Boundaries: what is intentionally out of scope.
- Review method: how the user or reviewer can verify the behavior.
- Acceptance Surface Model: for each visible product capability, identify actor,
  entry, visible trigger, object, action, interaction surface, required
  information, feedback, state change, persistence, destructive boundary, and
  evidence shape before writing or approving the AC.
- CRUD and management flows: do not write "CRUD works" as one AC. Ask or infer
  how users add, view/select, edit, delete/unlink/archive, cancel, and recover;
  what fields or defaults exist; whether deletion affects local data or only a
  registry; and what confirmation or failure feedback appears.
- Complete product surface: when the goal is a full product, full app, full dashboard, full workbench, or complete feature loop, enumerate the acceptance dimensions before drafting: user roles, entry and navigation, primary workflows, state transitions, data objects and rules, permissions, onboarding or first-run state, empty/loading/error/success states, persistence, failure recovery, reporting or audit surface, cross-session continuity, and explicit out-of-scope boundaries.
- Complete product coverage map: for broad dashboards/workbenches/apps, map the intended contract before approval. Typical separate surfaces include project list/switching, project initialization state, overview, Markdown list/detail/preview, HTML prototype list/detail/preview, source/version/audit, project memory overview/detail/conflict, Codex context export, Skill/CLI/MCP capability status, external knowledge candidates, search/index state, timeline/audit, security boundary, persistence, empty/loading/error/success states, recovery paths, and final review/report.
- Abstract product surfaces: if an AC says overview, long-term assets, memory, knowledge candidates, capabilities, or result changes, ask what exact visible objects, fields, states, source links, failure states, and boundaries the user must see.
- Visible interface experience: if the goal includes a page, app, Dashboard, Desktop, workbench, form, settings screen, admin console, or other user-facing interface, ask or infer UX acceptance for entry and navigation, information hierarchy, empty/loading/error/success states, operation feedback, readability and scanability, visual and interaction consistency, recovery paths, and UI boundaries such as what must not be shown or exposed.

Do not turn these questions into implementation tasks or evidence.

Use judgment. These are not fixed adapters, and every goal type can require a
different question set. A settings page may need field scope and validation;
a workbench may need visible objects, state labels, source links, empty/error
states, and recovery behavior; an agent capability may need invocation surface,
readiness state, fallback behavior, and how the user can tell the agent used it.
For interface-heavy goals, avoid a single vague "UI/UX is good" criterion. Split
experience acceptance into concrete user judgments: where the user enters, what
they scan first, what states they see, what feedback follows an action, how
failures recover, and what would count as confusing or out of bounds.
For complete-product goals, do not hide important acceptance dimensions inside a
single broad criterion. Prefer enough specific AC for the user to review the
whole product closure. The user may explicitly remove, defer, or narrow AC, but
the agent must not silently downgrade the definition to MVP, first version, or a
happy-path subset.
If a draft has already been generated and the user points out that the AC count
or coverage looks too small, treat that as an acceptance-review failure. Do not
ask the user to approve it. Show the missing coverage surfaces and revise the
draft into separate user-judgable checks.
Ask fewer, sharper questions when the user already provided enough detail.

## State Writes

May write brainstorms, draft contracts, approved acceptance basis, and criterion revisions under `.opennori/`. Do not write evidence, profile, architecture decisions, or reports except through the responsible Skill.

When adopting an in-progress AC discussion, write only a draft under `.opennori/drafts/`. Do not approve it, activate it, implement it, or record passing evidence until the user approves or revises the Nori Contract.

Must write live dashboard activity while acceptance work is happening and the dashboard is observed with a current goal/gap. Activity is not a Nori Contract, not approval, and not completion evidence.

## Handoffs

- After AC approval, if `agent_next` says architecture requirement must be decided, hand off to `nori-architecture-brainstorm`. Non-triviality is an agent/user judgment recorded as Architecture Requirement state, not a CLI hardcoded rule.
- After implementation needs evidence, hand off to `nori-evidence`.
- If the user states required Skills, stacks, or avoided tools while defining AC, hand off that part to `nori-capability-profile`.
- If `acceptance_review` remains after required AC are objectively passing, stay in `nori-acceptance` while the user is clarifying or revising AC. Hand off to `nori-reporting` only after the user explicitly accepts the remaining review risk or the AC findings are resolved.

## User Reply Shape

Show the draft as a compact list of user-facing checks, then start the AC
Review Loop for the current AC only:

```text
Goal: ...
Acceptance checks overview:
- AC-1: As a user, ...
  Measure: ...
  Passes when: ...
Open questions:
- ...
Review progress: AC 1/N
Reviewing AC-1:
  AC text: ...
  My concrete understanding:
    User enters: exact screen, route, menu, command, or object list the user starts from.
    User trigger: exact button, icon, menu item, shortcut, command, row action, or automatic prompt used to begin the operation.
    User does or judges: exact object, field, filter, button, state, or report the user acts on or evaluates.
    Interaction surface: exact modal, drawer, page, inline edit, system picker, command output, table row, dashboard panel, or other surface involved.
    Required information: exact fields, selections, defaults, read-only values, validation rules, and optional values involved.
    User should see: exact visible data, label, status, message, preview, persisted value, or report result.
    Persistence/destructive boundary: exact refresh/reopen/restart expectation and what is removed, unlinked, archived, hidden, or explicitly not deleted.
    Does not pass if: concrete wrong, missing, stale, failed, inaccessible, confusing, or out-of-scope cases.
    Evidence I would use: specific screenshot, browser run, command output, saved state, report, artifact path, or human confirmation that would prove this AC.
Decision:
Reply `confirm AC-1` to continue to AC-2, or `revise AC-1: ...` to correct this AC.
Only reply `approve` after every AC has been confirmed one by one.
```

Ask for current-AC confirmation or a specific revision. Do not include implementation steps unless the user explicitly asks for implementation detail.

Match the reply language to the Nori Contract presentation language when it is known. For `presentation.language: zh-CN`, show `目标`, `验收标准`, `衡量方式`, `通过条件`, and `我的理解` in Chinese; for `en`, use the English shape above.

For Chinese presentation, use this shape:

```text
目标：...
验收标准概览：
- AC-1：作为用户，...
  衡量方式：...
  通过条件：...
开放问题：
- ...
确认进度：AC 1/N
正在确认 AC-1：
  AC 文本：...
  我的具体理解：
    用户入口：用户从哪个具体页面、路由、菜单、命令或对象列表进入。
    可见触发：用户点击哪个按钮、图标、菜单项、快捷键、命令、行操作或自动提示来开始操作。
    用户操作或判断：用户操作或判断哪个具体对象、字段、筛选器、按钮、状态或报告。
    交互面：使用哪个弹窗、抽屉、页面、行内编辑、系统选择器、命令输出、表格行、dashboard 面板或其它可见界面。
    必要信息：涉及哪些字段、选择项、默认值、只读值、校验规则和可选值。
    用户应该看到：用户看到的具体数据、标签、状态、提示、预览、持久化结果或报告结论。
    持久化/破坏边界：刷新、重启、重进后什么仍应成立；删除、解绑、归档、隐藏或明确不删除的对象是什么。
    不算通过：哪些具体错误、缺失、过期、失败、不可访问、难以理解或越界情况不算通过。
    我会使用的证据类型：能证明该 AC 的具体截图、浏览器运行、命令输出、保存状态、报告、制品路径或人工确认。
决定：
回复 `confirm AC-1` 继续确认 AC-2，或回复 `revise AC-1: ...` 修正这一条。
只有全部 AC 逐条确认后，才回复 `approve`。
```

## Misuse Guards

- Do not accept generic criteria such as "modify fields" or "show an error" until field scope, validation, success, persistence, failure, and review method are clear enough for the user to judge.
- Do not accept broad product-surface criteria such as "project CRUD works",
  "user can manage items", "the dashboard shows state", or "settings are
  editable" until the Acceptance Surface Model is concrete enough for the user
  to approve: actor, entry, visible trigger, object, action, interaction
  surface, required information, feedback, state change, persistence,
  destructive boundary, and evidence shape.
- Do not accept abstract criteria such as "overall situation", "long-term assets", "project memory", "knowledge candidates", "capabilities", or "result changes" until the exact visible objects, states, source links, failure/recovery behavior, and boundaries are clear enough for the user to judge.
- Do not accept a compact starter AC set for complete product, complete feature loop, full app, full dashboard, or full workbench goals unless the user explicitly chooses a prototype, MVP, first version, or narrower scope. AC count is not the quality target; complete user-judgable coverage is.
- Do not accept a complete-product draft where one AC bundles unrelated surfaces such as overview, assets, memory, capabilities, external knowledge, search, audit, UI states, persistence, and recovery. Split it before asking for approval.
- Do not accept interface goals that only cover data, backend state, or happy-path function. Visible UI goals also need user-experience acceptance for navigation, hierarchy, states, feedback, readability, consistency, and recovery unless the user explicitly declares those out of scope.
- Do not ask for blind approval immediately after creating a draft. Start the one-AC-at-a-time AC Review Loop so the user can catch mismatches before final approval.
- Do not dump all AC interpretations as the approval surface when a draft has many AC. A compact overview is allowed, but confirmation happens one AC at a time.
- Do not treat a bulk overview, batch interpretation, or the user's early `approve` as final approval before every AC has been confirmed one by one.
- Do not give generic AC Interpretation Review. Phrases like "the user opens the relevant page", "checks the result", "sees it works", "failure is handled", or "I would test it" are not enough unless they name the actual page/object/field/state/message/failure/evidence for that AC.
- Do not let AC Interpretation Review add hidden requirements. If the explanation changes what "done" means, revise the AC or assumptions before asking for approval.
- Do not turn AC Interpretation Review into an implementation plan, file plan, task list, technology choice, or evidence claim.
- Do not make tests, modules, files, commands, Skills, libraries, architecture, or build-vs-buy decisions into Product AC.
- Do not treat brainstorm output, discovery questions, next-loop suggestions, or agent assumptions as a Nori Contract.
- Do not treat autogoal output as a different contract type. If autogoal is used, the user still approves or revises a standard Nori Contract Draft.
- Do not route an already discussed AC set through autogoal just because the user asks OpenNori to take over. Preserve the discussion as a draft and show the remaining assumptions/open questions.
- Do not move conversation-adopted drafts into current/active state, start implementation, or attach evidence before user approval.
- Do not create a draft whose measurement or threshold only says to follow a suggested direction; revise it into user actions, visible results, report/evidence review, or friction judgment before asking for approval.
- Do not wait for CLI-generated next candidates. When continuing after completion, the Skill prepares the next NoriBrief from context and user intent.
- Do not claim completion from AC quality alone; completion still requires reviewable evidence.
- Do not treat dashboard activity, events, or snapshots as acceptance approval or evidence.
- Do not silently translate an already approved or current Nori Contract. Revise and ask for approval if the user wants the contract presentation language changed.
