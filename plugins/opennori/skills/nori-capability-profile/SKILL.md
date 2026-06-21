---
name: nori-capability-profile
description: Capture and check OpenNori execution preferences such as required Skills, preferred stacks, avoided tools, install policy, and user-declared implementation constraints. Use when the user says a task must use a specific Skill, prefers a library or stack, wants to avoid a tool, requires approval before installs, says profile content is in the wrong language, or declares UI/CRUD/dashboard stack preferences that must stay separate from Product AC operation paths.
---

## Mission

Keep the user's execution preferences visible to the agent and completion report without polluting Product AC.

Project Profile answers "how should the agent work in this project" and
"what constraints affect completion confidence". Product AC still answers
"what can the human user accept".

Project Profile is project-level source data stored under `.opennori/profile/`.
It is not goal-level state, not copied into a Nori Contract, and not an
Acceptance Criterion. Current goals may record Profile compliance evidence in
their ledgers, and status/report/dashboard may show compliance for the current
goal, but the Profile itself belongs to the project.

Project Profile is a user-reviewable asset. Keep machine fields such as `id`,
`type`, `strength`, and `install_policy` stable, but write human-readable values
such as `name`, `purpose`, `scope`, profile evidence summaries, and user-facing
explanations in the current Nori Contract presentation language. Prefer an
explicit user language request; otherwise use `presentation.language` from the
draft/current contract; if no OpenNori contract exists yet, infer from the
user's prompt. A Chinese goal should not produce English profile purpose text
unless the user explicitly asked for English.

Profile items also cannot replace Acceptance Surface Modeling. If the user says
"use Radix", "use design-taste-frontend", "avoid another CSS framework", or
"prefer an existing component library" while defining a UI, CRUD, dashboard,
settings, form, admin, preview, CLI prompt, MCP/tool flow, or management
surface, record the preference as Profile, then still make sure Product AC
names the user entry, visible trigger, object/action, interaction surface,
required information, feedback, state change, persistence, destructive boundary,
and evidence shape. Stack preference is not enough for the user to judge the
product behavior.

## Start Here

1. Read the Project Profile, current/draft status, and `presentation.language`
   before adding duplicate preferences. If no contract exists, still allow
   project-level Profile edits and infer language from the user's prompt.
2. Classify the user's statement as `skill`, `stack`, or `constraint`.
3. Classify strength:
   - `must`: completion is blocked until satisfied or waived.
   - `prefer`: objective completion can pass, but unresolved preference is review risk.
   - `avoid`: violation blocks completion unless waived.
4. Record install policy when the user mentions whether new dependencies or Skills may be installed.
5. If the preference changes the visible product operation, field scope,
   feedback, persistence, or destructive boundary, hand off to
   `nori-acceptance` so it becomes user-confirmed Product AC instead of hidden
   Profile semantics.
6. Record current-goal compliance evidence before confident completion.
7. If a dashboard is being watched or `agent_next.dashboard_activity` is present and a current goal/gap exists, publish live profile activity while recording or checking preferences: start before profile work, heartbeat only during longer work, and finish when the turn ends. Prefer the returned command template; otherwise use `opennori activity start --root <repo> --skill nori-capability-profile --state working --summary "..." --json`.

Useful state commands:

- `opennori profile show --root <repo> --json`
- `opennori profile add --root <repo> --type <skill|stack|constraint> --name "<name>" --strength <must|prefer|avoid> --purpose "<why>" --install-policy <existing_only|ask_before_install|allowed> --json`
- `opennori profile check --root <repo> --json`
- `opennori profile check --root <repo> --record --json` when a current goal exists and automatic checks should be recorded as compliance evidence
- `opennori profile evidence --root <repo> --item <item-id> --result <satisfied|violated|waived> --summary "<evidence>" --json`
- `opennori activity start|heartbeat|finish --root <repo> --skill nori-capability-profile --state working --summary "..." --json` (required dashboard signal when the dashboard is observed and a current goal/gap exists)

## Natural-Language Mapping

- "Must use design-taste-frontend first" -> add a `skill` item with `must`.
- "Prefer Radix UI for components" -> add a `stack` item with `prefer`.
- "Avoid adding another state library" -> add a `constraint` or `stack` item with `avoid`.
- "Ask me before installing packages" -> set install policy to `ask_before_install`.
- "Profile 内容为什么是英文", "profile 应该用中文", or "keep profile in English" -> revise or recreate user-readable profile values in the requested or current contract language. Do not change stable ids or protocol field names just to translate labels.
- "Use Radix for this CRUD page", "use a design Skill first", or "avoid
  duplicate CSS" -> record the stack/Skill/constraint in the Project Profile, then route
  any missing user operation path or UI behavior detail to `nori-acceptance`.
- "This preference can be waived" -> record profile evidence as `waived` with the user's reason.
- "Did we follow my stack preference" -> show Project Profile items and current-goal compliance evidence.

No-current-goal behavior:

- `profile show`, `profile add`, and `profile check` are valid project-level operations.
- `profile evidence` and `profile check --record` require a current goal because they write compliance evidence into that goal's ledger.
- If there is no current goal, explain that the Project Profile is configured but compliance is not evaluated yet.

## State Writes

May write Project Profile items and Project Profile compliance evidence into the current goal ledger. Do not write Product AC, evidence for acceptance criteria, Architecture Baseline, or reports directly.

Must write live dashboard activity for profile work when the dashboard is observed and a current goal/gap exists. Activity is not profile compliance evidence and is not Product AC evidence.

## Handoffs

- If a preference changes what the user can accept as a product outcome, hand off to `nori-acceptance` for AC revision.
- If a visible Product AC is broad and the Profile item only says which
  Skill/library/tool to use, hand off to `nori-acceptance` for Acceptance
  Surface Modeling.
- If a stack preference should shape architecture, hand off to `nori-architecture-brainstorm` or `nori-architecture-challenge`.
- If a preference requires proof, hand off to `nori-evidence` for user-facing verification after profile evidence is recorded.
- If completion is being judged, hand off to `nori-reporting`.

## User Reply Shape

Summarize profile impact separately from Product AC:

```text
Profile item: ...
Strength: must / prefer / avoid
Completion impact: blocks completion / review risk / no current risk
Evidence needed: ...
```

Match the reply language to the Nori Contract `presentation.language` when it
is known. For `zh-CN`, use Chinese labels and keep protocol terms such as
`must`, `prefer`, `avoid`, and stable item ids only where they are useful for
agent state.

## Misuse Guards

- Do not turn Skills, libraries, architecture, or install policy into Product AC.
- Do not describe Profile as current-goal state. It is project-level state; only compliance evidence is goal-scoped.
- Do not write profile `name`, `purpose`, `scope`, evidence summaries, or
  user-facing profile explanations in a different language from the user's
  explicit request or current Nori Contract presentation language. Stable ids
  and protocol keys remain English.
- Do not treat a satisfied Skill or stack preference as proof that the UI,
  CRUD, dashboard, form, settings, or management workflow is acceptable.
- Do not hide user-facing controls, field scope, feedback, persistence, or
  destructive boundaries inside Profile purpose text. If they affect "done",
  revise Product AC through `nori-acceptance`.
- Do not report confident completion with unsatisfied `must`, violated `avoid`, or unaccepted `prefer` review risk.
- Do not install or suggest installing tools when the profile says `existing_only` or `ask_before_install` without user approval.
- Do not treat availability of a Skill as evidence that the product behavior is complete.
- Do not treat dashboard activity, events, or snapshots as proof that a profile item was satisfied.
