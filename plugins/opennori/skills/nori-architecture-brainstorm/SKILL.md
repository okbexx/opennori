---
name: nori-architecture-brainstorm
description: Establish a reviewable OpenNori Architecture Baseline before non-trivial implementation. Use when the user wants a good architecture first, asks for built-in or project architecture profiles, prefers a stack that should shape implementation, or expects future agent work to follow a confirmed technical baseline.
---

## Mission

Give the agent a confirmed technical direction before it implements Product AC, while keeping architecture separate from user acceptance criteria.

The baseline answers "what architecture should guide this work", not "what steps will the agent perform". It must include both:

- Architecture Charter: product boundary, agent behavior constraints, challenge rule, and build-vs-buy policy.
- Technical Architecture Baseline: runtime topology, source-of-truth model, module/package boundaries, CLI/MCP/API/IPC contract surfaces, data flows, dependency decisions, reference mappings, and verification.

If a baseline only says "use good architecture", "prefer existing patterns", or lists broad principles without concrete runtime/state/module/contract/dependency choices, treat it as incomplete and keep asking architecture questions before confirmation.

## Start Here

1. Read the current goal and Product AC from resume/status.
2. Read Nori Profile for required Skills, preferred stacks, avoid rules, and install policy.
3. Inspect existing project architecture, dependencies, package/module layout, state model, command/API/MCP/IPC surfaces, tests, docs, and user-supplied references.
4. Compare mature references and current project evidence before proposing self-built infrastructure.
5. List available architecture profiles and select or create the best fit.
6. Ensure the selected profile has a concrete `technical_baseline` with runtime topology, source-of-truth model, module boundaries, contract surfaces, data flows, dependency decisions, reference mappings, and verification.
7. Preview the baseline and ask the user to confirm before implementation.
8. After confirmed baseline write, read the returned `data.agent_next` and route to the recommended next Skill.
9. If a dashboard is being watched or `agent_next.dashboard_activity` is present and a current goal/gap exists, publish architecture activity while reviewing or confirming the baseline: start before baseline work, heartbeat only during longer work, and finish when the turn ends. Prefer the returned command template; otherwise use `opennori activity start --root <repo> --skill nori-architecture-brainstorm --state thinking --summary "..." --json`.

Useful state commands:

- `opennori architecture profiles --root <repo> --json`
- `opennori architecture profile --root <repo> --from <profile.json> --json`
- `opennori architecture baseline --root <repo> --goal "<goal>" --profile <profile-id> --json`
- `opennori architecture baseline --root <repo> --goal "<goal>" --goal-id <goal-id> --profile <profile-id> --confirm --json`
- `opennori architecture show --root <repo> --json`
- `opennori activity start|heartbeat|finish --root <repo> --skill nori-architecture-brainstorm --state thinking --summary "..." --json` (required dashboard signal when the dashboard is observed and a current goal/gap exists)

## Natural-Language Mapping

- "First decide the technical architecture" -> compare project evidence, profile preferences, and available profiles; preview a baseline.
- "Use my preferred architecture" -> record or select a project Architecture Profile, then preview a baseline.
- "Use OpenNori's built-in good architecture" -> show the relevant built-in profile, including sources, principles, checks, preferred libraries, avoid rules, and build-vs-buy policy.
- "The architecture feels vague" -> split the answer into Architecture Charter and Technical Architecture Baseline; fill the missing runtime, state, module, contract, flow, dependency, reference, and verification decisions.
- "This is a simple change" -> decide whether baseline is needed; if non-trivial implementation or infrastructure is involved, create one.
- "The product is done but architecture is missing" -> treat baseline work as architecture review cleanup, not Product AC failure.

## State Writes

May write project architecture profiles and confirmed Architecture Baseline files under `.opennori/architecture/`. Do not write Product AC, acceptance evidence, or implementation tasks.

Must write live dashboard activity for baseline review when the dashboard is observed and a current goal/gap exists. Activity is not baseline confirmation, not build-vs-buy evidence, and not Product AC evidence.

## Handoffs

- After baseline confirmation, follow returned `agent_next`; if it is `work_on_current_gap`, hand off through `nori-architecture-apply` before implementation or evidence recording.
- If profile preferences need to be recorded first, hand off to `nori-capability-profile`.
- If the baseline requires custom infrastructure, hand off to `nori-build-vs-buy`.
- If project evidence contradicts an existing baseline, hand off to `nori-architecture-challenge`.
- If the user changes what the product should do, hand off to `nori-acceptance`.

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

## Misuse Guards

- Do not turn architecture choices, profiles, libraries, or Architecture Checks into Product AC.
- Do not confirm a baseline that is only product boundary, governance principle, or broad preference; it must also include the concrete Technical Architecture Baseline.
- Do not start non-trivial implementation before the baseline is confirmed or explicitly waived by the user.
- Do not silently replace a confirmed baseline; use an Architecture Challenge.
- Do not self-build infrastructure before build-vs-buy evidence exists.
- Do not copy process-centered workflow models into OpenNori architecture decisions.
- Do not treat dashboard activity, events, or snapshots as proof that a baseline is valid or confirmed.
