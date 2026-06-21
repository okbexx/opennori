---
name: nori-architecture-brainstorm
description: Establish a reviewable OpenNori Architecture Baseline before non-trivial implementation. Use when the user wants a good architecture first, asks for built-in or project architecture profiles, says architecture profile content is in the wrong language, prefers a stack that should shape implementation, expects future agent work to follow a confirmed technical baseline, or asks for architecture around UI/CRUD/dashboard work after Product AC operation paths are concrete.
---

## Mission

Give the agent a confirmed technical direction before it implements Product AC, while keeping architecture separate from user acceptance criteria.

Before proposing a baseline, decide whether this goal needs Architecture Baseline review at all. The CLI must not infer "non-trivial" from the presence of a goal or from natural-language wording. The agent/user records one of:

- `required`: non-trivial implementation, infrastructure, runtime/state/module/dependency/contract boundary, or architecture preference needs a baseline.
- `not_required`: the current goal is simple enough that Product AC evidence can proceed without architecture review.
- `waived`: the user explicitly accepts the architecture review risk for this goal.

If the status is unknown, record the requirement decision with a reason before implementation. Only `required` proceeds to baseline preview/confirmation.

The baseline answers "what architecture should guide this work", not "what steps will the agent perform". It must include both:

- Architecture Charter: product boundary, agent behavior constraints, challenge rule, and build-vs-buy policy.
- Technical Architecture Baseline: runtime topology, source-of-truth model, module/package boundaries, CLI/MCP/API/IPC contract surfaces, data flows, dependency decisions, reference mappings, and verification.

If a baseline only says "use good architecture", "prefer existing patterns", or lists broad principles without concrete runtime/state/module/contract/dependency choices, treat it as incomplete and keep asking architecture questions before confirmation.

Architecture cannot repair vague Product AC. If the current goal or AC is a
visible product surface such as UI, CRUD, dashboard, list, table, form,
settings, admin, desktop, CLI prompt, MCP/tool flow, preview, inspector, or a
management surface, first check whether the Product AC already has an
Acceptance Surface Model: actor, entry, visible trigger, object, action,
interaction surface, required information, feedback, state change, persistence,
destructive boundary, and evidence shape. If the user still cannot tell how
they would operate or judge the product, hand off to `nori-acceptance` before
previewing or confirming an Architecture Baseline. Do not use architecture
questions to decide button/icon/menu/modal/field/delete semantics that belong
in Product AC.

Project Architecture Profiles are user-reviewable architecture assets. Built-in
profiles may remain in the package language, but a project profile created by
the agent for a user's goal must use the current contract or prompt language
for human-readable values. Keep protocol keys, stable ids, and machine-ish
slugs stable; write `title`, `applies_to`, `summary`, `sources[].label`,
`sources[].lesson`, `principles` when they are user-facing, `checks[].statement`,
`checks[].review`, `technical_baseline.*.name`, `decision`, `reason`, `steps`,
`preferred_libraries[].policy`, `avoid`, and build-vs-buy explanation text in
the language the user will review. Prefer explicit language requests; otherwise
read `presentation.language` from the draft/current Nori Contract; if no
contract exists, infer from the user's prompt.

## Start Here

1. Read the current goal, Product AC, `presentation.language`, and `data.architecture.requirement` from resume/status.
2. Read Project Profile for required Skills, preferred stacks, avoid rules, and install policy. Preserve the same language when profile preferences influence project Architecture Profile wording.
3. Inspect existing project architecture, dependencies, package/module layout, state model, command/API/MCP/IPC surfaces, tests, docs, and user-supplied references.
4. If visible Product AC is broad, implementation-centered, or missing its
   operation path, stop architecture work and hand off to `nori-acceptance`.
   Architecture review can continue after the user approves a product surface
   that names the user operation, feedback, persistence, destructive boundary,
   and evidence shape.
5. Decide requirement status from project evidence and user intent:
   - If simple and no architecture boundary is touched, record `not_required` with a reason and return to the current Product AC/evidence loop.
   - If the user waives architecture review, record `waived` with the user's reason and limitations; report it as review risk.
   - If non-trivial, record `required` with a reason before previewing the baseline.
6. Compare mature references and current project evidence before proposing self-built infrastructure.
7. List available architecture profiles and select or create the best fit. If
   creating a project profile, write the user-readable profile values in the
   explicit user language or current `presentation.language`; do not default to
   English just because JSON field names are English.
8. Ensure the selected profile has a concrete `technical_baseline` with runtime topology, source-of-truth model, module boundaries, contract surfaces, data flows, dependency decisions, reference mappings, and verification.
9. Preview the baseline and ask the user to confirm before implementation.
10. After confirmed baseline write, read the returned `data.agent_next` and route to the recommended next Skill.
11. If a dashboard is being watched or `agent_next.dashboard_activity` is present and a current goal/gap exists, publish architecture activity while reviewing or confirming the requirement/baseline: start before architecture work, heartbeat only during longer work, and finish when the turn ends. Prefer the returned command template; otherwise use `opennori activity start --root <repo> --skill nori-architecture-brainstorm --state thinking --summary "..." --json`.

Useful state commands:

- `opennori architecture profiles --root <repo> --json`
- `opennori architecture requirement --root <repo> --goal-id <goal-id> --status <required|not_required|waived> --reason "..." --json`
- `opennori architecture profile --root <repo> --from <profile.json> --json`
- `opennori architecture baseline --root <repo> --goal "<goal>" --profile <profile-id> --json`
- `opennori architecture baseline --root <repo> --goal "<goal>" --goal-id <goal-id> --profile <profile-id> --confirm --json`
- `opennori architecture show --root <repo> --json`
- `opennori activity start|heartbeat|finish --root <repo> --skill nori-architecture-brainstorm --state thinking --summary "..." --json` (required dashboard signal when the dashboard is observed and a current goal/gap exists)

## Natural-Language Mapping

- "First decide the technical architecture" -> compare project evidence, profile preferences, and available profiles; preview a baseline.
- "Use my preferred architecture" -> record or select a project Architecture Profile, then preview a baseline.
- "Architecture Profile 内容为什么是英文", "profile 应该用中文", or "keep the project profile in English" -> revise or recreate the project Architecture Profile's user-readable values in the requested or current contract language. Do not translate built-in package profiles in place, and do not change stable ids or protocol keys for translation.
- "Use OpenNori's built-in good architecture" -> show the relevant built-in profile, including sources, principles, checks, preferred libraries, avoid rules, and build-vs-buy policy.
- "The architecture feels vague" -> split the answer into Architecture Charter and Technical Architecture Baseline; fill the missing runtime, state, module, contract, flow, dependency, reference, and verification decisions.
- "This is a simple change" -> decide whether baseline is needed; if non-trivial implementation or infrastructure is involved, create one.
- "Project CRUD architecture", "dashboard architecture", "settings page architecture", or another visible product surface with broad AC -> first hand off to `nori-acceptance` if the AC does not name entry, trigger, fields, feedback, persistence, destructive boundary, and evidence shape. Architecture can choose state/module/dependency boundaries only after the Product AC surface is reviewable.
- `agent_next.state: architecture_requirement_needs_decision` -> decide and record `required`, `not_required`, or `waived` with a reason. Do not jump straight to baseline because a goal exists.
- "The product is done but architecture is missing" -> treat baseline work as architecture review cleanup, not Product AC failure.

## State Writes

May write Architecture Requirement decisions, project architecture profiles, and confirmed Architecture Baseline files under `.opennori/architecture/`. Use `opennori architecture profile --from <profile.json>` to install project profiles into `.opennori/architecture/profiles/<id>.json`; do not save the source/import JSON under `.opennori/architecture/evidence/`.

When writing a project Architecture Profile source JSON for import, use stable
English field names and ids, but match all human-readable values to the user's
explicit language or the current Nori Contract `presentation.language`. The CLI
stores and validates structure; it does not translate profile prose for the
agent.

`.opennori/architecture/evidence/` is reserved for architecture apply records created by `nori-architecture-apply`. It is not a scratch directory for profile drafts, source profiles, baseline previews, or Product AC evidence. If you need a temporary profile source before importing, keep it outside `.opennori/architecture/evidence/` and report only the managed profile path after import.

Do not write Product AC, acceptance evidence, or implementation tasks.

Must write live dashboard activity for baseline review when the dashboard is observed and a current goal/gap exists. Activity is not baseline confirmation, not build-vs-buy evidence, and not Product AC evidence.

## Handoffs

- After baseline confirmation, follow returned `agent_next`; if it is `work_on_current_gap`, hand off through `nori-architecture-apply` before implementation or evidence recording.
- If profile preferences need to be recorded first, hand off to `nori-capability-profile`.
- If the baseline requires custom infrastructure, hand off to `nori-build-vs-buy`.
- If project evidence contradicts an existing baseline, hand off to `nori-architecture-challenge`.
- If the user changes what the product should do, hand off to `nori-acceptance`.
- If a visible Product AC lacks Acceptance Surface Modeling, hand off to
  `nori-acceptance` before requirement decision, baseline preview, or
  confirmation.

## User Reply Shape

Show architecture as a decision, not a work plan:

```text
Recommended baseline: ...
Why this fits: ...
Runtime topology: ...
State truth: ...
Module boundaries: ...
Contract surfaces: ...
Data flows: ...
Dependency decisions: ...
Reference mappings: ...
Key constraints: ...
Preferred libraries: ...
Avoid: ...
Needs confirmation: yes
```

Match this reply language to the current Nori Contract `presentation.language`
or explicit user request. If the user prompt and contract are Chinese, the
baseline explanation should be Chinese even when stable profile ids and protocol
field names remain English.

## Misuse Guards

- Do not turn architecture choices, profiles, libraries, or Architecture Checks into Product AC.
- Do not create English project Architecture Profile prose for a Chinese goal or
  Chinese current contract unless the user explicitly asked for English.
  Built-in package profiles may remain as shipped, but project profile
  user-readable values should match the user's review language.
- Do not confirm a baseline that is only product boundary, governance principle, or broad preference; it must also include the concrete Technical Architecture Baseline.
- Do not use architecture baseline work to bypass vague visible Product AC. If
  the user operation path is unclear, Product AC must be revised first.
- Do not decide UI controls, CRUD delete semantics, dashboard interaction
  states, or form field scope as hidden architecture assumptions. They belong
  in AC Review Loop when they affect what the user accepts.
- Do not start non-trivial implementation before the baseline is confirmed or explicitly waived by the user.
- Do not force simple goals through Architecture Baseline. Record `not_required` with a concrete reason when architecture review is unnecessary.
- Do not let CLI or fixed text rules decide non-triviality. The agent/user owns that judgment and records the decision.
- Do not silently replace a confirmed baseline; use an Architecture Challenge.
- Do not self-build infrastructure before build-vs-buy evidence exists.
- Do not copy process-centered workflow models into OpenNori architecture decisions.
- Do not treat dashboard activity, events, or snapshots as proof that a baseline is valid or confirmed.
- Do not report both a source profile JSON and `.opennori/architecture/profiles/<id>.json` as installed project profiles. The managed profile is the file under `profiles/`; source files are temporary inputs and should not live under architecture evidence.
