---
name: nori-evidence
description: Record, prune, and judge reviewable OpenNori evidence for acceptance criteria while preserving agent freedom to choose verification methods. Use when the user says to attach a validation, confirms behavior, waives a gap, asks why an AC is passing, or says evidence is stale, invalid, or insufficient.
---

## Mission

Make acceptance status reviewable without forcing the agent into fixed verification adapters.

Evidence should let a human understand what was checked, where to inspect it, what it proves, what it does not prove, and how much confidence it deserves.

## Start Here

1. Read resume/status to identify the current criterion and latest evidence.
2. If a dashboard is open or the user asked to watch progress, publish activity such as `opennori activity start --root <repo> --skill nori-evidence --state verifying --summary "..." --json`.
3. If existing evidence no longer proves the current AC, prune it before relying on status/report/context.
4. Choose a verification method that fits the AC and risk: command output, test, browser check, screenshot, diff, report, artifact, URL, log, human confirmation, waiver, or another reviewable signal.
5. Record basis, sources, reviewability, confidence, and limitations.
6. Read the returned `data.agent_next` after evidence writes and route to the recommended Skill. Do not guess whether to continue, report completion, or request user review.
7. Finish live activity with `opennori activity finish --root <repo> --skill nori-evidence --summary "..." --json` when the evidence turn is complete.

Useful state commands:

- `opennori evidence add --root <repo> --criterion <id> --kind <kind> --summary "..." --result <passing|failing|blocked|waived> --basis <basis> --reviewability "..." --limitations "..." --json`
- Add sources with `--source-command "<command>"`, `--source-path "<path>"`, `--source-url "<url>"`, or `--source "<label or JSON>"`.
- When Product AC evidence was produced under a confirmed Architecture Baseline, attach the architecture context with `--architecture-apply "<apply-id-or-path>"`. This is context, not Product AC proof by itself.
- `opennori evidence prune --root <repo> --criterion <id> --reason "..." --json`
- `opennori activity start|heartbeat|finish --root <repo> --skill nori-evidence --state verifying --summary "..." --json`

## Natural-Language Mapping

- "Attach this test result" -> record command/test evidence with the command and what output means.
- "Use this screenshot/report" -> record artifact evidence with a path or URL and review instructions.
- "I confirmed it works" -> record human confirmation, including what the human confirmed.
- "Waive this AC" -> record waiver evidence with the user's stated reason and limitation.
- "Use the architecture apply record as context" -> attach it with `--architecture-apply`, but still record a user-visible verification source for passing evidence.
- "This evidence is stale" -> prune stale evidence and make the AC eligible to become the current gap again.
- "Why is AC-2 passing" -> summarize latest supporting evidence, basis, sources, confidence, and limitations.
- `agent_next.state: architecture_needs_review` after evidence -> hand off to `nori-architecture-brainstorm`, `nori-architecture-apply`, or `nori-architecture-challenge` as recommended.
- `agent_next.state: completion_needs_review` after evidence -> hand off to `nori-reporting`.
- `agent_next.state: ready_for_next_loop` after evidence -> do not invent more evidence; report completion and use candidate goals only if the user asked to continue.

## Evidence Quality

- High-risk passing evidence should not rely only on agent self-summary.
- Weak evidence may still be useful, but report it as lower confidence or review risk.
- Multiple sources can support one AC; combine them when they describe the same user-facing result.
- Architecture apply records can explain that Product AC evidence followed the baseline, but they do not prove the user-visible AC. Pair them with command, artifact, URL, screenshot, report, human confirmation, or another reviewable Product AC source.
- Obsolete evidence should not occupy active report or context just to preserve history.

## State Writes

May write or prune evidence records for active criteria. Do not rewrite Product AC, Architecture Baseline, Nori Profile, or reports directly.

May write live activity state when a dashboard is being observed. Activity is not evidence and must not be cited as proof of Product AC.

## Handoffs

- If the AC itself is too vague to prove, hand off to `nori-acceptance`.
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
- Do not cite dashboard activity, events, or snapshots as Product AC evidence.
