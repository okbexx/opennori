---
name: nori-loop-engineer
description: "Advance one OpenNori acceptance loop without making the user repeatedly ask what is next. Use when the user says continue OpenNori, keep going, 下一步, 不要每次问下一步, run to completion, work the current gap, Loop Engineer, or when agent_next indicates a current gap, blocker, completion review, or ready_for_next_loop that should be routed through the correct OpenNori Skill."
---

## Mission

Keep the agent moving through OpenNori's acceptance loop from the current state, while preserving the product boundary:

- The user-facing unit is still Goal, Current gap, Evidence, Decision, Need user, and Next.
- The Skill advances exactly one acceptance loop at a time.
- It does not create a new workflow, plan mode, task list, command, contract type, or dashboard runtime.
- It never bypasses user approval, architecture confirmation, waiver, or completion acceptance.

Loop Engineer is a coordinator. It reads deterministic OpenNori state, chooses the correct focused Skill, performs or delegates the next acceptance-loop action, records reviewable state when appropriate, and returns a concise status answer.

## Start Here

1. Identify the project root from the workspace or user-specified path.
2. Run `opennori resume --root <repo> --json`. If resume fails because there is no current goal, run `opennori doctor --root <repo> --json`.
3. Prefer `data.agent_next` over command prose or file guessing.
4. If `agent_next.dashboard_activity` exists and there is a current goal/gap, publish activity before substantive draft/change/implement/verify/record work. Prefer the provided command templates. Finish activity when the loop action ends.
5. Classify the current state and route to one focused Skill.
6. Perform only the current loop action, then stop with the reply shape below.

If `opennori` is unavailable, Plugin Skills are missing, `.opennori` is broken, or multiple current goals exist, hand off to `nori-project-health` instead of continuing in a half-installed or ambiguous state.

## Natural-Language Mapping

- "Continue OpenNori", "keep going", "what is next", "work the current gap", "run the OpenNori loop", "不要让我每次问下一步", "继续推进", or "下一步是什么" -> run resume/status, then act through this Skill.
- `agent_next.state: health_needs_recovery` or `setup_preview_needs_confirmation` -> hand off to `nori-project-health`.
- No current contract, `initialized_no_active_contract`, or draft needs approval/revision -> hand off to `nori-acceptance` or `nori-autogoal` based on the user's current intent.
- Draft exists and AC Review Loop is incomplete -> hand off to `nori-acceptance`; do not auto-approve.
- Current gap is broad UI/CRUD/dashboard/list/form/settings/admin AC without operation paths -> hand off to `nori-acceptance`.
- `architecture_requirement_needs_decision`, `architecture_needs_review`, or non-trivial implementation without confirmed baseline -> hand off to `nori-architecture-brainstorm`, `nori-build-vs-buy`, or `nori-architecture-challenge` as directed.
- Current AC has a confirmed baseline and implementation is needed -> hand off to `nori-architecture-apply` before code changes.
- Profile must/prefer/avoid risk exists -> hand off to `nori-capability-profile`.
- Evidence is missing, stale, weak, invalid, or user supplied a verification -> hand off to `nori-evidence`.
- Completion answer, report, current gap explanation, review risk, or next-loop handoff is needed -> hand off to `nori-reporting`.
- `ready_for_next_loop` and the user asked to continue -> prepare the next human-facing NoriBrief from user intent and completed context through `nori-acceptance`; do not ask the CLI to invent a goal.

## State Writes

This Skill should avoid owning domain writes. Let focused Skills use the existing CLI commands:

- `nori-acceptance`: brainstorm, discover, draft, criterion add/update, approve after AC Review Loop.
- `nori-architecture-brainstorm`: architecture requirement, profiles, baseline preview/confirm.
- `nori-architecture-apply`: architecture apply records.
- `nori-architecture-challenge`: challenge records.
- `nori-build-vs-buy`: architecture decisions.
- `nori-capability-profile`: Project Profile and compliance evidence.
- `nori-evidence`: evidence add/prune/waiver.
- `nori-reporting`: status/report/context explanations.
- `nori-project-health`: setup/init/doctor/upgrade/uninstall/plugin sync recovery.

When this Skill itself runs checks, keep them read-only except for optional dashboard activity signals.

## Handoffs

Carry only the state the next Skill needs:

- project root
- goal id
- current gap id and criterion text when available
- `agent_next.state`, `recommended_skill`, `instruction`, `user_visible_next`, and `needs_user`
- completion confidence and review risks
- user sentence that changes the completion meaning
- evidence source or human confirmation the user just supplied
- architecture/profile constraint that affects the current gap

Do not carry private implementation plans as user-facing loop state. Do not convert the current gap into a task list.

## User Reply Shape

Use this exact shape for the concise status answer:

```text
Goal: ...
Current gap: ...
Loop type: acceptance / architecture / implementation / evidence / profile / reporting / health / next-contract
Action taken: ...
Evidence: ...
Decision: complete / not complete yet / objectively complete with review risk / blocked
Need user: yes/no
Next: ...
```

If user action is needed, make `Next` the concrete reply or decision the user can provide in conversation. If no user action is needed and the current loop can continue, name the next Skill-level action, not a process task list.

## Misuse Guards

- Do not call this plan mode.
- Do not output a phase list, task list, roadmap, or implementation checklist as the main progress surface.
- Do not continue past a required user approval, AC confirmation, architecture baseline confirmation, waiver, install confirmation, or report acceptance.
- Do not auto-approve draft AC, auto-waive risk, or auto-accept a report.
- Do not treat dashboard activity, events, snapshots, or MCP resources as Product AC evidence.
- Do not let MCP write state or duplicate CLI authority.
- Do not mark broad visible-surface AC confidently passing just because code changed or tests passed.
- Do not change Architecture Baseline silently; create a challenge when evidence conflicts.
- Do not create new current goals from next-loop suggestions without a standard draft and user approval.
- Do not ask the user to memorize CLI flags or internal Skill names.
