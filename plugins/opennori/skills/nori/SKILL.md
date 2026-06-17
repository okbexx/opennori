---
name: nori
description: "Root OpenNori router for the complete agent capability bundle. Use when the user says to use or continue OpenNori, asks whether a goal is complete, wants evidence recorded, states required Skills or stack preferences, asks for project health, wants architecture decided first, or expects the agent to use OpenNori without exposing CLI parameters. Treat Plugin discovery, packaged Skills, opennori CLI, and .opennori state as coupled parts of one product."
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

CLI JSON may include `data.agent_next`. Treat it as the deterministic routing surface from the state layer to Skills. Prefer `agent_next.state`, `agent_next.recommended_skill`, `agent_next.instruction`, `agent_next.user_visible_next`, `agent_next.dashboard_activity`, and `agent_next.candidate_goals` over guessing from files or command prose.

`.opennori/agent-guide.md` is only a project-local supplementary guide. Do not depend on it for OpenNori discovery, and do not assume a fresh project has an Architecture Baseline or a current Nori Contract just because `.opennori/` directories exist.

## Start Here

1. Identify the project root from the current workspace or the user's explicit path.
2. If readiness is unknown, run `opennori doctor --root <repo> --json`.
3. If the JSON has `data.agent_next`, follow it:
   - `health_needs_recovery` or `setup_preview_needs_confirmation` -> hand off to `nori-project-health`.
   - `initialized_no_active_contract` -> if drafts exist, show them for approval or revision; otherwise use the user's already stated goal if the current conversation includes one, or ask for the natural-language goal; then hand off to `nori-acceptance`.
   - `ready_with_current_goal` -> run resume/status as directed.
   - `architecture_needs_review` -> follow `recommended_skill` (`nori-architecture-brainstorm`, `nori-architecture-challenge`, or `nori-build-vs-buy`) before non-trivial implementation continues.
   - `work_on_current_gap` -> work only on the current acceptance gap and hand off to `nori-evidence` after verification.
   - `completion_needs_review`, `evidence_needs_review`, or `acceptance_needs_user` -> use reporting/evidence/acceptance as directed and involve the user when `needs_user` is true.
   - `ready_for_next_loop` -> if the user asked to continue, choose or refine one `agent_next.candidate_goals` item and hand off to `nori-acceptance`.
4. If the project is already initialized but the command did not expose `agent_next`, run `opennori list --root <repo> --json`, then `opennori resume --root <repo> --json` or `opennori status --root <repo> --json`.
5. If `.opennori/current` contains multiple goals, treat it as broken state and route to `nori-project-health`; do not ask the user to choose among multiple current goals.
6. If doctor reports missing Plugin discovery, packaged Skills, CLI access, manifest, or project state, route to `nori-project-health`.
7. For first-time machine setup, `nori-project-health` should use `npx opennori setup` preview/confirm; for an installed machine and a new project, use `opennori init` preview/confirm.
8. If `opennori` is not on PATH, route to `nori-project-health` instead of continuing in a half-installed mode. Only use `node ./bin/opennori.js` while developing the OpenNori source checkout itself.

## Natural-Language Mapping

- "Use OpenNori for this goal", "turn this into AC", "the AC is wrong", "brainstorm first" -> hand off to `nori-acceptance`.
- "验收标准用中文", "用中文写 Nori Contract", "write the AC in English", or any explicit Contract language request -> carry that preference to `nori-acceptance`; the child Skill records it as Contract presentation, not as Product AC.
- "把现有契约改成中文/英文" -> hand off to `nori-acceptance`; changing an approved/current Contract language requires explicit user approval and must not happen as an automatic status/report side effect.
- If the user already stated the goal before initialization, do not ask them to repeat it after `opennori init`; continue acceptance discovery for that stated goal.
- "Continue OpenNori", "what is next", "what is the current gap" -> run resume/status, then hand off to `nori-reporting` unless the next action clearly requires another child Skill.
- "Is it complete", "can I accept this", "what do I need to do" -> use `nori-reporting` and answer from required AC, evidence, profile, architecture, and review risks.
- "Record this verification", "use this screenshot/report/test as evidence", "that evidence is stale", "waive this" -> hand off to `nori-evidence`.
- "Must use this Skill", "prefer Radix UI", "avoid this tool", "ask before installing" -> hand off to `nori-capability-profile`.
- "Decide architecture first", "use a better architecture", "follow the baseline", "challenge the baseline" -> use `nori-architecture-brainstorm`, `nori-architecture-apply`, or `nori-architecture-challenge`.
- "Before self-building this parser/installer/schema/storage/UI primitive" -> hand off to `nori-build-vs-buy`.
- "Install", "upgrade", "uninstall", "doctor", "state is broken", "sync local OpenNori plugin", or "Codex Plugin cache is stale" -> hand off to `nori-project-health`.
- "Show me the dashboard", "watch OpenNori run", "I want live status" -> run or suggest `opennori dashboard --root <repo>` and keep completion judgment plus user confirmations in conversation and status/report.
- A complete goal with `agent_next.candidate_goals` and a user asking to continue -> choose or refine one human-facing next goal, then hand off to `nori-acceptance`.

## State Writes

This root Skill should avoid direct writes except for safe readiness checks and setup/init previews. Let child Skills mutate `.opennori/current`, `.opennori/drafts`, `.opennori/architecture`, `.opennori/reports`, `.opennori/brainstorms`, `.opennori/completed`, `.opennori/blocked`, or `.opennori/manifest.json`.

If a dashboard is open, the user asked to watch progress, or `agent_next.dashboard_activity` is present, the active child Skill may publish `opennori activity start|heartbeat|finish`. Prefer the command templates from `agent_next.dashboard_activity`; otherwise use the low-parameter form with `--skill`, `--state`, and `--summary` and let the CLI infer the unique current goal/gap. If no current goal exists, do not bind activity to drafts. If multiple current goals exist, route to project health because current state is invalid. Activity is only a live signal for the user; it must not be used as Product AC evidence or completion proof.

The dashboard may show that a user reply is needed, but it must not approve AC, confirm architecture, waive risks, accept reports, or write completion state. Collect those decisions in conversation and record them through the appropriate OpenNori CLI command.

## Handoffs

Use one child Skill at a time and carry forward only the relevant state:

- Current goal id, current gap, completion confidence, and review risks.
- Any user statement that changes completion meaning.
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
- Do not treat language preference as a Product AC. It is Contract presentation metadata that helps the user review goal, AC, discovery questions, reports, and next candidates.
- Do not silently translate current or approved contracts; language changes to existing contracts require explicit revision and approval.
- Do not split OpenNori into separate Plugin, Skill, and CLI user paths; they are one capability bundle.
- Do not continue a half-installed mode when Plugin discovery, packaged Skills, CLI access, or `.opennori` state is missing; route to project health and recover the missing piece.
- Do not present candidate goals as approved AC, evidence, phases, or task lists.
- Do not answer confidently complete while required AC evidence, blocking profile items, architecture challenges, evidence health, or acceptance review risks remain unresolved or unaccepted.
- Do not turn architecture, profile, build-vs-buy, Plugin, hook, or tool preferences into Product AC.
- Do not treat dashboard activity, events, or snapshots as acceptance evidence.
- Do not treat dashboard as a place for confirmation buttons or state-changing controls.
- Do not suggest copying or syncing OpenNori Skills into the user project; Skills come from the installed OpenNori Plugin, and the CLI only manages `.opennori` state.
