---
name: nori-evidence
description: Record, prune, and judge reviewable OpenNori evidence for acceptance criteria while preserving agent freedom to choose verification methods. Use when the user says to attach a validation, confirms behavior, waives a gap, asks why an AC is passing, says evidence is stale/invalid/insufficient, or broad UI/CRUD/dashboard evidence lacks the modeled user operation path needed for confident passing.
---

## Mission

Make acceptance status reviewable without forcing the agent into fixed verification adapters.

Evidence should let a human understand what was checked, where to inspect it, what it proves, what it does not prove, and how much confidence it deserves.

Evidence for a visible product surface should trace to the AC's modeled user
operation path. Before recording confident passing evidence for UI, CRUD,
dashboard, list, table, form, settings, admin, CLI prompt, or similar visible
workflows, make sure the AC or review context identifies the actor, entry,
visible trigger, object, action, interaction surface, required information,
feedback, state change, persistence, destructive boundary, and evidence shape.
If the evidence cannot name those elements because the AC only says "CRUD
works", "manage items", "settings are editable", or "dashboard shows state",
route to `nori-acceptance` instead of marking it confidently passing.

## Start Here

1. Read resume/status to identify the current criterion and latest evidence.
2. If a dashboard is open, the user asked to watch progress, or `agent_next.dashboard_activity` is present and a current goal/gap exists, publish live activity while verifying the current gap: start before verification or evidence review, heartbeat only during longer work, and finish when the turn ends. Prefer the returned activity command template; otherwise use `opennori activity start --root <repo> --skill nori-evidence --state verifying --summary "..." --json` and let the CLI infer the unique current goal/gap.
3. If existing evidence no longer proves the current AC, prune it before relying on status/report/context.
4. Choose a verification method that fits the AC and risk: command output, test, browser check, screenshot, diff, report, artifact, URL, log, human confirmation, waiver, or another reviewable signal.
5. For visible product surfaces, tie the evidence summary/reviewability to the
   modeled operation path: entry, visible trigger, object/action, interaction
   surface, state change, persistence or destructive boundary, and evidence
   shape. If that path is unknown, hand off to `nori-acceptance` before
   recording confident passing evidence.
6. Record basis, sources, reviewability, confidence, and limitations.
7. Read the returned `data.agent_next` after evidence writes and route to the recommended Skill. Do not guess whether to continue, report completion, or request user review.
8. Heartbeat during longer verification, and finish live activity with `opennori activity finish --root <repo> --skill nori-evidence --summary "..." --json` when the evidence turn is complete.

Useful state commands:

- `opennori evidence add --root <repo> --criterion <id> --kind <kind> --summary "..." --result <passing|failing|blocked|waived> --basis <basis> --reviewability "..." --limitations "..." --json`
- Add sources with `--source-command "<command>"`, `--source-path "<path>"`, `--source-url "<url>"`, or `--source "<label or JSON>"`.
- When Product AC evidence was produced under a confirmed Architecture Baseline, attach the architecture context with `--architecture-apply "<apply-id-or-path>"`. This is context, not Product AC proof by itself.
- `opennori evidence prune --root <repo> --criterion <id> --reason "..." --json`
- `opennori activity start|heartbeat|finish --root <repo> --skill nori-evidence --state verifying --summary "..." --json` (required dashboard signal when the dashboard is observed and a current goal/gap exists; goal/gap can be inferred when unique)

## Natural-Language Mapping

- "Attach this test result" -> record command/test evidence with the command and what output means.
- "Use this screenshot/report" -> record artifact evidence with a path or URL and review instructions.
- "I confirmed it works" -> record human confirmation, including what the human confirmed.
- "Waive this AC" -> record waiver evidence with the user's stated reason and limitation.
- "Use the architecture apply record as context" -> attach it with `--architecture-apply`, but still record a user-visible verification source for passing evidence.
- "This evidence is stale" -> prune stale evidence and make the AC eligible to become the current gap again.
- "Why is AC-2 passing" -> summarize latest supporting evidence, basis, sources, confidence, and limitations.
- "CRUD works", "manage projects/items", "settings are editable", "dashboard shows state", or evidence for a visible workflow cannot name the user operation path -> do not record confident passing evidence yet; hand off to `nori-acceptance` for Acceptance Surface Modeling.
- `agent_next.state: architecture_requirement_needs_decision` after evidence -> hand off to `nori-architecture-brainstorm` to record required, not_required, or waived with a reason.
- `agent_next.state: architecture_needs_review` after evidence -> hand off to `nori-architecture-brainstorm`, `nori-architecture-apply`, or `nori-architecture-challenge` as recommended.
- `agent_next.state: completion_needs_review` after evidence -> hand off to `nori-reporting`.
- `agent_next.state: ready_for_next_loop` after evidence -> do not invent more evidence or CLI candidate goals; report completion and prepare the next NoriBrief only if the user asked to continue.

## Evidence Quality

- High-risk passing evidence should not rely only on agent self-summary.
- Weak evidence may still be useful, but report it as lower confidence or review risk.
- Multiple sources can support one AC; combine them when they describe the same user-facing result.
- Architecture apply records can explain that Product AC evidence followed the baseline, but they do not prove the user-visible AC. Pair them with command, artifact, URL, screenshot, report, human confirmation, or another reviewable Product AC source.
- For visible product surfaces, strong evidence names the actual entry,
  trigger, object/action, interaction surface, required information, feedback,
  state change, persistence or destructive boundary, and how the user can
  inspect that result. A screenshot or test name alone is weak if it does not
  show which user operation path was verified.
- Obsolete evidence should not occupy active report or context just to preserve history.

## State Writes

May write or prune evidence records for active criteria. Do not rewrite Product AC, Architecture Baseline, Nori Profile, or reports directly.

Must write live activity state when a dashboard is being observed and a current goal/gap exists. Prefer `agent_next.dashboard_activity` command templates when present. Activity is not evidence and must not be cited as proof of Product AC.

## Handoffs

- If the AC itself is too vague to prove, hand off to `nori-acceptance`.
- If a visible product AC lacks Acceptance Surface Modeling, hand off to
  `nori-acceptance` before recording confident passing evidence.
- If evidence violates required Skill or stack preferences, hand off to `nori-capability-profile`.
- If the verification exposes architecture drift, hand off to `nori-architecture-challenge`.
- After material evidence changes, hand off to `nori-reporting`.

## User Reply Shape

Report evidence in this shape:

```text
Criterion: AC-...
Result: passing / failing / blocked / waived
Basis: ...
Sources: ...
Reviewability: ...
Limitations: ...
Next: ...
```

## Misuse Guards

- Do not force evidence into a fixed adapter taxonomy.
- Do not disguise agent judgment as tool observation or human confirmation.
- Do not keep missing, stale, invalid, or semantically obsolete evidence in the active completion story.
- Do not mark high-risk AC passing with only summary-only evidence unless the user explicitly accepts that risk.
- Do not mark broad visible product-surface AC confidently passing when the
  evidence cannot trace to actor, entry, visible trigger, object, action,
  interaction surface, required information, feedback, state change,
  persistence, destructive boundary, and evidence shape.
- Do not cite dashboard activity, events, or snapshots as Product AC evidence.
