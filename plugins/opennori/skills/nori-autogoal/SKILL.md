---
name: nori-autogoal
description: Automatically converge a rough user idea into a standard OpenNori Nori Contract Draft without creating a separate autogoal artifact. Use when the user asks for autogoal, wants OpenNori to derive goal and AC from a rough idea, or wants fewer clarification rounds before approving a contract.
---

## Mission

Turn a rough idea into the same standard Nori Contract Draft the user would get after a careful multi-turn OpenNori acceptance discussion.

Autogoal is not a new contract type and not a separate workflow. It is a Skill-driven convergence mode that reduces user questioning before approval.

If the user and agent have already discussed candidate AC, assumptions, or open questions and the user asks OpenNori to take over that discussion, do not use autogoal. Hand off to `nori-acceptance` to adopt the existing discussion into a standard draft with `acceptance_basis.source: "conversation"`.

The final user-approved artifact must still be a normal Nori Contract:

- Goal
- human-facing acceptance criteria
- Measure / Passing threshold
- assumptions
- only the open questions that change completion meaning

Do not output an "Autogoal Contract", MVP scope, first version, prototype, implementation plan, phase list, task list, or roadmap as the final artifact.

Enhanced Discovery is the default autogoal behavior when the user asks for an
enhanced mode, self-grill, "agent grill yourself", deep autogoal, or gives a
rough product idea such as "build a todolist" and expects OpenNori to flesh it
out. The agent first grills the idea internally: enumerate user scenarios,
states, data objects, rules, failures, recovery paths, UX expectations,
persistence, review methods, assumptions, and out-of-scope boundaries. Then ask
only the few questions that would change completion meaning. The user should
see a concise scenario coverage summary, assumptions, and critical questions,
not the agent's private reasoning transcript.

The user must be able to tell Enhanced Discovery was actually used. For enhanced
autogoal, the visible draft reply must include an `Enhanced Discovery checked`
section with coverage summary, assumptions, critical questions, and explicit
out-of-scope boundaries. The Skill-prepared NoriBrief must also persist this in
`acceptance_basis` with `source: "autogoal"`, `mode: "enhanced"`,
`coverage_summary`, `assumptions`, `open_questions`, and optional
`out_of_scope`. This metadata is a reviewable basis for the draft, not Product
AC, evidence, a report, or a process log.

For complete product, complete feature loop, full app, full dashboard, or full
workbench ideas, autogoal should infer a full acceptance surface, not a small
starter contract. The output should match what a careful multi-turn OpenNori
discussion would eventually produce after the user insisted on real product
closure.

For those complete-product ideas, autogoal must run an explicit acceptance
coverage self-check before writing the draft. The self-check is a Skill behavior,
not a CLI validator: list the user-visible surfaces that must be accepted, map
each surface to a planned AC boundary, and split any criterion that combines
independent user judgments.

After writing the standard draft, autogoal must hand the user into the same
one-AC-at-a-time AC Review Loop as ordinary acceptance work. Show a compact
contract and coverage overview first, then review only the current AC:
user entry, user action or judgment, expected visible result, non-passing cases,
and the type of evidence that would support it. Ask the user to confirm that AC
or revise it, then move to the next AC. Final `approve` is only valid after
every AC has been confirmed one by one. The review must be specific to that AC:
name the actual screen, route, command, object, field, state, message, boundary,
or artifact. If the same text could be copied to another AC or another product,
it is too generic. If this interpretation exposes a missing or changed
completion condition, revise the draft instead of continuing the loop.

## Start Here

1. Identify the project root and run `opennori doctor --root <repo> --json` unless readiness is already known from the current turn.
2. If doctor reports missing Plugin discovery, packaged Skills, CLI access, manifest, or project state, hand off to `nori-project-health`; do not continue in a half-installed mode.
3. Read existing OpenNori state with `opennori list --root <repo> --json` and `opennori status/resume --root <repo> --json` when a current goal may exist.
4. If the prompt contains already discussed AC material, phrases such as "take over the AC we just discussed", "整理我们刚才讨论的 AC", or "不要开始实现，先给我确认", stop autogoal and hand off to `nori-acceptance`.
5. Read the user's rough idea, any stated constraints, Nori Profile preferences, and relevant project context such as README, product docs, existing UI/API surfaces, and nearby source files.
6. Preserve the user's full intended product closure. If the idea is broad, do not reduce it to a smaller MVP. Express the full closure through the contract's goal and AC.
7. Run Enhanced Discovery before drafting. Internally self-grill the rough idea across user roles, entrypoints, primary scenarios, alternate states, data objects and rules, validation, success signals, persistence, failure and recovery, UI/UX when visible, reporting/review, and explicit boundaries. For a todolist, this includes task creation, list visibility, editable fields, complete/uncomplete, filtering, empty state, invalid input, deletion/recovery, refresh persistence, and whether due dates/tags/priorities/sync are included.
8. Convert strong inferences into assumptions instead of making the user answer a long questionnaire. Ask only the critical questions that change completion meaning, such as whether a todolist needs due dates/tags/priorities or whether persistence is local-only or backend-backed.
9. If the idea implies a complete product, complete feature loop, full app, full dashboard, or full workbench, enumerate the full acceptance surface before drafting: user roles, entry/navigation, primary workflows, state transitions, data objects and rules, permissions, first-run or empty states, persistence, failure/recovery, reporting or review method, UI/UX when visible, cross-session continuity, and explicit out-of-scope boundaries.
10. For complete-product goals, create a short acceptance coverage map before drafting. Include at least the surfaces that matter to that product type, such as roles, project list and switching, overview, object lists, object detail, read-only previews, source/version/audit, memory, capabilities, external knowledge, search, timeline, security boundary, persistence, state feedback, failure recovery, and final review/report. Do not treat this map as a separate contract; it is the checklist that prevents a compressed draft.
11. Convert the coverage map into criteria where each criterion describes one user operation or judgment surface. A criterion may cover closely related sub-states for the same surface, but it must not combine unrelated surfaces such as project overview plus assets plus memory plus knowledge base plus capabilities. Split combined criteria before running `opennori draft --brief`.
12. If a coverage surface is intentionally omitted, record it as an assumption or open question visible to the user before approval. If the omission would change the meaning of complete product closure, ask the user instead of silently narrowing.
13. Do internal acceptance discovery yourself: entrypoint, user operation, concrete objects, success signal, persistence/recovery, failure behavior, boundary, and review method.
14. For visible interface goals such as pages, apps, dashboards, desktops, workbenches, forms, settings screens, and admin consoles, include user-experience acceptance. Cover entry and navigation, information hierarchy, empty/loading/error/success states, operation feedback, readability and scanability, visual and interaction consistency, recovery paths, and UI boundaries. Do not collapse this into one vague "UI looks good" check.
15. Show the user a compact `Enhanced Discovery checked` summary before or with the draft when enhanced mode was used: scenario coverage, assumptions, critical questions, and explicit out-of-scope boundaries. Keep it short and secondary; it is not a plan, report, or approval artifact.
16. When enough information exists, create a temporary NoriBrief JSON and run `opennori draft --brief <brief.json> --root <repo> --json`. The resulting artifact is a standard draft Nori Contract. For enhanced mode, the brief must persist `acceptance_basis.source = "autogoal"`, `acceptance_basis.mode = "enhanced"`, `coverage_summary`, `assumptions`, `open_questions`, and optional `out_of_scope` so status/report can show the user how this draft was discovered.
17. Show the draft using the standard `nori-acceptance` reply shape, include a compact "Coverage checked" or "Enhanced Discovery checked" section for broad ideas, and start the one-AC-at-a-time AC Review Loop from the first unconfirmed AC. Ask the user to confirm or revise the current AC; ask for final approve only after the user can judge that the agent understood every AC's specific objects, fields, states, boundaries, and evidence correctly. Do not ask the user to approve autogoal notes.

Useful state commands:

- `opennori doctor --root <repo> --json`
- `opennori list --root <repo> --json`
- `opennori draft --brief <brief.json> --root <repo> --json`
- `opennori approve --root <repo> --summary "<approval>" --json`
- `opennori activity start|heartbeat|finish --root <repo> --skill nori-autogoal --state thinking --summary "..." --json` when a dashboard is observed and a current goal/gap exists

Brief shape prepared by the Skill:

```json
{
  "goal_id": "optional-stable-goal-id",
  "goal": "User-complete goal, not MVP wording.",
  "presentation": { "language": "zh-CN" },
  "acceptance_basis": {
    "status": "draft",
    "summary": "Draft generated by OpenNori autogoal from a rough idea. User approval is still required.",
    "source": "autogoal",
    "mode": "enhanced",
    "coverage_summary": ["..."],
    "assumptions": ["..."],
    "open_questions": ["..."],
    "out_of_scope": ["..."]
  },
  "criteria": [
    {
      "id": "AC-1",
      "user_story": "作为用户，我...",
      "measurement": "用户...",
      "threshold": "通过条件...",
      "risk": "medium"
    }
  ]
}
```

The user should never need to prepare this JSON. The Skill prepares it from the idea, project context, and user answers.

## Natural-Language Mapping

- "用 OpenNori autogoal 把这个想法变成可验收目标" -> perform autogoal convergence and draft a standard Nori Contract.
- "autogoal enhanced", "增强模式", "深度 autogoal", "agent 自己 grill 自己", "self-grill", or "把 todolist 的所有使用场景 grill 出来" -> run Enhanced Discovery first: internally expand scenarios, assumptions, boundaries, and critical questions, then draft the same standard Nori Contract.
- "I only have a rough idea" -> preserve the full idea, infer a complete user loop, then draft a standard Nori Contract.
- "不要问我那么多问题" -> infer reasonable assumptions, ask only completion-changing questions, and show them before approval.
- "这个目标很大" -> preserve the broad goal as a complete user closure; do not reduce it to MVP, first version, prototype, or happy-path subset.
- "完整产品", "完整功能闭环", "完整应用", "完整 Dashboard", "完整工作台", "full app", "full dashboard", or "not MVP" -> create a standard Nori Contract Draft with a full acceptance surface, even if that means more AC than a minimal starter contract. First show or internally maintain a coverage map, then split independent user judgment surfaces into separate criteria. Ask the user to narrow scope only when they intentionally want a prototype, MVP, first version, or smaller product closure.
- "Why are there so few AC", "these AC are too broad", "为什么 AC 这么少", or a draft combines multiple product surfaces into a few broad criteria -> do not defend the draft. Explain that it failed coverage review, regenerate or revise with a coverage map, and keep the result draft-only until the user approves.
- "整理我们刚才讨论的 AC", "take over the AC we just discussed", or "不要开始实现，先给我确认" -> hand off to `nori-acceptance`; this is conversation adoption, not rough-idea autogoal.
- "approve" after an autogoal draft -> if every AC has not already been confirmed one by one in this conversation, do not approve yet. Start or continue the AC Review Loop from the first unconfirmed AC. Only after all ACs are confirmed should you run `opennori approve`, then follow returned `agent_next`; for non-trivial work this usually hands off to `nori-architecture-brainstorm`.
- "confirm AC-1", "确认 AC-1" -> continue the AC Review Loop with the next unconfirmed AC.
- "revise AC-1: ..." -> revise that criterion or assumptions, then review the changed AC again before moving on.
- "revise: ..." after an autogoal draft -> revise the standard Nori Contract draft, not a separate autogoal artifact.

## State Writes

May write a standard draft Nori Contract through `opennori draft --brief`.

May include autogoal source metadata, assumptions, and open questions inside `acceptance_basis` so the draft remains reviewable. That metadata is not Product AC, evidence, report, architecture, or profile state.

Do not create a separate approved "autogoal" object as the main product artifact. If temporary scratch files are needed, keep them ephemeral or clearly mark them as draft source only.

If a dashboard is being watched and a current goal/gap exists, publish live activity with `--skill nori-autogoal` while converging or revising. Activity is not approval, not evidence, and not completion proof. Do not bind activity to unapproved drafts when there is no current goal.

## Handoffs

- Missing bundle readiness -> `nori-project-health`.
- User wants ordinary multi-turn AC discussion instead of autogoal -> `nori-acceptance`.
- User states required Skills, preferred stacks, avoided tools, or install policy while defining the goal -> record that through `nori-capability-profile`; keep it out of Product AC.
- Non-trivial draft is approved -> `nori-architecture-brainstorm` before implementation.
- Current gap needs verification -> `nori-evidence`.
- User asks whether the goal is complete -> `nori-reporting`.

## User Reply Shape

Show the standard Nori Contract draft shape, not a special autogoal report.
Use the overview plus current-AC review shape:

```text
Goal: ...
Coverage checked:
- ...
Acceptance checks overview:
- AC-1: As a user, ...
  Measure: ...
  Passes when: ...
Assumptions:
- ...
Open questions:
- ...
Review progress: AC 1/N
Reviewing AC-1:
  AC text: ...
  My concrete understanding:
    User enters: exact screen, route, menu, command, or object list the user starts from.
    User does or judges: exact object, field, filter, button, state, or report the user acts on or evaluates.
    User should see: exact visible data, label, status, message, preview, persisted value, or report result.
    Does not pass if: concrete wrong, missing, stale, failed, inaccessible, confusing, or out-of-scope cases.
    Evidence I would use: specific screenshot, browser run, command output, saved state, report, artifact path, or human confirmation that would prove this AC.
Decision:
Reply `confirm AC-1` to continue to AC-2, or `revise AC-1: ...` to correct this AC.
Only reply `approve` after every AC has been confirmed one by one.
```

For `presentation.language: zh-CN`, use:

```text
目标：...
覆盖面自检：
- ...
验收标准概览：
- AC-1：作为用户，...
  衡量方式：...
  通过条件：...
假设：
- ...
开放问题：
- ...
确认进度：AC 1/N
正在确认 AC-1：
  AC 文本：...
  我的具体理解：
    用户入口：用户从哪个具体页面、路由、菜单、命令或对象列表进入。
    用户操作或判断：用户操作或判断哪个具体对象、字段、筛选器、按钮、状态或报告。
    用户应该看到：用户看到的具体数据、标签、状态、提示、预览、持久化结果或报告结论。
    不算通过：哪些具体错误、缺失、过期、失败、不可访问、难以理解或越界情况不算通过。
    我会使用的证据类型：能证明该 AC 的具体截图、浏览器运行、命令输出、保存状态、报告、制品路径或人工确认。
决定：
回复 `confirm AC-1` 继续确认 AC-2，或回复 `revise AC-1: ...` 修正这一条。
只有全部 AC 逐条确认后，才回复 `approve`。
```

Keep any autogoal notes short and clearly secondary. The user is approving the Nori Contract, not autogoal's internal reasoning.

## Misuse Guards

- Do not create a new "Autogoal Contract" format.
- Do not create a separate enhanced-mode artifact or new CLI command. Enhanced Discovery is `nori-autogoal` behavior, and the output remains a standard Nori Contract Draft.
- Do not expose an exhaustive private self-grill transcript. Show the user concise scenario coverage, assumptions, critical questions, and boundaries.
- Do not ask the user to approve an enhanced autogoal draft if the visible reply lacks `Enhanced Discovery checked` or if `acceptance_basis` lacks `source: "autogoal"` and `mode: "enhanced"`. Revise the draft basis first.
- Do not output MVP, first version, prototype, happy-path subset, phase list, task list, implementation plan, or roadmap as the final artifact unless the user explicitly asks for a prototype or demo.
- Do not shrink a broad idea for agent convenience. If implementation is large, that affects later execution order, not the completion definition.
- Do not compress a complete-product idea into a small default AC set. Full product closure may require AC for roles, entry/navigation, primary workflows, states, data rules, permissions, persistence, failure/recovery, UI/UX, reporting/review, and boundaries.
- Do not write a complete-product draft before doing a coverage self-check. If the draft has a few broad criteria that each bundle several unrelated user judgments, treat it as a failed draft and revise before asking for approval.
- Do not ask for blind approval immediately after writing an autogoal draft. Start the one-AC-at-a-time AC Review Loop so the user can catch whether the agent misunderstood any AC.
- Do not dump all AC interpretations as the approval surface. A compact overview is allowed, but confirmation happens one AC at a time.
- Do not treat an early `approve` as final approval before every AC has been confirmed one by one.
- Do not give generic AC Interpretation Review. It must name the actual page, route, command, object, field, status, message, boundary, failure example, and evidence object where relevant to that AC.
- Do not let AC Interpretation Review add hidden requirements. If the explanation changes the completion definition, revise the draft before approval.
- Do not turn AC Interpretation Review into an implementation plan, file plan, task list, architecture decision, or evidence claim.
- Do not use AC count as the target, but do use coverage as the target. A complete dashboard/workbench often needs separate criteria for project selection, overview, asset list, asset detail, read-only preview, memory, capability status, external knowledge candidates, search/index state, timeline/audit, security boundary, state feedback, persistence, and failure recovery.
- Do not generate only functional/data/status AC for a user-visible interface. Autogoal must include concrete UX acceptance dimensions for navigation, hierarchy, states, feedback, readability, consistency, recovery, and UI boundaries when the goal includes a page, app, Dashboard, Desktop, workbench, form, or settings/admin screen.
- Do not make architecture, libraries, files, commands, Skills, tests, or build-vs-buy choices into Product AC.
- Do not ask implementation questions in autogoal. Architecture and build-vs-buy are handled after Product AC approval.
- Do not ask the user a full questionnaire when reasonable assumptions can be made. Ask only questions that change completion meaning.
- Do not treat assumptions as approval. Show them and let the user approve or revise the draft.
- Do not use autogoal when the user is asking to preserve already discussed AC. Route that to `nori-acceptance` so it stays `source: "conversation"` and draft-only.
- Do not treat brainstorms, discoveries, next-outcome notes, activity, dashboard snapshots, or autogoal notes as evidence.
- Do not claim completion from a draft. Completion still requires approved AC and reviewable evidence.
