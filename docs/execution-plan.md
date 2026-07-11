# OpenNori Execution Plan

Status: foundation rewrite technically complete; release not started

## Product Promise

OpenNori makes coding agents deliver the outcomes a user approved and show why
those outcomes can be trusted.

The normal user path remains:

```bash
npx opennori setup
opennori init --user <name>
```

Then, in a new Codex conversation:

```text
Use OpenNori for this goal: <goal>
```

User-facing language centers on the agreed result, current stage, current gap,
required decision, and verified Git delivery. Task, Contract, Outcome, Evidence,
context manifests, implementation revisions, session pointers, ownership, and
hashes remain deeper review or agent/operator concepts unless recovery requires
them.

## Execution Rules

- Deliver one user-visible capability per milestone.
- Define the entry, failure states, completion proof, and non-goals before code.
- Detail only the active milestone; keep later milestones coarse.
- Keep one current product route and one authoritative state model.
- Do not add a second lifecycle or completion authority.
- Keep product documentation self-contained and free of external comparison
  history.

## P0-A: Outcome Language

Status: complete

User entry: the agent drafts and reviews one Nori Contract.

User sees:

- a goal
- required and optional Outcomes
- how each Outcome will be verified
- the current unproven Outcome

Agent-facing state:

- `outcomes[]`
- `outcome_id`
- stable ids such as `outcome-user-path`
- derived Outcome status: `unproven`, `proven`, `failed`, `blocked`, or `waived`

Completion proof:

1. Public schemas, CLI JSON, reports, Skills, templates, and docs use Outcome.
2. Public state and guidance use the same current terminology.
3. Contract and Evidence state outside the current schemas fails validation.
4. The full temporary-project workflow passes with Outcome-shaped state.

Non-goals: Contract revisions and UI presentation beyond current CLI/report
surfaces.

## P0-B: Human Approval Provenance

Status: complete

Record who approved the Contract, when, which canonical Contract content was
approved, and the host confirmation reference when one is available. Starting
implementation must fail if the approved content hash no longer matches.

The CLI records approval provenance but does not manufacture human consent.
The platform Skill owns the confirmation interaction.

## P0-C: Reviewable Evidence Capture

Status: complete

Evidence inputs support typed, reviewable observations:

- command: command text, exit code, stdout, and stderr
- artifact: project-relative path, byte size, and content hash
- human: actor and host confirmation reference
- URL: stable external reference and summary

Free-form explanation remains available, but cannot be the only source for a
proven Outcome.

Command Evidence should normally be captured with `task evidence run`, which
executes an argv array without a shell and derives the Evidence result from the
numeric exit code. Manual Evidence input remains for artifact, human, URL, and
mixed observations.

## P0-D: Install And Skill Discovery

Status: complete

Host setup installs the matching npm CLI and bundled Codex Plugin through
official package-manager, marketplace, and Plugin commands. Project
initialization does not mutate host state. OpenNori never writes personal
Codex configuration or Plugin cache files directly.

Completion proof:

1. One host setup makes the persistent CLI and matching Plugin ready; project
   initialization then writes only repository assets.
2. Codex discovers the repo marketplace after restart or refresh.
3. A new conversation can load the bundled OpenNori Skills.
4. Doctor distinguishes project readiness from Plugin installation readiness.
5. Update and uninstall preserve unrelated marketplace entries.

## P0-E: Real Host Validation

Status: complete

Run a real goal through Plan, approval, Implement, Verify, Finish, knowledge
decision, journal, and archive in a fresh Codex conversation. Internal CLI
success alone is not completion evidence for this milestone.

## Foundation Completion Gate

Status: complete

The foundation is complete only after:

- the complete temporary-project workflow passes, including return from Verify
  to Implement with fresh Evidence for the new implementation revision
- replan invalidates the old Contract and both context manifests
- lifecycle writes, journal updates, and archives survive injected failures and
  concurrent commands without silent state loss
- doctor identifies corrupt canonical task, Contract, Evidence, and ownership
  state with a concrete recovery action
- setup, init, update, uninstall, and reactivation use one documented path each

The repository regression suite and packed-artifact path exercise every item in
this gate. Foundation completion does not imply release readiness or complete
platform breadth.

## Product Completion Program

The complete product program is active. Milestones remain sequential because
each later capability depends on the authority and adapter boundaries established
before it.

### P1-A: Completion Summary

Status: complete

User entry: Finish and archive a verified task.

User sees the completed goal, every required Outcome, the latest proven or
waived Evidence summary, the knowledge decision, and the full report location.
The compact output omits hashes, runtime pointers, raw command output, and
manifest details.

Agent-facing state remains `TaskView`; the summary is a read-only projection and
never becomes another completion authority.

Completion proof:

1. Human archive output is sufficient to judge what completed and why.
2. JSON archive output exposes the same compact structure for agents and CI.
3. The full Markdown report remains available for deeper review.
4. No Task, Contract, or Evidence schema changes are introduced.

### P1-B: Platform Adapter Registry

Status: complete

Move platform paths, generated assets, health checks, and host capabilities
behind one registry over the same Task/Contract/Evidence kernel. Keep Codex as
the default path and add one independently verified second adapter before
claiming the registry is extensible.

Codex owns its Plugin route. Claude Code uses its official project instruction
and Skill locations. Both adapters are produced by the same managed lifecycle,
diagnosed through platform-specific host checks, and exercised from the packed
artifact without changing the default Codex commands.

### P1-C: Codex Turn Context

Status: complete

Use official Plugin hooks to inject a bounded stage breadcrumb and selected
curated context at supported Codex lifecycle events. Hooks remain guidance and
context delivery; the CLI remains the only deterministic transition layer.

`SessionStart`, `UserPromptSubmit`, and `SubagentStart` load the current
session's task, stage, Contract state, current gap, next action, package, and
stage-specific curated context. Session/subagent context is capped at 48 KiB;
per-turn context is capped at 8 KiB and degrades to an explicit context-load
command. Missing projects or session tasks remain silent.

### P1-D: Persisted Session Memory

Status: complete

Read supported host session stores through bounded, read-only adapters. Search
and context extraction may inform Plan but never become project or completion
truth.

The Codex adapter reads host-owned indexes, prompt history, and candidate
transcripts through fixed byte, file, candidate, result, message, and output
limits. `history search` verifies project ownership before returning a match;
`history show` returns only visible user and assistant text. It excludes the
current session by default, never writes host or project state, and fails
explicitly when the configured platform has no supported history adapter.
When a host does not write separate index or prompt-history files, the adapter
falls back to at most 50 recent transcripts and 512 KiB per transcript after
the same project check.

### P1-E: Durable Coordination

Status: complete

Expose worker, message, interruption, and completion observations without
creating a second task lifecycle. Prefer host-native coordination and a mature
event/store implementation over a custom runtime.

Codex remains responsible for worker creation, messaging, waiting, interruption,
and live status. OpenNori stores only schema-validated task-to-worker bindings
and observation timestamps under ignored host-local runtime state.
`SubagentStart` and `SubagentStop` are captured automatically; agent Skills
record successful message and interruption observations without persisting
message bodies. Bindings retain their implementation revision, so stale work is
visible, and no worker observation can change Task or Outcome completion.

### P1-F: Real Product Acceptance

Status: complete

Install the packed product through its normal host path, initialize a clean
repository, open a new supported-agent conversation, complete a real goal, and
verify Plugin discovery, context delivery, completion summary, knowledge
promotion, journal persistence, and archive recovery.

Acceptance used a real npm tarball, isolated Codex home, official local
marketplace installation, and a persistent `codex exec` conversation. Plan
created a draft Contract and stopped for explicit approval. Implement produced
the requested artifact; Verify correctly failed a required Outcome when the Git
index was sandboxed, returned to Implement revision 2, and recorded a blocker.
After the host condition was resolved, the same conversation cleared the
blocker, independently proved every Outcome for revision 2, made an explicit
no-promotion knowledge decision, updated the journal, archived the Task, and
returned the compact completion summary and full report. That acceptance proved
the pre-delivery foundation; the current product gate below supersedes its lack
of Git delivery.

### P2-A: Git Delivery Closure

Status: complete

Plan records commit, pull request, or explicit waiver delivery. Verify binds an
objectively checked implementation commit or pull request to the current
implementation revision. Finish refuses missing or stale delivery, archives the
task, then withholds the user completion claim until a clean Git checkpoint
contains the archived task, delivery record, report, promoted Specs, and journal.
Pull request mode verifies the final remote head and base again.

### P2-B: Long-Term State Upgrades

Status: complete

The install manifest carries the project state schema version. `update --dry-run`
previews forward migrations and affected tasks. Confirmation validates all
inputs, snapshots every changed canonical file, writes atomically under existing
locks, updates the manifest last, and restores original bytes and modes after a
failure. Doctor reports a supported migration as an upgrade action rather than
corruption. Schema 1 to 2 preserves completed history and requires active tasks
to adopt the delivery boundary.

### P2-C: Product Distribution And API

Status: complete

The root npm package exposes a supported ESM API over the same validated kernel
as the CLI. Package, Plugin, and marketplace versions are checked together. CI
runs the full repository and packed-artifact path. Publication is available only
from an exact matching GitHub Release through npm trusted publishing with
provenance. Changelog, migration, security, contribution, and release policies
are part of the product source.

### P2-D: Complete Product Acceptance

Status: complete

Use the packed artifact in fresh Git repositories to prove commit delivery,
pull request verification, blocked Finish, final archived checkpoint, state
migration and rollback, public API import, Doctor recovery, and package dry-run.
No real package publication occurs until the explicit release decision.

The permanent packed-artifact test installs the generated tarball into an
isolated npm prefix, initializes a real temporary Git repository through the
public CLI, completes commit delivery and the archived checkpoint, reaches a
ready Doctor result, and uninstalls managed assets while preserving the archive.
Deterministic provider tests exercise pull request head and base verification
through the official GitHub CLI boundary without pushing a real repository.
Migration tests cover active and archived tasks, Task lock contention,
byte-for-byte rollback, manifest repair, mixed-state refusal, and newer-schema
downgrade refusal. A minimal JavaScript and TypeScript consumer verifies the root
ESM API from the packed package.

## Rewrite Closeout Gate

Status: complete (unreleased)

The foundation rewrite and the agreed complete-product scope are technically
closed. Release remains a separate explicit operation; no package publication,
GitHub Release, commit, or push is implied by this status.

Technical closeout evidence recorded on 2026-07-10:

- the 166-file npm tarball installs into an isolated prefix, exposes its root ESM
  API, initializes through the public CLI, and completes a real temporary Git
  repository from Plan through final delivery checkpoint and safe uninstall
- all 57 integration tests pass, including blocked Finish, clean delivery-plan
  baselines, commit and pull request verification, current-revision invalidation,
  archive recovery, migration rollback, and concurrent lifecycle/runtime writes
- active and archived schema 1 Tasks migrate under lifecycle, runtime, and Task
  locks; malformed, mixed, symlinked, or newer state fails closed without
  rewriting Specs, Evidence, research, or journals
- unknown agent input under `.opennori/.runtime/` keeps its ignore rule and
  ownership during uninstall; reviewed cleanup removes managed runtime while
  preserving Specs, journals, and archives
- an isolated Codex host probe validates the official marketplace and Plugin
  readiness contract used by `init`; prior real-host acceptance remains recorded
  in P1-F
- unreleased maintainer builds may use a user-configured local Codex marketplace
  only when its OpenNori Plugin manifest is readable and matches the CLI version;
  local marketplaces are never passed to the Git marketplace upgrade command
- host setup reports partial progress and converges on retry across separate
  npm and agent-host commits instead of claiming distributed atomicity
- repository checks, package contents, public API typing, Skill frontmatter, CLI
  help, terminology, whitespace, and product-boundary residue are part of the
  final closeout verification

Closeout passed:

- no competing lifecycle, Contract, Evidence, completion, or stage authority
- failure-atomic canonical writes and recoverable archive, journal, and Spec
  promotion boundaries
- implementation-revision invalidation across Evidence and coordination
  observations
- one current user path with no removed compatibility route reintroduced
- full repository checks plus the packed-artifact path in a temporary project

Release preparation starts only after an explicit decision to version, commit,
push, and publish the reviewed source state.

## Deferred Breadth

Additional platform adapters, multi-person collaboration, rich UI, remote
control planes, and provider execution remain outside the current program.

## Product Build-vs-Buy

### Independent Verify Reviewer

Need: make Verify independent by default on the primary host without creating a
second lifecycle, Evidence authority, or worker runtime.

Current project: the Plugin already injects curated check context on
`SubagentStart`, observes `SubagentStart` and `SubagentStop`, binds workers to an
implementation revision, and keeps all coordination state outside Task and
Outcome authority.

User references: Codex is the primary host; Claude Code remains the bounded
second adapter with a sequential core workflow.

TK references: established coding-agent workflows use a fresh reviewer with an
explicit recursion guard and require it to inspect the actual code instead of
trusting an implementer report.

Official SDK / standard library: current Codex releases can delegate when a
Skill requests subagents, surface the child thread, and let the host own spawn,
wait, messaging, interruption, sandbox, and lifecycle behavior.

Mature OSS: no external orchestration package is needed because orchestration
is already supplied by the host and OpenNori already owns the narrower
coordination observation boundary.

Decision: reuse Codex host-native subagents and adapt the existing Skill, hook,
check-context, and coordination surfaces.

Reason: this produces a fresh review context while preserving `task.json`,
`contract.json`, and `evidence.jsonl` as the only lifecycle, Outcome, and fact
authorities. The reviewer cannot append Evidence or deliver Git; the primary
agent reproduces its observations through the deterministic CLI path.

Risk: skill instructions cannot manufacture host concurrency. If Codex cannot
start a reviewer, Verify must expose that limitation rather than silently claim
independence. Claude Code stays explicitly sequential.

Verification: package-contract tests assert delegation, recursion, Evidence,
and platform-fallback rules; real product acceptance must inspect the spawned
review thread and confirm that only CLI-validated observations affect Finish.

- Completion summary: reuse the current `TaskView`, report renderer, and CLI;
  no reporting framework or new persistence layer is needed.
- Platform support: adapt the existing managed-asset catalog behind a registry;
  platform-specific files stay outside the workflow kernel.
- Codex context delivery: use official Plugin hooks and Skills rather than a
  background daemon or project-local bootstrap runtime.
- Session memory: use read-only host adapters and bounded standard-library file
  reads first; add a search dependency only when measured corpus size requires
  it.
- Coordination: reuse host-native collaboration, official hooks, Ajv, atomic
  writes, and existing locks for narrow local bindings. A hand-written queue,
  event bus, process supervisor, or worker state machine is not allowed.
- Acceptance: use packed artifacts, isolated host configuration, and real
  supported-agent conversations; do not make publication a prerequisite for
  local product proof.
- Git delivery: use official `git` and provider CLIs for repository operations;
  OpenNori stores the reviewed boundary and validates the resulting history. It
  does not implement a Git client.
- State upgrades: adapt the existing Ajv schemas, atomic writes, manifest, and
  locks. Project-specific forward transforms remain domain code; no database or
  general migration framework is introduced.
- Distribution: use npm package exports, npm trusted publishing, provenance, and
  official GitHub Actions. OpenNori does not implement a registry or updater.
- Public SDK boundaries: adapt the existing TypeScript modules behind Node
  package subpath exports. Keep one release unit until an independent consumer
  needs a separate installation or version lifecycle; do not add a workspace,
  bundler, or package-sync mechanism prematurely.

## Build-vs-Buy

- Citty owns CLI parsing and nested help.
- Ajv and ajv-formats own JSON Schema and RFC 3339 timestamp validation.
- YAML owns project configuration.
- proper-lockfile owns cross-process mutual exclusion for canonical writes.
- p-retry owns bounded CLI backoff when another OpenNori process holds a lock.
- Node standard library owns bounded filesystem access and hashing.
- npm global installation and Codex marketplace/Plugin commands own host setup.
- Host setup converges across separate npm and agent-host commits; it is not a
  distributed transaction. A failed later step preserves verified earlier
  state and is recovered by an idempotent setup retry.
- OpenNori only implements its domain-specific Contract, Outcome, Evidence,
  and managed-project semantics.

## Verification

Every milestone runs:

```bash
npm run check
```

User-visible milestones additionally run from the packed artifact in a clean
temporary repository. Plugin milestones require a new real Codex conversation.
