# OpenNori Protocol

OpenNori is the product; Nori is the agent-facing role that turns goals into Nori Contracts.

The human-facing surface is acceptance state:

- goal
- user acceptance criteria
- architecture baseline decision
- current acceptance gap
- evidence summary
- final status

Implementation plans are allowed inside the agent's private reasoning, but they are not the default
progress surface and they are not completion evidence.

For non-trivial goals, OpenNori also carries an Architecture Baseline. Product AC answers what the
human user must be able to accept. Architecture Baseline answers what technical architecture the
agent must follow while producing that outcome. These are reported together but kept separate.

OpenNori is installed and used as one agent capability bundle:

- Codex Plugin distributes and discovers packaged OpenNori Skills.
- Skills define the agent behavior protocols and natural-language routing.
- `opennori` is the deterministic state layer those Skills call.
- `.opennori/` is the project-local contract, evidence, profile, architecture, health, and report store.

Do not present Plugin, Skills, CLI, or `.opennori` state as separate user workflows. Direct CLI use
is an advanced, automation, or debugging route for the same state layer.

## Layered Acceptance Criteria v1

OpenNori itself is accepted only when it satisfies user-tool-operation acceptance criteria.

Each criterion must follow this shape:

```text
As a user,
using [tool or entrypoint],
I perform [concrete operation],
and can [make a judgment or take an action],
within [measurable threshold].
```

The first complete OpenNori acceptance set is layered. The layers prevent the project from
mistaking a working protocol kernel for the complete product.

### L1 Protocol AC

The protocol layer proves that the repository can hold a Nori Contract, evidence record,
current gap, risk gate, and report.

| ID | Tool / entrypoint | User operation | User acceptance criterion | Passing threshold |
| --- | --- | --- | --- | --- |
| AC-P-1 | Editor / file browser | Open the current Nori Contract | The user understands goal, layered ACs, each status, and the current gap. | No chat history or implementation explanation required; understandable within 60 seconds. |
| AC-P-2 | CLI | Run `opennori check` | The user can reject technical implementation details masquerading as ACs. | Files, fields, commands, tests, or modules cannot be accepted as user ACs by themselves. |
| AC-P-3 | CLI | Run `opennori next` or `opennori status` | The user sees the current acceptance gap and completion answer, not a process-step list. | Output answers which AC is missing, whether complete, and whether human action is required. |
| AC-P-4 | CLI / report | Inspect a high-risk AC | The user sees review risk when high-risk passing evidence is only an agent observation. | CLI preserves the submitted objective result but exposes confidence and evidence_health review warnings instead of pretending agent self-summary is confidently complete. |
| AC-P-5 | CLI / Codex | Trigger `opennori report` | The user sees goal, layered AC statuses, evidence summaries, current gap, intervention, and conclusion. | Report is organized by acceptance state and evidence, not process steps. |
| AC-P-6 | CLI / report | Inspect evidence basis | The user can tell what evidence supports passing, blocked, or waived ACs. | Report/status shows evidence summary, basis, confidence, and limitations, not only an agent conclusion. |
| AC-P-7 | CLI / report | Review evidence sources | The user can review evidence sources without constraining how the agent gathered them. | Sources can be commands, artifacts, URLs, screenshots, diffs, human confirmations, or other reviewable references. |
| AC-P-8 | CLI / report | Compare evidence basis types | The user can distinguish tool observations, human confirmations, artifact reviews, protocol checks, and agent observations. | Evidence basis is shown clearly and agent judgment is not disguised as tool or human verification. |
| AC-P-9 | CLI / report | Inspect reviewability and limitations | The user sees how to review evidence and what it does not cover. | Report shows reviewability and limitations for structured evidence. |
| AC-P-10 | CLI / report | Inspect combined evidence sources | The user can see one AC supported by multiple sources. | Evidence can contain multiple sources without forcing them into fixed adapters. |
| AC-P-11 | Codex conversation | Ask the agent to record a verification as evidence | The user does not need to remember evidence CLI flags. | The OpenNori Skill tells the agent to choose a suitable verification method, then record basis, sources, reviewability, confidence, and limitations. |

### L2 Operator AC

The operator layer proves that Codex can actually use OpenNori as the work protocol in conversation.

| ID | Tool / entrypoint | User operation | User acceptance criterion | Passing threshold |
| --- | --- | --- | --- | --- |
| AC-O-1 | Codex conversation | Start a task with "use OpenNori for this goal" | The user sees a draft Nori Contract written from the user's perspective. | Draft ACs describe user actions or judgments; user can approve or revise. |
| AC-O-2 | Codex conversation | Approve or revise the acceptance criteria | The user controls what "done" means. | Agent cannot decide completion before user-confirmed criteria exist. |
| AC-O-3 | New Codex session | Ask to continue OpenNori | The agent restores the current goal and current acceptance gap. | Recovery uses repo files, not old chat context. |
| AC-O-4 | Codex conversation | Ask "is it done?" | The agent answers only from required AC status and evidence. | Complete is allowed only when required ACs are all `passing` or `waived`. |
| AC-O-5 | Codex conversation | Ask "what do I need to do?" | If blocked, the user sees a concrete human action. | Blocked output asks for a decision, input, permission, cost approval, or similar human action. |
| AC-O-6 | Codex conversation | Revise an AC after new facts appear | The changed acceptance basis is preserved. | Updated ACs become the basis for `current_gap` and completion; old criteria are not silently reused. |
| AC-O-7 | Codex conversation | Ask OpenNori to brainstorm a fuzzy idea | The user sees selectable acceptance directions without remembering CLI syntax. | Brainstorm candidates describe user value, observable acceptance direction, and risk; they are not treated as a contract or completion evidence. |
| AC-O-8 | Codex conversation | State required Skills, preferred stacks, avoided tools, or execution constraints | The agent records a Nori Profile without making the user remember CLI syntax. | Must/avoid profile items are shown in contract and report; unsatisfied must items or violated avoid items block completion unless waived. |
| AC-O-9 | Codex conversation | Ask OpenNori to use a good architecture for a non-trivial goal | The user sees Product AC and an Architecture Baseline before implementation starts. | The baseline is not a plan; it names the architecture profile, boundaries, build-vs-buy policy, and challenge rule. |
| AC-O-14 | Codex conversation | Review a newly generated Nori Contract Draft | The user can tell whether the agent understood every AC before approving. | After draft generation, the agent shows a compact overview and then reviews one AC at a time: exact user entry, object or field, visible state/message/result, non-passing examples, and specific evidence object for the current AC; the user confirms or revises that AC before the next AC; final approval is requested only after every AC has been confirmed one by one. If the explanation is generic, adds or changes completion meaning, or cannot be made specific from the draft, the draft is revised instead of approved. |

### L3 Productization AC

The productization layer proves that OpenNori can be installed, reused, reviewed, and cleaned up as
a durable workflow asset.

| ID | Tool / entrypoint | User operation | User acceptance criterion | Passing threshold |
| --- | --- | --- | --- | --- |
| AC-Z-1 | Codex Plugin / package assets | Install or inspect the OpenNori package | The user's agent can discover focused OpenNori Skills without the user memorizing CLI flags. | `.agents/plugins/marketplace.json` points to `./plugins/opennori`; `plugins/opennori/.codex-plugin/plugin.json` points to package-local `skills/`; the `nori` Skill routes natural-language work through acceptance, evidence, profile, architecture, health, and reporting. |
| AC-Z-2 | CLI | Run `opennori init` or `opennori install` | The user can initialize OpenNori project state without unexpected overwrites. | Init/install shows created/skipped assets; existing user content is not overwritten by default. |
| AC-Z-3 | Git / PR diff | Review the agent's changes | The user can separate acceptance evidence changes from implementation noise. | Summary defaults to AC status changes, evidence changes, and user impact. |
| AC-Z-4 | CLI | Run `opennori list` | The user can distinguish the single current goal, draft contracts, completed history, blocked history, and legacy recovery state. | Drafts are listed separately and are not executable; multiple current goals are reported as broken state rather than a normal choice. |
| AC-Z-5 | CLI | Archive a completed or blocked goal | The user removes it from current work while preserving evidence and report. | Current no longer lists the goal; contract, ledger, and report remain recoverable in completed or blocked history. |
| AC-Z-6 | Project file browser | Inspect the project after running OpenNori | The user sees OpenNori-owned state under `.opennori/` instead of a generic project `process/` directory. | Install, draft, brainstorm, report, and archive write OpenNori state under `.opennori/` by default. |
| AC-Z-7 | CLI / project file browser | Run `opennori install` | The user can inspect project OpenNori registration and judge version, managed entries, current/draft/history goals, Plugin Skill availability, and protocol capabilities. | Install output uses create, skip, overwrite, or update semantics; `.opennori/manifest.json` records version, managed files, current/draft/history goals, Plugin state, architecture state, and capabilities. |
| AC-Z-8 | CLI | Run `opennori doctor` | The user can judge whether the project is `ready`, `needs-action`, or `broken`, and see the next recovery action. | Doctor checks `.opennori` structure, manifest consistency, current goal recoverability, legacy active recovery, packaged Plugin Skills, CLI runtime, and recovery suggestions. |
| AC-Z-9 | CLI | Preview install with `opennori install --dry-run` | The user can judge what OpenNori would create, skip, update, or overwrite before writing to the project. | Install plan lists action, kind, managed status, write intent, destructive flag, and reason; dry-run reports zero actual writes. |
| AC-Z-10 | CLI | Apply force install | The user must preview and explicitly confirm destructive install actions before files are overwritten. | Real `opennori install --force` fails without confirmation; dry-run previews destructive overwrites; confirmed force install may write. |
| AC-Z-11 | CLI | Preview and apply uninstall | The user can uninstall OpenNori entry assets without losing acceptance state by default. | Uninstall plan shows removals and preserved state; real uninstall requires confirmation; `.opennori` state is deleted only with `--include-state --confirm`. |
| AC-Z-12 | Codex Plugin / Codex Skills | Use OpenNori Plugin Skills | The agent gets focused OpenNori Skills for acceptance, evidence, Nori Profile, architecture, project health, reporting, and next-loop handoff while the user keeps using natural language. | The npm package ships `.agents/plugins/marketplace.json`, `plugins/opennori/.codex-plugin/plugin.json`, and `plugins/opennori/skills/nori*/SKILL.md`; each Skill is an agent behavior protocol with trigger semantics, state reading, natural-language mapping, state write boundaries, handoffs, user reply shape, and misuse guards; install does not copy Skills into the project; manifest records `plugin`; doctor detects missing packaged Plugin Skills. |
| AC-Z-13 | CLI / project file browser | Establish an Architecture Baseline | The user can see what architecture the agent must follow while implementing Product AC. | `.opennori/architecture/baseline.json`, `.opennori/architecture/baseline.md`, and `.opennori/agent-guide.md` expose the baseline to agents and reviewers. |
| AC-Z-14 | CLI / project file browser | Add a project Architecture Profile | The user can extend built-in profiles with a reviewed project profile. | `opennori architecture profile --from <profile.json>` writes `.opennori/architecture/profiles/<id>.json`; `architecture profiles` lists it before built-ins. |
| AC-Z-15 | CLI / report | Challenge a baseline | The user can review evidence before an agent changes architecture. | `opennori architecture challenge` records current baseline, conflict evidence, recommendation, and user confirmation requirement. |
| AC-Z-16 | CLI / report | Record build-vs-buy decisions | The user can see whether existing dependencies, standard libraries, official SDKs, and mature OSS were checked before self-building infrastructure. | `opennori architecture build-vs-buy` records the decision under `.opennori/architecture/decisions/` and status/report summarize it. |
| AC-Z-18 | README / website / Plugin description | First read the OpenNori entry material | The user understands OpenNori as one agent capability bundle: Plugin discovery, packaged Skills, deterministic CLI state layer, and `.opennori` project state work together. | README Install/Quick Start, website Start, Plugin longDescription, and nori/project-health Skills do not present Plugin, Skills, or CLI as separate user paths; they explain that missing bundle parts should be recovered through doctor/health rather than used as a half-installed workflow. |
| AC-Z-19 | CLI / Codex / npm | Run `npx opennori setup`, then use `opennori init` in projects | The user installs the complete OpenNori capability bundle from one explicit setup entry and can initialize projects with the global CLI. | Setup previews Codex Plugin registration, packaged Skill availability, global CLI install, project `.opennori` initialization, and doctor; unconfirmed setup writes nothing; confirmed setup uses official `codex plugin` and npm commands plus OpenNori project initialization. |

## Required Artifact Pair

OpenNori writes its project-local state under `.opennori/`.

```text
.opennori/
  manifest.json
  protocol.md
  agent-guide.md
  active/
    <goal>.acceptance.md
    <goal>.evidence.json
  completed/
  blocked/
  reports/
  brainstorms/
  events/
    events.jsonl
  activity/
    current.json
  snapshots/
    current.json
  architecture/
    baseline.json
    baseline.md
    profiles/
    challenges/
    decisions/
    evidence/
```

Each current or draft goal has:

- `<goal>.acceptance.md` for human review
- `<goal>.evidence.json` for deterministic agent/tool updates

`.opennori/manifest.json` records the project-local OpenNori registration:

- manifest schema and OpenNori protocol version
- OpenNori package version
- managed `.opennori` files and directories
- the single current goal, draft goals, completed/blocked history, and legacy `.opennori/active` recovery state
- OpenNori Plugin and package Skill asset state
- Architecture Baseline, profile, challenge, build-vs-buy, and agent-readable surface state
- protocol capabilities exposed by this CLI

`opennori init` creates project state through the same preview-first lifecycle used by install.
`opennori install` remains a deterministic project-asset command for agents and automation.
State-changing OpenNori commands refresh the manifest when
`.opennori/` already exists.

## Event, Activity, And Dashboard State

OpenNori may maintain a local observation surface for users:

- `.opennori/events/events.jsonl` is an append-only event ledger for important
  OpenNori state changes and live activity signals.
- `.opennori/activity/current.json` is the latest agent activity signal.
- `.opennori/snapshots/current.json` is a projection for the dashboard.

These files are not Product AC, not implementation plans, and not completion
evidence. They help users observe the acceptance loop while it runs. The source
of truth for completion remains the current Nori Contract, evidence ledger,
Nori Profile, Architecture Baseline, and report state.

`opennori dashboard --root <project>` starts a local loopback HTTP/SSE kernel
and serves a static visual dashboard. `opennori activity ...` lets an agent
publish whether it is thinking, working, verifying, waiting for the user, or
blocked. Activity can explain what the agent is doing, but it cannot mark an AC
passing.

Dashboard is an observation surface, not a confirmation surface. It may show
that a user decision, waiver, Architecture Baseline confirmation, AC approval,
or report acceptance is needed, but it must direct that decision back to the
agent conversation. Product AC, evidence, profile, architecture, report, waiver,
and completion state are written through OpenNori Skills and CLI, not dashboard
buttons or control endpoints.

CLI JSON `data.agent_next.dashboard_activity` is the preferred Skill-facing
hint for live dashboard publishing. If a Skill does not have that hint, it may
call `opennori activity start|heartbeat|finish` with only root, Skill, state,
and summary; the CLI can infer the unique current goal/gap. If no current goal
exists, activity must not bind to drafts. If multiple current goals exist,
activity publishing must fail closed and route to doctor because current state
is broken.

`opennori install --dry-run` returns an install plan. The plan uses deterministic action semantics:

- `create`: missing OpenNori asset would be created
- `exists`: required OpenNori directory already exists
- `skip`: existing file is preserved because `--force` was not used
- `overwrite`: existing file would be overwritten because `--force` was used
- `update`: generated OpenNori state, such as the manifest, would be refreshed

Each planned action also reports `kind`, `managed`, `would_write`, `will_write`, `destructive`,
and a short human-readable reason.

Real `opennori install --force` can overwrite OpenNori-managed files, so it requires explicit confirmation.
Run `opennori install --dry-run --force` first to inspect destructive actions, then rerun with
`--confirm` only if those writes are acceptable.

`opennori uninstall --dry-run` returns an uninstall plan. By default it removes the manifest while
preserving Nori Contracts, evidence records, reports, archives, brainstorms, protocol, guide, and
architecture state. Real uninstall requires `--confirm`. Deleting the whole `.opennori` state
directory requires both `--include-state` and `--confirm`.

## OpenNori Plugin Skills

OpenNori exposes Codex Skills through its Plugin and package assets. These Skills are agent
behavior protocols, not CLI manuals for users. The user should not need to remember Skill names or
command flags; the root `nori` Skill routes natural-language requests to focused Skills:

- `nori`: root router for OpenNori turns
- `nori-autogoal`: converge a rough idea into a standard Nori Contract Draft without creating a separate autogoal artifact
- `nori-acceptance`: discover AC gaps, brainstorm, draft, approve, and revise human-facing ACs
- `nori-evidence`: record reviewable evidence without forcing fixed adapters
- `nori-capability-profile`: record required Skills, preferred stacks, avoided tools, and install policy
- `nori-architecture-brainstorm`: select or create an Architecture Baseline before non-trivial implementation
- `nori-architecture-apply`: read and apply the confirmed baseline before implementation
- `nori-architecture-challenge`: raise evidence-backed requests to revise a baseline
- `nori-build-vs-buy`: record dependency/library/self-build decisions before infrastructure work
- `nori-project-health`: install, upgrade, uninstall, doctor, manifest, Plugin health, and project recoverability
- `nori-reporting`: status, report, current gap, user intervention, changes, and context export

Each packaged Skill states its mission, starting state reads, natural-language mapping, allowed
state writes, handoff rules, user-facing reply shape, and misuse guards. This lets agents use
OpenNori from natural language while the CLI remains a deterministic state layer.

If a user and agent are already discussing goal and AC before OpenNori is initialized or before a
contract is approved, the agent should not restart the user through autogoal or a full discovery
questionnaire. The `nori-acceptance` Skill adopts the current conversation into a standard draft
Nori Contract by preparing a brief with `acceptance_basis.status: "draft"` and
`acceptance_basis.source: "conversation"`, then calling `opennori draft --brief`. The result stays
under `.opennori/drafts/` until the user approves or revises it. Conversation notes are not
completion evidence, and adoption must not start implementation or move the contract to current.

The package ships `.agents/plugins/marketplace.json` pointing to `./plugins/opennori`, where
`plugins/opennori/.codex-plugin/plugin.json` declares `skills: "./skills/"`. `opennori install`
writes project state under `.opennori/`; it does not copy OpenNori Skills into the user's project.
The manifest records `plugin` state, and `opennori doctor` checks whether packaged Plugin Skills are
present and whether the manifest Plugin state is stale.

When upgrading an existing OpenNori project, upgrade entry assets first, then run `opennori check`.
`check` validates current Nori Contract integrity as hard state structure and reports objective
architecture, build-vs-buy, profile, and evidence-health state. It must not be treated as a
subjective AC-quality judge. Vague or possibly implementation-centered ACs such as "modify profile
fields" or "show an error" are handled by the OpenNori Skills and the agent/user conversation. The
agent may use `opennori discover` as a scratch question source, but gap ids and question wording are
not protocol-level acceptance truth. `check` reports `architecture_check` warnings when the current
goal has no confirmed Architecture Baseline, stale agent-readable surface, or unresolved
Architecture Challenges. It reports `evidence_health` warnings when a complete-looking goal relies
on stale, broad, source-free, or non-reviewable evidence. It does not rewrite existing contracts,
evidence, reports, archives, brainstorms, or baselines. The user decides whether to revise affected
criteria, confirm assumptions, accept review risk, revise architecture, or refresh evidence.

## Nori Profile

Acceptance criteria remain human-facing outcomes. A Nori Profile is separate execution
guidance for the agent when the user says things like:

- must use an existing Skill
- prefer a library or stack
- avoid a tool
- ask before installing a dependency
- follow a project-specific constraint

Profile items have:

- `type`: `skill`, `stack`, or `constraint`
- `strength`: `must`, `prefer`, or `avoid`
- `purpose`: why the user wants it
- `install_policy`: `existing_only`, `ask_before_install`, or `allowed`

Completion rules:

- `must` blocks completion until satisfied or waived.
- `prefer` does not block objective completion, but unknown or violated preferences become `profile_review` risk before confident completion.
- `avoid` blocks completion if violated.

Agents translate the user's natural-language preferences into profile records. Users should not
need to remember `opennori profile` commands.

## Architecture Baseline

Architecture Baseline is separate from Product AC. It is not a plan, phase list, task list, or
implementation checklist. It is sticky architecture guidance for agents and maintainers.

It has two layers:

1. Architecture Charter: product boundary, agent behavior constraints, challenge rule, and
   build-vs-buy policy.
2. Technical Architecture Baseline: concrete runtime topology, source-of-truth model,
   module/package boundaries, CLI/MCP/API/IPC contract surfaces, data flows, dependency decisions,
   reference mappings, and verification.

A baseline that only lists broad principles, preferred libraries, or governance constraints is not
concrete enough for non-trivial implementation. Agents should challenge or revise it before coding.

- selected Architecture Profile
- goal it applies to
- architecture principles and boundaries
- technical runtime topology
- source-of-truth and cache/projection boundaries
- module/package ownership boundaries
- CLI/MCP/API/IPC contract surfaces
- implementation data flows
- dependency decisions with reasons
- reference mappings from mature projects or official SDKs
- verification commands or review methods
- Architecture Checks for maintainers or agents
- preferred libraries or technologies
- avoid policy
- build-vs-buy policy
- challenge policy
- agent-readable surfaces

OpenNori includes built-in profiles and supports project profiles under:

```text
.opennori/architecture/profiles/<profile-id>.json
```

Use `opennori architecture profiles --root <project> --json` to list built-ins and project profiles.
The output is intentionally reviewable before baseline confirmation: each profile includes suitable
use cases, reference sources, architecture principles, concrete technical baseline sections,
checks, preferred libraries, avoid boundaries, validation issues, and build-vs-buy policy.
Use `opennori architecture profile --root <project> --from <profile.json> --json` to add a reviewed
project profile. Existing profiles are not overwritten unless the agent uses `--force` after review.

Use `opennori architecture baseline --root <project> --goal "<goal>" --profile <profile-id> --json`
to preview a baseline. Preview has no side effect. After the user accepts it, rerun with `--confirm`.

Once confirmed, the baseline is written to:

- `.opennori/architecture/baseline.json`
- `.opennori/architecture/baseline.md`
- `.opennori/agent-guide.md`

Agent route files such as `AGENTS.md` or `CLAUDE.md` should point new sessions to these surfaces.
`opennori doctor` checks that the baseline exists when a current goal requires it, that the schema is
valid, and that at least one agent route references `.opennori/architecture/baseline.md`.

If project evidence conflicts with a confirmed baseline, the agent must create an Architecture
Challenge instead of silently changing stack, dependency policy, directory boundaries, state model,
or project architecture:

```bash
opennori architecture challenge --root <project> --summary "<conflict>" --evidence "<evidence>" --recommendation "<change>" --json
```

Build-vs-buy decisions are first-class architecture evidence. Before self-building infrastructure,
the agent checks current project dependencies, standard libraries, official SDKs, mature
open-source libraries, and documented reference projects:

```bash
opennori architecture build-vs-buy --root <project> --area "<area>" --need "<need>" --recommendation <reuse|buy|self-build> --summary "<decision>" --json
```

Architecture state affects completion confidence, not Product AC shape. The agent/user first records
Architecture Requirement as `unknown`, `required`, `not_required`, or `waived`; CLI must not infer
non-triviality from the existence of a goal or from natural-language text. When every required
Product AC is `passing` or `waived` but the requirement is still `unknown`, OpenNori reports
`architecture_requirement` review risk. When requirement is `required` and the goal has a
missing/draft/invalid/challenged baseline, stale agent-readable architecture surface, or unhealthy
build-vs-buy decisions, OpenNori reports `architecture_review` or `build_vs_buy` review risk. When
requirement is `waived`, OpenNori reports `architecture_waived` with the recorded reason. It must
not create synthetic ARCH acceptance criteria or replace `current_gap` unless a real Product AC or
blocking Profile item is still incomplete.

## Status Model

- `unknown`: no user-understandable evidence exists
- `failing`: evidence shows the criterion is not satisfied
- `passing`: evidence shows the criterion is satisfied
- `blocked`: user decision or external condition required
- `waived`: user explicitly accepts the unmet criterion with a reason

The workflow ledger is complete only when every required criterion is `passing` or `waived`.
The user-facing completion answer is not confidently complete while `evidence_health` has review
findings, `profile_review` is unresolved, `architecture_requirement`, `architecture_review`, or
`architecture_waived` remains, or `build_vs_buy` is unhealthy, even if the ledger status is already
`complete`.

When a goal is confidently complete, `agent_next.state` becomes `ready_for_next_loop`.
OpenNori CLI does not invent product candidate goals. If the user asks to continue, the Skill uses
the completed contract context, project evidence, and user intent to prepare the next
human-facing NoriBrief, then stores it with `opennori draft --brief`.
Next-loop suggestions are not phases, task lists, approved acceptance criteria, or completion
evidence. A new loop starts only after the Skill creates a standard draft Nori Contract and the user
approves or revises it.

## Risk Gate

OpenNori separates objective acceptance status from confidence and review risk.

If an agent submits `passing` evidence for a high-risk criterion, the CLI preserves the objective
result that was submitted. It does not use a hard-coded strong/weak evidence word list to rewrite
subjective sufficiency. Instead, `confidence` and `evidence_health` surface risk: high-risk passing
evidence based only on `agent-observation`, missing reviewable sources, missing reviewability, or
missing limitations makes completion objectively complete with review risk rather than confidently
complete.

The only downgrade in the core state layer is objective: architecture/context-only sources cannot
prove Product AC by themselves, so passing evidence made only of context sources is downgraded to
product-evidence-required. Product evidence sufficiency remains an agent/user review judgment.

## Free Evidence Structure

OpenNori does not require the agent to use a fixed set of evidence adapters. The agent may choose the
verification approach that fits the task: tests, Git diff, screenshots, browser checks, logs,
artifacts, URLs, AW doctor, human confirmation, or another reviewable signal.

When the agent submits evidence, the user-facing record should explain:

- `basis`: why this evidence can support the AC, such as `tool-observation`,
  `human-confirmation`, `artifact-review`, `protocol-check`, or `agent-observation`
- `sources`: one or more reviewable references, each with a label and optional command, path, URL,
  outcome, or other useful metadata
- `reviewability`: how the user can rerun, reopen, inspect, or otherwise review the evidence
- `confidence`: the evidence strength used by completion and risk gates
- `limitations`: what the evidence does not cover

The shape is intentionally open. OpenNori should preserve arbitrary source metadata instead of forcing
all evidence through a narrow adapter taxonomy.
`evidence_health` audits that reviewability surface without forcing an adapter taxonomy: it warns
about missing sources, missing reviewability, missing limitations, stale timestamps, missing local
artifacts, and high-risk passing evidence based only on agent observation.

## Agent Rule

On every turn:

1. If the user gives a fuzzy goal or candidate AC, use `nori-acceptance` to inspect the goal and prepare the missing acceptance questions. Optionally store those Skill-prepared questions with `opennori discover --goal "<goal>" --questions '<questions.json>' --root <repo> --json` before drafting.
1a. If the user asks for autogoal or wants fewer clarification rounds from a rough idea, use `nori-autogoal`: the Skill reads context, preserves the full user intent, infers assumptions, asks only completion-changing questions, and creates a standard Nori Contract Draft through `opennori draft --brief`. Autogoal is not a new contract type and must not shrink a broad idea into MVP, first version, prototype, phases, or task lists.
1a-i. If the user asks for enhanced autogoal, self-grill, "agent grill yourself", or gives a rough idea such as a todolist and expects OpenNori to flesh out all usage scenarios, `nori-autogoal` must run Enhanced Discovery before drafting. The agent internally expands user roles, entrypoints, scenarios, data objects, rules, state transitions, invalid input, success feedback, persistence, failure/recovery, UI/UX, review methods, assumptions, and out-of-scope boundaries. It then shows a compact `Enhanced Discovery checked` section and only the critical questions that change completion meaning. The Skill-prepared brief must persist `acceptance_basis.source: "autogoal"`, `acceptance_basis.mode: "enhanced"`, `coverage_summary`, `assumptions`, `open_questions`, and optional `out_of_scope` so draft/status/report reveal that enhanced discovery was used. This remains Skill behavior and reviewable contract basis metadata, not a CLI hard validator, new artifact, phase list, process log, or task plan.
1b. If the user asks for a complete product, complete feature loop, full app, full dashboard, full workbench, or explicitly says not MVP, the Skill must define the full acceptance surface before approval instead of compressing the goal into a compact starter AC set. Cover user roles, entry/navigation, core workflows, state transitions, data rules, permissions and boundaries, failure/recovery, persistence, UI/UX when visible, and report/review method. AC count may grow with the real product surface; execution still advances one current gap at a time. Only shrink the completion definition when the user explicitly chooses a prototype, MVP, first version, or narrower scope.
1b-i. For complete-product autogoal or draft revision, the Skill must run a coverage self-check before asking for approval. It should map product surfaces to planned AC boundaries and split unrelated user judgments instead of bundling them into a few broad AC. Typical separate surfaces include project selection, overview, object list/detail, read-only preview, source/version/audit, memory, capabilities, external knowledge, search/index, timeline/audit, permissions/security boundary, state feedback, persistence, failure recovery, and final review/report. This remains Skill/user review behavior, not a CLI hard validator or natural-language quality test.
1c. If the goal includes a visible interface such as a page, app, Dashboard, Desktop, workbench, form, settings screen, or admin console, the Skill must discover UI/UX acceptance as Product AC. It should cover entry/navigation, information hierarchy, empty/loading/error/success states, operation feedback, readability, visual and interaction consistency, recovery paths, and UI boundaries. This is Skill/user review behavior, not a CLI hard validator.
2. Ask only the discovery questions that affect completion judgment. Do not turn discovery gaps into implementation tasks or completion evidence.
3. If the user wants to discuss, brainstorm, explore, or is not ready to define acceptance criteria, prepare candidate directions as the Skill and optionally store them with `opennori brainstorm --idea "<idea>" --candidates '<candidates.json>' --root <repo> --json`.
4. Show only candidate acceptance directions and ask the user to choose or revise a direction. Brainstorm output is not a contract or completion evidence.
5. If the user chooses a candidate, convert the chosen direction into a full NoriBrief with concrete user operations, visible results, boundaries, and review method.
6. If the user starts with "use OpenNori" / "用 OpenNori 跑这个任务" and discovery questions are answered or explicitly accepted as assumptions, prepare a full NoriBrief and run `opennori draft --brief <brief.json> --root <repo> --json`.
7. Show a compact draft overview, then start the AC Review Loop. Review one AC at a time with concrete user entry, action or judgment, visible result, non-passing cases, and evidence type. Ask the user to `confirm AC-<n>` or `revise AC-<n>: ...` before moving to the next AC.
8. Only after every AC has been confirmed one by one, ask for final approval and run `opennori approve --root <repo> --summary "<approval>" --json`.
9. If the user states required Skills, preferred stacks, avoided tools, install policy, or execution constraints, run `opennori profile add --root <repo> ... --json` and keep those items out of the user acceptance criteria.
10. For non-trivial goals, run `opennori architecture profiles --root <repo> --json`, preview a baseline, show it to the user, and confirm it before implementation.
11. If the user provides a preferred architecture, add it with `opennori architecture profile --root <repo> --from <profile.json> --json` before previewing the baseline.
12. Before implementing an acceptance gap, read `.opennori/architecture/baseline.md` and keep Product AC separate from Architecture Checks.
13. Before self-building infrastructure, record a build-vs-buy decision.
14. If project evidence conflicts with the baseline, run `opennori architecture challenge`; do not silently replace the baseline.
15. If the user adds a new acceptance boundary after approval, run `opennori criterion add --root <repo> --id <id> ... --json`; the new criterion becomes an evidence gap without forcing the agent to edit state files manually.
16. If the user revises a criterion while reviewing a draft, run `opennori criterion update --root <repo> --from-draft --goal <goal-id> --criterion <id> ... --json`; the draft remains unapproved and the AC Review Loop restarts from the changed AC. If the user revises an already approved current contract, run `opennori criterion update --root <repo> --criterion <id> ... --json`; old evidence for the changed criterion is cleared and the revised AC becomes the current evidence gap.
17. If the user asks to update an existing OpenNori project, run `opennori doctor`, use `opennori upgrade --dry-run/--confirm` for manifest/protocol/guide refreshes, then run `opennori check`; use `nori-acceptance` to review existing AC wording with the user instead of relying on fixed CLI quality gaps. If packaged Plugin Skills are missing, reinstall or update the OpenNori package instead of copying Skills into the project.
18. Run `opennori resume --root <repo>` or `opennori next --root <repo>` to recover the current goal and current acceptance gap from repository files.
19. Work only to produce evidence for that gap under the confirmed Architecture Baseline.
20. Add acceptance evidence with `opennori evidence add`; choose any suitable verification method, but record basis, sources, reviewability, confidence, and limitations. If existing evidence is invalid or obsolete, run `opennori evidence prune` first so stale proof does not occupy current context. Add profile compliance evidence with `opennori profile evidence` when profile items exist.
21. If a dashboard is useful, publish live activity from `agent_next.dashboard_activity` or `opennori activity start/heartbeat/finish`; do not treat that activity as acceptance evidence or use dashboard controls for confirmation. If no current goal exists, do not bind activity to drafts; if multiple current goals exist, run doctor/project-health because the state is broken.
22. Run `opennori evaluate`.
23. Report acceptance state, profile compliance, and evidence, not implementation steps.
24. If the goal is complete and the user asked to continue, infer or ask for the next human-facing outcome from the completed context and user intent, prepare a full NoriBrief, then run `opennori draft --brief <brief.json> --root <repo> --json`. Do not treat next-loop suggestions as approved AC, phases, task lists, or evidence.

Useful commands:

- `opennori brainstorm --idea "<idea>" --candidates '<candidates.json>' --root <repo>`: store Skill-prepared selectable acceptance directions before a contract exists.
- `opennori discover --goal "<goal>" --questions '<questions.json>' --root <repo>`: store a Skill-prepared question source before drafting a contract; the agent still decides which questions matter for the user.
- `opennori draft --brief <brief.json> --root <repo>`: create a standard draft Nori Contract from a Skill-prepared brief, including autogoal convergence output.
- `opennori approve --root <repo>`: mark the acceptance basis as approved so completion can be decided.
- `opennori criterion add --root <repo> --id <id> ...`: add a newly confirmed acceptance boundary to the current contract and ledger.
- `opennori criterion update --root <repo> --from-draft --goal <goal-id> --criterion <id> ...`: revise a draft AC while keeping the acceptance basis unapproved.
- `opennori criterion update --root <repo> --criterion <id> ...`: revise an approved current AC and clear stale evidence for that AC.
- `opennori evidence add --root <repo> --criterion <id> --kind <kind> --summary "<summary>" --result <passing|failing|blocked|waived> --basis <basis> --source '<json-or-label>' --reviewability "<how to review>" --limitations "<known limits>"`: attach user-understandable, reviewable evidence without forcing a fixed adapter.
- `opennori evidence prune --root <repo> --criterion <id> --reason "<reason>"`: remove invalid or obsolete evidence from a current criterion so reports and context exports only carry current proof.
- `opennori profile add --root <repo> --type <skill|stack|constraint> --name "<name>" --strength <must|prefer|avoid>`: record user execution preferences separately from ACs.
- `opennori profile evidence --root <repo> --item <item-id> --result <satisfied|violated|waived>`: record whether the agent followed the profile.
- `opennori profile show --root <repo>`: show profile compliance and blocking items.
- `opennori list --root <repo>`: list the current goal, drafts, completed/blocked history, and legacy active recovery state.
- `opennori install --root <repo>`: create or refresh project-local OpenNori assets and manifest.
- `opennori upgrade --root <repo>`: preview and refresh project-local OpenNori assets without rewriting current/draft/history contracts or evidence.
- `opennori doctor --root <repo>`: inspect project OpenNori health and recovery actions.
- `opennori check --root <repo>`: validate current contract structure, surface Architecture Baseline health for the current goal, and report evidence health.
- `opennori dashboard --root <repo>`: start a local visual dashboard over OpenNori state.
- `opennori activity start|heartbeat|finish --root <repo>`: publish live agent activity for the dashboard; this is not evidence. Goal/gap may be inferred only when unique.
- `opennori resume --root <repo>`: recover the current goal, current gap, completion answer, and intervention state.
- `opennori status --root <repo>`: answer whether the goal is complete and whether the user needs to act.
- `opennori report --root <repo>`: generate the human acceptance report.
