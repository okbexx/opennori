---
name: nori-architecture-apply
description: Apply a confirmed OpenNori Architecture Baseline while implementing acceptance gaps. Use before non-trivial code changes when a current goal has architecture state, when resuming implementation in a new session, when the agent must ensure Product AC work stays aligned with the baseline, or when implementation of UI/CRUD/dashboard gaps must first confirm the AC has modeled user operation paths.
---

## Mission

Keep implementation work inside the architecture the user accepted, while still advancing the current Product AC gap.

This Skill is for agent behavior during implementation. It is not an architecture design Skill and not a reporting Skill.

Architecture apply must not become a bypass around unclear Product AC. If the
current Product AC involves UI, CRUD, dashboard, list, table, form, settings,
admin, desktop, CLI prompt, MCP/tool flow, preview, inspector, or another
visible product surface, confirm that the acceptance surface already names the
actor, entry, visible trigger, object, action, interaction surface, required
information, feedback, state change, persistence, destructive boundary, and
evidence shape. If the current AC only says "CRUD works", "manage items",
"settings are editable", or "dashboard shows state", hand off to
`nori-acceptance` before implementing or recording architecture apply.

## Start Here

1. Run `opennori status --root <repo> --json` and identify current Product AC gap.
2. Run `opennori architecture show --root <repo> --json` and read `architecture.requirement`.
   - If requirement is `unknown`, hand off to `nori-architecture-brainstorm` to decide and record required/not_required/waived first.
   - If requirement is `not_required`, do not run architecture apply; return to Product AC evidence.
   - If requirement is `waived`, report the waiver risk and return to Product AC evidence unless the user asks to establish a baseline.
3. If requirement is `required`, read the confirmed baseline from `opennori architecture show --root <repo> --json` or `.opennori/architecture/baseline.md`.
4. If the current visible Product AC lacks Acceptance Surface Modeling, stop
   implementation and hand off to `nori-acceptance`. Do not record an apply
   record as a substitute for missing user operation-path acceptance.
5. If a dashboard is being watched or `agent_next.dashboard_activity` is present and a current goal/gap exists, publish live activity while applying the baseline: start before implementation/alignment work, heartbeat only during longer work, and finish when the turn ends. Prefer the returned command template; otherwise use `opennori activity start --root <repo> --skill nori-architecture-apply --state working --summary "..." --json` and let the CLI infer the unique current goal/gap.
6. Compare the intended code change with both baseline layers:
   - Architecture Charter: product boundary, agent behavior constraints, challenge rule, preferred libraries, avoid rules, and build-vs-buy policy.
   - Technical Architecture Baseline: runtime topology, source-of-truth model, module/package boundaries, CLI/MCP/API/IPC contract surfaces, data flows, dependency decisions, reference mappings, and verification.
7. If the change fits, record an architecture apply record for the current AC gap, then read the returned `data.agent_next`.
8. If it conflicts, stop implementation and create an Architecture Challenge.
9. When `agent_next.state` is `evidence_ready_for_recording`, hand off to `nori-evidence` and attach the apply record as architecture context.

Useful state commands:

- `opennori status --root <repo> --json`
- `opennori architecture show --root <repo> --json`
- `opennori architecture apply --root <repo> --goal <goal-id> --criterion <ac-id> --summary "..." --fit "..." --implementation-focus "..." --json`
- `opennori activity start|heartbeat|finish --root <repo> --skill nori-architecture-apply --state working --summary "..." --json` (required dashboard signal when the dashboard is observed and a current goal/gap exists; goal/gap can be inferred when unique)
- `opennori context export --root <repo> --json`

## Natural-Language Mapping

- "Continue implementation" -> read current gap and baseline before editing.
- `agent_next.state: architecture_requirement_needs_decision` -> do not apply architecture yet; hand off to `nori-architecture-brainstorm` to record the requirement decision.
- "Use the established architecture" -> verify the change follows baseline constraints.
- "Keep the bottom-level architecture solid" -> inspect the Technical Architecture Baseline before editing and explain which runtime/state/module/contract/dependency boundary the work touches.
- "Implement project CRUD", "continue dashboard work", or another visible
  surface where the current AC is broad -> hand off to `nori-acceptance` before
  implementation if the user entry, visible trigger, fields, feedback,
  persistence, destructive boundary, and evidence shape are not concrete.
- "This library/structure differs from the baseline" -> hand off to challenge before changing architecture.
- "All AC pass but architecture review remains" -> do not reopen Product AC; report review risk separately.

## State Writes

May write architecture apply records under `.opennori/architecture/evidence/`. These records document baseline alignment for an acceptance gap; they are not Product AC evidence and must not mark an AC passing by themselves. Delegate Product AC evidence, challenges, build-vs-buy decisions, and reporting writes to the responsible Skills.

Must publish live activity for the dashboard when the dashboard is observed and a current goal/gap exists, preferably from `agent_next.dashboard_activity` command templates when present. Activity is not architecture evidence and must not replace apply records or Product AC evidence.

## Handoffs

- Missing requirement decision or missing baseline for required non-trivial work -> `nori-architecture-brainstorm`.
- Visible Product AC lacks Acceptance Surface Modeling -> `nori-acceptance`.
- Baseline conflict -> `nori-architecture-challenge`.
- Custom infrastructure or dependency decision -> `nori-build-vs-buy`.
- After architecture apply returns `agent_next.recommended_skill: nori-evidence` -> `nori-evidence`.
- Completion answer -> `nori-reporting`.

## User Reply Shape

When architecture matters, state:

```text
Current AC gap: ...
Baseline used: ...
Technical boundary touched: ...
Architecture fit: aligned / needs challenge
Implementation focus: ...
```

Keep architecture commentary brief unless there is a conflict or risk.

## Misuse Guards

- Do not silently change stack, state model, dependency policy, directory boundary, or package boundary.
- Do not apply a baseline when `architecture.requirement.status` is `unknown`, `not_required`, or `waived`.
- Do not treat broad principles as enough architecture alignment when a concrete Technical Architecture Baseline exists.
- Do not implement or record architecture apply for broad visible Product AC
  that still lacks actor, entry, visible trigger, object/action, interaction
  surface, required information, feedback, state change, persistence,
  destructive boundary, and evidence shape.
- Do not implement broad refactors unrelated to the current Product AC gap.
- Do not present Architecture Checks as Product AC failures.
- Do not skip evidence after implementation just because the architecture fit is good.
- Do not treat dashboard activity, events, or snapshots as proof that architecture was followed.
