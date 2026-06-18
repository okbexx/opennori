---
name: nori-architecture-challenge
description: Create reviewable Architecture Challenges when evidence conflicts with a confirmed OpenNori Architecture Baseline. Use when the baseline appears too heavy, too weak, incompatible with project conventions, blocked by license/security/runtime constraints, or contradicted by implementation evidence.
---

## Mission

Give the user a concrete, evidence-backed decision point before the agent changes architecture.

A challenge is a review artifact. It does not authorize implementation drift by itself.

## Start Here

1. Read the current baseline and current Product AC.
2. Collect the specific project evidence that conflicts with the baseline.
3. Decide whether the conflict is real architecture drift or just implementation detail.
4. Record a challenge with summary, evidence, recommendation, risk, and whether user input is needed.
5. Stop architecture-changing work until the user confirms, revises, or waives.
6. If a dashboard is being watched or `agent_next.dashboard_activity` is present and a current goal/gap exists, publish live activity while preparing the challenge: start before challenge work, heartbeat only during longer work, and finish when the turn ends. Prefer the returned command template; otherwise use `opennori activity start --root <repo> --skill nori-architecture-challenge --state thinking --summary "..." --json`.

Useful state command:

`opennori architecture challenge --root <repo> --summary "<conflict>" --evidence "<project evidence>" --recommendation "<suggested baseline change>" --json`

Dashboard signal when observed:

`opennori activity start|heartbeat|finish --root <repo> --skill nori-architecture-challenge --state thinking --summary "..." --json`

## Natural-Language Mapping

- "The baseline does not fit this repo" -> record a challenge with project evidence.
- "This dependency is not viable" -> challenge the dependency policy with license, maintenance, security, package size, performance, or integration evidence.
- "Can we just use another architecture" -> create a challenge first; do not silently switch.
- "User approved the change" -> update or create the appropriate baseline through architecture brainstorm/profile flow, then continue implementation.

## State Writes

May write `.opennori/architecture/challenges/*` artifacts. Do not rewrite the baseline, Product AC, evidence, or profile directly.

Must write live dashboard activity for challenge preparation when the dashboard is observed and a current goal/gap exists. Activity is not challenge evidence and does not authorize architecture drift.

## Handoffs

- Need a new baseline after approval -> `nori-architecture-brainstorm`.
- Need build-vs-buy evidence for the recommendation -> `nori-build-vs-buy`.
- Need completion/status summary -> `nori-reporting`.
- If the conflict changes what the product should do -> `nori-acceptance`.

## User Reply Shape

Use:

```text
Architecture challenge: ...
Evidence: ...
Recommendation: ...
Risk if unchanged: ...
Need user: yes/no
```

## Misuse Guards

- Do not treat a challenge as permission to change the baseline.
- Do not create task lists or phases.
- Do not challenge just because another approach is personally preferred.
- Do not hide architecture risk inside implementation notes.
- Do not treat dashboard activity, events, or snapshots as proof that a challenge is resolved.
