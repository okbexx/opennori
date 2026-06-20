---
name: nori
description: "Root OpenNori router for the complete agent capability bundle. Use when the user says to use or continue OpenNori, asks for autogoal, asks OpenNori to take over an existing AC discussion, asks whether a goal is complete, wants evidence recorded, states required Skills or stack preferences, asks for project health, wants architecture decided first, says UI/CRUD/dashboard/list/form/settings/admin AC are too broad or missing operation paths, or expects the agent to use OpenNori without exposing CLI parameters. Treat Plugin discovery, packaged Skills, opennori CLI, and .opennori state as coupled parts of one product."
---

## Mission

Turn a user's natural OpenNori request into the right acceptance loop action while keeping the user focused on goal, AC, evidence, architecture state, and completion judgment.

This is the only OpenNori Skill that should behave as the default entrypoint. Use focused child Skills for domain work instead of teaching the user internal Skill names.

OpenNori is one capability bundle:

- Plugin discovery makes these packaged Skills available.
- Skills define agent behavior and natural-language routing.
- `opennori` is the deterministic state layer.
- `.opennori/` stores the project contract, evidence, profile, architecture, health, and report state.
- `opennori dashboard` is an optional local observation surface over that state, not an agent runtime or confirmation/control surface.

Do not present those pieces as optional standalone product paths.

CLI JSON may include `data.agent_next`. Treat it as the deterministic routing surface from the state layer to Skills. Prefer `agent_next.state`, `agent_next.recommended_skill`, `agent_next.instruction`, `agent_next.user_visible_next`, and `agent_next.dashboard_activity` over guessing from files or command prose.

`.opennori/agent-guide.md` is only a project-local supplementary guide. Do not depend on it for OpenNori discovery, and do not assume a fresh project has an Architecture Baseline or a current Nori Contract just because `.opennori/` directories exist.

Subjective AC quality is an agent responsibility. The CLI can report objective
state and may expose review surfaces, but it must not be treated as an oracle
for whether AC are human-acceptable. When the user asks whether AC are good
enough, route to `nori-acceptance` and reason from the user's goal, visible
entrypoints, operations, outcomes, evidence needs, and boundaries.

For any visible product surface, the root router must expect Acceptance Surface
Modeling before draft approval, evidence confidence, or completion reporting.
This applies when the user mentions UI screens, CRUD objects, dashboards, lists,
tables, forms, settings, editors, inspectors, previews, management consoles,
desktop windows, CLI prompts, MCP/tool-facing user flows, or similar workflows.
If an AC only says "project CRUD works", "users can manage projects",
"settings are editable", or "dashboard shows state", route to
`nori-acceptance` instead of continuing. The child Skill should model actor,
entry, visible trigger, object, action, interaction surface, required
information, feedback, state change, persistence, destructive boundary, and
evidence shape.

The root router must also reject a common false-positive: a draft says the
surface was modeled in coverage notes, but the AC text itself remains broad.
For visible product surfaces, route back to `nori-acceptance` unless each
relevant criterion carries the operation path in its own `measurement` and
`threshold`: entry, visible trigger, interaction surface, object/action,
required information or states, visible feedback, state change, persistence or
destructive boundary, failure/recovery behavior, and evidence shape.

Draft approval requires a one-AC-at-a-time AC Review Loop. After a draft exists,
the agent must show a compact contract overview, then review only the current
AC: user entry, user action or judgment, expected result, non-passing cases, and
likely evidence type. The user confirms or revises that AC before the agent
moves to the next one. Final `approve` is only valid after every AC has been
confirmed in this loop. This explanation must be concrete to the AC: name the
actual page, route, command, object, field, state, message, boundary, failure
example, or evidence object. If it could be copied unchanged to another AC or
product, route back to `nori-acceptance` for revision before continuing the
loop. If that explanation changes the completion definition, route back to
`nori-acceptance` for revision before approval.
Revising a draft AC is not approval. The child Skill should use the draft
revision path, keep `acceptance_basis.status` as `draft`, and restart review for
the changed AC. Do not let profile, architecture, implementation, or evidence
routing begin until final approval happens after every AC is confirmed.

## Start Here

1. Identify the project root from the current workspace or the user's explicit path.
2. If readiness is unknown, run `opennori doctor --root <repo> --json`.
3. If the JSON has `data.agent_next`, follow it:
   - `health_needs_recovery` or `setup_preview_needs_confirmation` -> hand off to `nori-project-health`.
   - `initialized_no_active_contract` -> if drafts exist, show a compact draft overview and start the one-AC-at-a-time AC Review Loop before final approval or revision; otherwise use the user's already stated goal if the current conversation includes one, or ask for the natural-language goal; then hand off to `nori-acceptance`.
   - `ready_with_current_goal` -> run resume/status as directed.
   - `architecture_requirement_needs_decision` -> hand off to `nori-architecture-brainstorm` to decide and record whether this goal needs Architecture Baseline review. This is an agent/user judgment, not a CLI inference from the existence of a goal.
   - `architecture_needs_review` -> follow `recommended_skill` (`nori-architecture-brainstorm`, `nori-architecture-challenge`, or `nori-build-vs-buy`) before non-trivial implementation continues.
   - `work_on_current_gap` -> work only on the current acceptance gap and hand off to `nori-evidence` after verification.
   - `completion_needs_review`, `evidence_needs_review`, or `acceptance_needs_user` -> use reporting/evidence/acceptance as directed and involve the user when `needs_user` is true.
   - `ready_for_next_loop` -> if the user asked to continue, hand off to `nori-acceptance` so the Skill can prepare the next human-facing NoriBrief from context and user intent.
4. If the project is already initialized but the command did not expose `agent_next`, run `opennori list --root <repo> --json`, then `opennori resume --root <repo> --json` or `opennori status --root <repo> --json`.
5. If `.opennori/current` contains multiple goals, treat it as broken state and route to `nori-project-health`; do not ask the user to choose among multiple current goals.
6. If doctor reports missing Plugin discovery, packaged Skills, CLI access, manifest, or project state, route to `nori-project-health`.
7. For first-time machine setup, `nori-project-health` should use `npx opennori setup` preview/confirm; for an installed machine and a new project, use `opennori init` preview/confirm.
8. If `opennori` is not on PATH, route to `nori-project-health` instead of continuing in a half-installed mode. Only use `node ./bin/opennori.js` while developing the OpenNori source checkout itself.

## Natural-Language Mapping

- "Use OpenNori for this goal", "turn this into AC", "the AC is wrong", "brainstorm first" -> hand off to `nori-acceptance`.
- "Use OpenNori to take over the AC we just discussed", "整理我们刚才讨论的 AC", "把上面的 AC 收敛成 Nori Contract Draft", or "不要开始实现，先给我确认" -> hand off to `nori-acceptance` with the already discussed goal, candidate AC, assumptions, and unresolved questions. This is conversation adoption into a draft, not autogoal.
- "autogoal", "自动帮我把 idea 变成 goal/AC", "I only have a rough idea", "用 OpenNori autogoal", "增强模式", "self-grill", "agent 自己 grill 自己", or "把 todolist 的所有使用场景 grill 出来" -> hand off to `nori-autogoal`; it must run Enhanced Discovery when requested, then converge to a standard Nori Contract Draft, not a special autogoal artifact.
- "Are these AC good enough", "this AC is too vague", "the goal is broad", or visible AC text lacks concrete user judgment -> hand off to `nori-acceptance`; do not wait for `opennori check` to flag it.
- "Approve this draft", "approve these AC", "这些 AC 可以 approve 吗", or a draft exists but every AC has not been confirmed one by one -> hand off to `nori-acceptance` for the AC Review Loop before approval.
- "confirm AC-1", "确认 AC-1", or "revise AC-1: ..." -> hand off to `nori-acceptance` to continue the AC Review Loop or revise the current AC.
- "complete product", "complete feature", "full app", "full dashboard", "完整产品", "完整功能闭环", "完整应用", "完整 Dashboard", "完整工作台", or "不要 MVP" -> hand off to `nori-acceptance` or `nori-autogoal` with an explicit full-acceptance-surface instruction. The child Skill should preserve the complete user closure, not compress the Nori Contract into a compact MVP-style AC set unless the user explicitly narrows scope.
- "Why are there so few AC", "these AC are too broad", "为什么 AC 这么少", "AC 太粗", or a complete-product draft has broad bundled criteria -> hand off to `nori-acceptance` for coverage review and revision. The child Skill should show missing coverage surfaces, split independent user judgments, and keep the result draft-only until user approval.
- "The UI/UX AC is missing", "this is a page/app/dashboard/desktop/workbench/form", "the interface must feel usable", or a visible interface goal has only data/status/function AC -> hand off to `nori-acceptance` to add user-experience acceptance checks for navigation, information hierarchy, states, feedback, readability, consistency, recovery, and UI boundaries.
- "project CRUD", "manage projects/items", "管理项目", "新增/编辑/删除", "list/form/table/settings/dashboard/admin" as a broad goal or AC -> hand off to `nori-acceptance` for Acceptance Surface Modeling. Do not accept one broad CRUD/outcome AC until the agent has separated user operations such as add, view/select, edit, delete/unlink/archive, cancel, recover, and preview when their entry, visible trigger, interaction surface, required information, feedback, state change, persistence, destructive boundary, or evidence shape differs.
- "验收标准用中文", "用中文写 Nori Contract", "write the AC in English", or any explicit Contract language request -> carry that preference to `nori-acceptance`; the child Skill records it as Contract presentation, not as Product AC.
- "把现有契约改成中文/英文" -> hand off to `nori-acceptance`; changing an approved/current Contract language requires explicit user approval and must not happen as an automatic status/report side effect.
- If the user already stated the goal before initialization, do not ask them to repeat it after `opennori init`; continue acceptance discovery for that stated goal.
- "Continue OpenNori", "what is next", "what is the current gap" -> run resume/status, then hand off to `nori-reporting` unless the next action clearly requires another child Skill.
- "Is it complete", "can I accept this", "what do I need to do" -> use `nori-reporting` and answer from required AC, evidence, profile, architecture, and review risks.
- "Record this verification", "use this screenshot/report/test as evidence", "that evidence is stale", "waive this" -> hand off to `nori-evidence`.
- "Must use this Skill", "prefer Radix UI", "avoid this tool", "ask before installing" -> hand off to `nori-capability-profile`.
- "Decide architecture first", "use a better architecture", "follow the baseline", "challenge the baseline" -> use `nori-architecture-brainstorm`, `nori-architecture-apply`, or `nori-architecture-challenge`.
- `agent_next.state: architecture_requirement_needs_decision` -> decide whether the current goal is simple enough to record `not_required`, non-trivial enough to record `required`, or explicitly waived by the user. Record the decision with a reason before implementation.
- "Before self-building this parser/installer/schema/storage/UI primitive" -> hand off to `nori-build-vs-buy`.
- "Install", "upgrade", "uninstall", "doctor", "state is broken", "sync local OpenNori plugin", or "Codex Plugin cache is stale" -> hand off to `nori-project-health`.
- "Show me the dashboard", "watch OpenNori run", "I want live status" -> run or suggest `opennori dashboard --root <repo>` and keep completion judgment plus user confirmations in conversation and status/report.
- A complete goal with `agent_next.state: ready_for_next_loop` and a user asking to continue -> infer or ask for the next human-facing outcome, then hand off to `nori-acceptance` to prepare a standard NoriBrief. Do not expect the CLI to invent product candidate goals.

## State Writes

This root Skill should avoid direct writes except for safe readiness checks and setup/init previews. Let child Skills mutate `.opennori/current`, `.opennori/drafts`, `.opennori/architecture`, `.opennori/reports`, `.opennori/brainstorms`, `.opennori/completed`, `.opennori/blocked`, or `.opennori/manifest.json`.

If a dashboard is open, the user asked to watch progress, or `agent_next.dashboard_activity` is present, the active child Skill must publish dashboard activity while it is working on a current goal/gap. Prefer the command templates from `agent_next.dashboard_activity`; otherwise use the low-parameter form with `--skill`, `--state`, and `--summary` and let the CLI infer the unique current goal/gap. Start activity before work that drafts, changes, implements, verifies, or records OpenNori state; finish activity when that turn's work ends; heartbeat only during longer work. If no current goal/gap exists, do not bind activity to drafts. If multiple current goals exist, route to project health because current state is invalid. Activity is only a live signal for the user; it must not be used as Product AC evidence or completion proof.

The dashboard may show that a user reply is needed, but it must not approve AC, confirm architecture, waive risks, accept reports, or write completion state. Collect those decisions in conversation and record them through the appropriate OpenNori CLI command.

## Handoffs

Use one child Skill at a time and carry forward only the relevant state:

- Current goal id, current gap, completion confidence, and review risks.
- Any user statement that changes completion meaning.
- Any rough idea or autogoal instruction that should become a standard Nori Contract Draft.
- Any already discussed AC material that should be adopted into a standard draft without approval, implementation, or evidence.
- Any draft that needs the one-AC-at-a-time AC Review Loop before approval.
- Any architecture/profile constraint that affects how the agent may proceed.
- Any evidence source, limitation, or human confirmation the user just supplied.

After the child Skill acts, return through `nori-reporting` when the user needs a completion answer or next gap.

## User Reply Shape

Lead with:

```text
Goal: ...
Current gap: ...
Need user: yes/no
Decision: complete / not complete yet / objectively complete with review risk
Next: ...
```

Then include only the minimum context needed for the user to approve, revise, provide evidence, accept a risk, or let the agent continue.

## Misuse Guards

- Do not make the user memorize CLI flags or internal Skill names.
- Do not treat autogoal as a new contract type. It is only a Skill-driven path to the same standard Nori Contract Draft.
- Do not let autogoal shrink broad ideas into MVP, first version, prototype, happy-path subset, phases, or task lists.
- Do not treat autogoal enhanced mode as a separate CLI command or artifact. It is `nori-autogoal` Enhanced Discovery behavior: the agent self-expands scenarios, assumptions, critical questions, and boundaries before drafting the same standard Nori Contract.
- Do not let an enhanced autogoal draft move toward approval without a visible `Enhanced Discovery checked` section and persisted `acceptance_basis.source = "autogoal"` plus `acceptance_basis.mode = "enhanced"` so status/report can show the user how the draft was discovered.
- Do not shrink complete-product goals into a small default AC set for agent convenience. Complete product, complete feature loop, full app, full dashboard, or full workbench goals need a full acceptance surface by default: roles, entry/navigation, core workflows, state transitions, data rules, permissions and boundaries, failure/recovery, persistence, UI/UX when visible, and review/reporting method. Execution can still advance one current gap at a time.
- Do not defend a compressed complete-product draft. If a draft bundles unrelated surfaces into a few AC, route to acceptance revision, create a coverage map, and split independent user judgment surfaces before approval.
- Do not route already discussed AC material through autogoal. If the user asks OpenNori to take over a current AC discussion, preserve that material through `nori-acceptance` as `acceptance_basis.source: "conversation"` and keep it draft-only until user approval.
- Do not treat language preference as a Product AC. It is Contract presentation metadata that helps the user review goal, AC, discovery questions, reports, and next candidates.
- Do not silently translate current or approved contracts; language changes to existing contracts require explicit revision and approval.
- Do not split OpenNori into separate Plugin, Skill, and CLI user paths; they are one capability bundle.
- Do not continue a half-installed mode when Plugin discovery, packaged Skills, CLI access, or `.opennori` state is missing; route to project health and recover the missing piece.
- Do not expect OpenNori CLI to generate candidate product goals. Next-loop goal selection is a Skill/user judgment that becomes a standard draft through `opennori draft --brief`.
- Do not answer confidently complete while required AC evidence, blocking profile items, architecture challenges, evidence health, or acceptance review risks remain unresolved or unaccepted.
- Do not outsource AC quality judgment to CLI heuristics. The agent must inspect AC wording and ask the user the missing acceptance questions when the human judgment surface is vague.
- Do not ask for blind approval of a draft. The agent must run the one-AC-at-a-time AC Review Loop and revise any mismatch before approval.
- Do not dump all AC interpretations as the approval surface. A compact overview is allowed, but user confirmation happens one AC at a time.
- Do not treat early `approve` as valid final approval before every AC has been confirmed one by one.
- Do not accept generic AC Interpretation Review. The agent must name the concrete objects, fields, states, boundaries, failure examples, and evidence objects that make each AC reviewable.
- Do not let AC Interpretation Review become implementation planning or hidden requirements; it is only a user-facing semantic confirmation before approval.
- Do not accept visible interface goals with only functional/data AC. The agent must check whether the user can navigate, scan, understand state, get feedback, recover from failure, and judge visual/interaction consistency.
- Do not accept broad visible product-surface AC such as "project CRUD works",
  "manage items", "settings are editable", or "dashboard shows state" before
  Acceptance Surface Modeling identifies actor, entry, visible trigger, object,
  action, interaction surface, required information, feedback, state change,
  persistence, destructive boundary, and evidence shape.
- Do not accept a visible-product draft just because coverage notes mention
  Acceptance Surface Modeling. The operation path must be in the criterion
  measurement and threshold; otherwise route to `nori-acceptance` for revision.
- Do not turn architecture, profile, build-vs-buy, Plugin, hook, or tool preferences into Product AC.
- Do not let the CLI decide whether a goal is non-trivial. The agent/user records Architecture Requirement status; CLI only routes from that recorded state.
- Do not treat dashboard activity, events, or snapshots as acceptance evidence.
- Do not treat dashboard as a place for confirmation buttons or state-changing controls.
- Do not suggest copying or syncing OpenNori Skills into the user project; Skills come from the installed OpenNori Plugin, and the CLI only manages `.opennori` state.
