---
name: nori-reporting
description: Explain OpenNori status, current gaps, completion decisions, user intervention, reports, changes, context export, and read-only MCP context in human terms. Use when the user asks whether work is complete, what remains, what changed, what they need to do, how to continue after a completed goal, how a review/MCP client can inspect OpenNori state, or whether broad UI/CRUD/dashboard/list/form/settings/admin AC can be confidently accepted from evidence and operation paths.
---

## Mission

Give the user a concise acceptance-centered answer: what goal is being judged, what gap remains, whether the user must act, whether the goal is complete, and what should happen next.

Reporting is not an implementation diary.

Reporting must not make broad visible product-surface AC look confidently
acceptable. If the current goal or AC involves UI, CRUD, dashboard, list, table,
form, settings, admin, CLI prompt, or another visible workflow, the report
should expect an Acceptance Surface Model: actor, entry, visible trigger,
object, action, interaction surface, required information, feedback, state
change, persistence, destructive boundary, and evidence shape. If those are
missing, say the goal may be objectively evidenced but not confidently
acceptable yet, then route to `nori-acceptance`.

Coverage notes alone are not enough for confident reporting. For visible
product surfaces, the report should inspect whether each relevant criterion's
measurement and threshold carry the actual operation path: entry, visible
trigger, interaction surface, object/action, required information or states,
visible feedback, state change, persistence or destructive boundary,
failure/recovery behavior, and evidence shape. If the path only appears in
agent explanation, implementation notes, architecture, or coverage summary,
report the missing AC text as the review risk and route to `nori-acceptance`.

## Start Here

1. Run the narrowest status command that answers the user.
2. Prefer resume/status for current state, report for a durable human report, changes for diff grouping, context export when another file-based tool needs review context, and `opennori mcp --root <repo>` when an MCP client needs read-only resources.
3. Read completion, current_gap, evidence_health, profile_review, architecture requirement, architecture decision, build_vs_buy health, agent_next, and next_recommendation. Read `acceptance_review` when present, but remember that subjective AC quality is primarily a Skill/user review responsibility.
4. If the user asked to continue, follow `agent_next` routing. For `ready_for_next_loop`, hand off to `nori-acceptance` so the next human-facing goal becomes a Skill-prepared NoriBrief, not a CLI-generated candidate.
5. If the AC wording is vague from the user perspective, do not present this as normal completion acceptance even when CLI state is objectively complete. Say the evidence may be complete but the AC needs user review, state the ambiguity in human terms, and hand off to `nori-acceptance`.
6. If a visible product-surface AC is broad, call out the missing operation
   path rather than hiding it behind completion state. Examples: missing
   create/edit/delete entry, icon vs text trigger, modal vs system picker,
   required fields, validation, feedback, persistence, or delete/unlink
   boundary.
7. If the operation path exists only in evidence summaries, screenshots, code,
   architecture notes, or a draft coverage summary, say the AC text itself is
   not yet reviewable. Completion remains "not confidently acceptable yet"
   until `nori-acceptance` revises the criterion.
8. If the user wants a visual live view, use `opennori dashboard --root <repo>` as an observation surface and give the user the printed URL. Do not auto-open a browser unless the user explicitly asked for that; keep the completion answer based on status/report data.

Useful state commands:

- `opennori resume --root <repo> --json`
- `opennori next --root <repo> --json`
- `opennori status --root <repo> --json`
- `opennori report --root <repo> --json`
- `opennori changes --root <repo> --json`
- `opennori list --root <repo> --json`
- `opennori context export --root <repo> --json`
- `opennori mcp --root <repo> --json` (metadata summary) or `opennori mcp --root <repo>` (stdio MCP server)
- `opennori dashboard --root <repo>` (prints the local URL; add `--open` only when the user explicitly wants the CLI to open a browser)

## Natural-Language Mapping

- "Is it done" -> answer from completion and required AC evidence.
- "What remains" -> identify current_gap and any review risks separately.
- "What do I need to do" -> report user intervention only, not implementation chores.
- "What changed" -> group OpenNori acceptance artifacts separately from implementation files.
- "Generate report" -> create/read the OpenNori report and summarize the decision.
- "Continue" after a complete goal -> use the completed context and user's intent to identify the next human-facing outcome, then hand off to `nori-acceptance` to draft it through a Skill-prepared NoriBrief.
- "Export for review" -> use context export and state what the reviewer can inspect.
- "Use MCP", "MCP client needs OpenNori state", or "what MCP resources exist" -> explain the read-only resources: `opennori://project/context`, `opennori://project/snapshot`, and `opennori://project/doctor`. Make clear that MCP registers no write tools and cannot approve AC, record evidence, confirm architecture, waive risks, or accept reports.
- "Open dashboard" or "watch it run" -> start the local dashboard and explain that it observes activity, current gap, architecture, user-intervention needs, and completion judgment without certifying completion or hosting confirmation controls.
- AC quality or acceptance meaning is unclear -> lead with "objectively evidenced, not confidently acceptable yet" only when evidence is complete; then route to AC revision instead of asking for a blind risk acceptance.
- "CRUD works", "manage projects/items", "settings are editable", "dashboard shows state", or similar broad visible-product AC appears in status/report -> say the missing Acceptance Surface Model is the review risk, name the missing user operation path pieces, and hand off to `nori-acceptance`.
- `architecture_requirement` review risk -> explain that the agent/user has not recorded whether this goal needed Architecture Baseline review; hand off to `nori-architecture-brainstorm` to record required/not_required/waived.
- `architecture_waived` review risk -> explain the recorded waiver reason and ask whether the remaining architecture risk is acceptable.

## State Writes

May generate reports, changes output, or context exports. Do not mutate Product AC, evidence, profile, architecture, or lifecycle state.

May start the local dashboard as an observation surface. Do not write Product AC or evidence from dashboard state. Do not tell the user to confirm, reject, waive, approve AC, accept reports, or confirm Architecture Baselines inside the dashboard; collect those decisions in the agent conversation and record them through OpenNori CLI.

May explain or start the read-only MCP context server. Do not treat MCP
resources as evidence, confirmation, or state writes.

## Handoffs

- Current gap lacks evidence -> `nori-evidence`.
- AC is vague, implementation-centered, or has unresolved acceptance meaning -> `nori-acceptance`.
- Visible product-surface AC lacks modeled actor, entry, visible trigger,
  object, action, interaction surface, required information, feedback, state
  change, persistence, destructive boundary, or evidence shape ->
  `nori-acceptance`.
- Profile risk remains -> `nori-capability-profile`.
- Architecture or build-vs-buy risk remains -> architecture Skills or `nori-build-vs-buy`.
- Project is unhealthy -> `nori-project-health`.
- Ready for next loop -> `nori-acceptance` with the inferred or user-stated next human-facing outcome.

## User Reply Shape

Lead with:

```text
Goal: ...
Current gap: ...
Need user: yes/no
Decision: ...
Next: ...
```

Then add short evidence or risk bullets only when they affect acceptance.

## Misuse Guards

- Do not report confident completion unless required AC are passing or waived, blocking profile items are satisfied or waived, evidence health is clear or accepted, and architecture/build-vs-buy review risks are clear or accepted.
- Do not merge Product decision and Architecture decision.
- Do not describe implementation details as the main progress signal.
- Do not treat next-loop suggestions as approved AC, phases, task lists, evidence, or CLI-generated product candidates.
- Do not hide review-risk completion behind a simple "done".
- Do not rely on `opennori check` to decide AC quality for you. If the report looks complete but the AC is vague from a human perspective, say that clearly and route to `nori-acceptance`.
- Do not ask the user to accept an AC quality risk before showing the concrete missing acceptance questions and offering revision through `nori-acceptance`.
- Do not report broad visible product-surface AC as confidently complete when
  the user still cannot tell which entry, trigger, fields, feedback,
  persistence, destructive boundary, or evidence shape was verified.
- Do not treat dashboard activity, events, or snapshots as completion evidence.
- Do not treat dashboard as a control surface. It can show "Need user"; the user decision is still made in conversation and written by CLI.
- Do not treat MCP resources as a control surface or second state layer.
