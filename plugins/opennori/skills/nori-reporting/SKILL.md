---
name: nori-reporting
description: Explain OpenNori status, current gaps, completion decisions, user intervention, reports, changes, and context export in human terms. Use when the user asks whether work is complete, what remains, what changed, what they need to do, or how to continue after a completed goal.
---

## Mission

Give the user a concise acceptance-centered answer: what goal is being judged, what gap remains, whether the user must act, whether the goal is complete, and what should happen next.

Reporting is not an implementation diary.

## Start Here

1. Run the narrowest status command that answers the user.
2. Prefer resume/status for current state, report for a durable human report, changes for diff grouping, and context export when another tool needs review context.
3. Read completion, current_gap, evidence_health, profile_review, architecture decision, build_vs_buy health, agent_next, and next_recommendation. Read `acceptance_review` when present, but remember that subjective AC quality is primarily a Skill/user review responsibility.
4. If the user asked to continue, follow `agent_next` routing and its `candidate_goals` instead of stopping at a status dump.
5. If the AC wording is vague from the user perspective, do not present this as normal completion acceptance even when CLI state is objectively complete. Say the evidence may be complete but the AC needs user review, state the ambiguity in human terms, and hand off to `nori-acceptance`.
6. If the user wants a visual live view, use `opennori dashboard --root <repo>` as an observation surface, but keep the completion answer based on status/report data.

Useful state commands:

- `opennori resume --root <repo> --json`
- `opennori next --root <repo> --json`
- `opennori status --root <repo> --json`
- `opennori report --root <repo> --json`
- `opennori changes --root <repo> --json`
- `opennori list --root <repo> --json`
- `opennori context export --root <repo> --json`
- `opennori dashboard --root <repo>`

## Natural-Language Mapping

- "Is it done" -> answer from completion and required AC evidence.
- "What remains" -> identify current_gap and any review risks separately.
- "What do I need to do" -> report user intervention only, not implementation chores.
- "What changed" -> group OpenNori acceptance artifacts separately from implementation files.
- "Generate report" -> create/read the OpenNori report and summarize the decision.
- "Continue" after a complete goal -> inspect `agent_next.candidate_goals`, choose or refine the strongest human-facing next goal, then hand off to `nori-acceptance`.
- "Export for review" -> use context export and state what the reviewer can inspect.
- "Open dashboard" or "watch it run" -> start the local dashboard and explain that it observes activity, current gap, architecture, user-intervention needs, and completion judgment without certifying completion or hosting confirmation controls.
- AC quality or acceptance meaning is unclear -> lead with "objectively evidenced, not confidently acceptable yet" only when evidence is complete; then route to AC revision instead of asking for a blind risk acceptance.

## State Writes

May generate reports, changes output, or context exports. Do not mutate Product AC, evidence, profile, architecture, or lifecycle state.

May start the local dashboard as an observation surface. Do not write Product AC or evidence from dashboard state. Do not tell the user to confirm, reject, waive, approve AC, accept reports, or confirm Architecture Baselines inside the dashboard; collect those decisions in the agent conversation and record them through OpenNori CLI.

## Handoffs

- Current gap lacks evidence -> `nori-evidence`.
- AC is vague, implementation-centered, or has unresolved acceptance meaning -> `nori-acceptance`.
- Profile risk remains -> `nori-capability-profile`.
- Architecture or build-vs-buy risk remains -> architecture Skills or `nori-build-vs-buy`.
- Project is unhealthy -> `nori-project-health`.
- Ready for next loop -> `nori-acceptance` with a selected candidate goal.

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
- Do not treat candidate goals as approved AC, phases, task lists, or evidence.
- Do not hide review-risk completion behind a simple "done".
- Do not rely on `opennori check` to decide AC quality for you. If the report looks complete but the AC is vague from a human perspective, say that clearly and route to `nori-acceptance`.
- Do not ask the user to accept an AC quality risk before showing the concrete missing acceptance questions and offering revision through `nori-acceptance`.
- Do not treat dashboard activity, events, or snapshots as completion evidence.
- Do not treat dashboard as a control surface. It can show "Need user"; the user decision is still made in conversation and written by CLI.
