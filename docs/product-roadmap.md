# OpenNori Product Roadmap

Status: confirmed product direction

## Product Thesis

OpenNori is a repo-native engineering workflow for one developer using coding
agents. It gives supported agents the same project knowledge, task boundary,
execution context, verification discipline, and cross-session memory without
introducing a team collaboration system.

OpenNori's differentiator is Outcome-driven completion:

- A human-reviewable Nori Contract defines what done means.
- Required Outcomes must be approved before implementation starts.
- Reviewable Evidence, not task activity, determines whether an Outcome is proven.
- A task cannot finish until every required Outcome is proven or explicitly
  waived and current-revision delivery is verified.
- Stable implementation learnings are promoted back into project specs before
  the task is archived.

The product is intentionally compact. Foundation scope contains only the
capabilities required by the normal user path and one authoritative workflow.

## Real User Path

The first complete path is Codex-first:

```bash
npx opennori setup
opennori init --user <name>
```

The user then stays in the agent conversation:

```text
Use OpenNori for this goal: <goal>
```

The agent follows one task workflow:

1. **Plan**: inspect project specs and relevant code, ask one
   completion-changing question at a time, create a task, and draft a Nori
   Contract and plan commit or pull request delivery.
2. **Implement**: after contract approval, load the curated implementation
   context and implement the task without claiming completion.
3. **Verify**: load the independent check context, inspect the diff, run the
   project checks, append Evidence against each Outcome, then verify the
   implementation commit or pull request.
4. **Finish**: refuse completion while Evidence or delivery is missing, promote
   stable learnings into project specs, archive with one developer journal
   entry, and verify the clean final Git checkpoint.

The user should see the current task, current stage, current Outcome gap,
latest evidence, required decision, and next action. Internal platform files,
runtime pointers, hashes, and manifests are agent/operator details.

## Capability Roadmap

OpenNori capabilities are implemented and verified in dependency order.

| Order | Capability | OpenNori mapping | Completion proof |
| --- | --- | --- | --- |
| 1 | Setup and project initialization | Host-level CLI/Plugin setup, safe `init`, project workflow, config, specs, workspace, and Codex adapter | A clean machine completes setup once; a clean repository initializes without host mutation; a new Codex session discovers the workflow |
| 2 | Repo-native spec system | `.opennori/spec/` with scoped project conventions | A task context manifest can reference and load relevant specs |
| 3 | Task artifact system | Task directory with lifecycle state, Nori Contract, context manifests, research, design, and evidence | A task survives a new session and exposes one deterministic current state |
| 4 | Workflow protocol | Plan -> Implement -> Verify -> Finish in `.opennori/workflow.md` | State transitions are derived from task and contract state, not a second phase store |
| 5 | Context injection | `implement.jsonl` and `check.jsonl`, loaded by platform Skills/adapters | Implement and check receive different curated context without whole-repo injection |
| 6 | Outcome completion | Approved Contract plus append-only Evidence | Finish is blocked until all required Outcomes are proven or waived |
| 7 | Workspace memory | Per-developer journal and session task pointer | A new session recovers task context and previous work without chat replay |
| 8 | Knowledge promotion | Finish-time spec update workflow | Stable lessons become reviewed project specs before archive |
| 9 | Managed distribution | Ownership, content hashes, update preview, backup-based replacement, safe uninstall | User-modified files are preserved and managed files update deterministically |
| 10 | Platform adapters | Registry-backed adapters over one workflow kernel | The same task/workflow semantics work through platform-native assets |
| 11 | Session memory search | Bounded adapters for supported host session stores | A user can find and extract prior project discussions without making them truth |
| 12 | Coordination observations | Host-native worker/message/interrupt observations with local task bindings | Multi-agent coordination is durable and does not redefine task completion |
| 13 | Git delivery | Planned base and branch, verified implementation commit or pull request, and clean archived checkpoint | Finish cannot claim completion before project changes and repo-native task state share a verified Git history |
| 14 | Long-term upgrades | Versioned state migrations integrated with preview, Doctor, rollback, and managed updates | A schema 1 project migrates active and archived tasks without changing Contract, Evidence, Specs, or journal content |
| 15 | Product distribution | Stable ESM API, CI, changelog, migration policy, release process, and npm provenance | A packed artifact works through CLI and API; a matching explicit GitHub Release is the only publication trigger |

Capabilities are implemented and verified in this order. Later capabilities
cannot introduce a second task state machine or bypass Outcome completion.

## Architecture Pattern

### Kernel

```text
Agent conversation
  -> platform Skill/command/agent
  -> canonical workflow protocol
  -> OpenNori CLI
  -> task, contract, delivery, evidence, spec, workspace state
```

### Control Plane

- CLI command definitions and structured output.
- Workflow and Skill routing.
- Platform registry and generated assets.
- Managed-file ownership, update, backup, and uninstall.
- State migration planning, rollback, and Doctor recovery.
- Public package exports and explicit provenance-bearing release automation.

### Data Plane

- Project specs.
- Task records and Nori Contracts.
- Git delivery plans and verified results.
- Curated implement/check context manifests.
- Typed Evidence observations and research artifacts.
- Developer journals and per-session active-task pointers.

The Codex and Claude Code adapters read the same core state and never own a
parallel workflow. Further platform expansion is not a product goal.

## State Model

`task.json` is the only lifecycle state authority. A stage is derived from its
status:

| Task status | Workflow stage |
| --- | --- |
| `planning` | Plan |
| `in_progress` | Implement |
| `review` | Verify |
| `completed` | Finish; final user completion waits for the archived Git checkpoint |

A non-completed task may carry a non-null `blocker` without changing status or
losing its current workflow stage.

The task directory contains:

```text
.opennori/tasks/<YYYY-MM-DD-slug>/
  task.json             # lifecycle and task relationships
  contract.json         # approved Outcome definition
  contract.md           # generated human review surface
  delivery.json         # planned and verified Git delivery
  design.md             # optional technical design
  implement.jsonl       # curated specs/research for implementation
  check.jsonl           # curated specs/research for verification
  evidence.jsonl        # append-only evidence facts
  research/             # durable task research
```

Rules:

- `contract.json` is the only approved Outcome authority.
- `contract.md` is generated and never parsed as state.
- `evidence.jsonl` contains facts; Outcome status, current gap, and completion are
  derived at read time.
- There is no parallel lifecycle projection, status sidecar, or event-derived
  workflow state.
- `planning -> in_progress` requires explicit contract approval.
- Approval records the approver, time, canonical Contract content hash, and a
  host confirmation reference when available.
- Approved Contract content must still match its recorded hash when
  implementation starts.
- `review -> completed` requires all required Outcomes to have proven or waived
  Evidence and current-revision delivery.
- `review -> in_progress` repairs a failed or blocked Outcome without replacing
  the approved Contract or erasing Evidence history. It increments the
  implementation revision, and only Evidence from that revision can satisfy
  completion.
- Replan archives the previous Contract, delivery, and both context manifests;
  start stays blocked until their replacements are approved and curated.
- Any non-null blocker stops forward lifecycle transitions until explicitly
  cleared.
- Archiving moves a completed task for organization; the task's `completed`
  status remains the lifecycle truth.

## Project Layout

```text
.opennori/
  config.yaml
  workflow.md
  manifest.json
  spec/
    index.md
    project.md
  tasks/
    archive/<YYYY-MM>/
  workspace/
    index.md
    <developer>/
      index.md
      journal.md
  .runtime/
    sessions/<session-key>.json
    coordination/<task>/<worker-binding>.json
```

The project commits workflow, specs, tasks, contracts, delivery, evidence, and shared
workspace knowledge. `.opennori/.runtime/` is ignored.

## Foundation Implementation Boundary

The current foundation includes:

- A new compact core for project paths, config, task state, contract state,
  evidence evaluation, context manifests, journals, and session pointers.
- Citty `runMain` with native nested command/help handling; no custom CLI
  resolver.
- `setup`, `init`, `doctor`, `status`, `history`, `task`, `update`, and `uninstall` command groups.
- Non-destructive managed-file planning with hashes.
- A registry-backed Codex Plugin adapter and Claude Code project adapter over
  the same managed assets and workflow kernel.
- Bounded Codex Plugin hooks for stage context and task-to-worker observations.
- Read-only, project-scoped host history search with no OpenNori index or copy.
- Host-local coordination bindings over native worker tools, without a queue or
  worker lifecycle state machine.
- Git and provider CLI verification without a custom Git client.
- Forward state migrations with preview, byte-for-byte rollback, and Doctor
  recovery.
- A stable root ESM API with focused task, project, memory, and testing
  subpaths, plus CI and explicit npm release automation.
- Packaged Skills for start/plan, implement, check, finish, spec update, and
  project health.
- Human README and product reference aligned to this workflow.

Every capability extends the same current workflow and state authorities.

## Build-vs-Buy

Need: complete repo-native agent workflow product with deterministic local
state and platform adapters.

Current project: reuse package identity, GPL license, Citty, Ajv, YAML, the
Codex Plugin package boundary, and managed-file ownership. Domain workflow
semantics remain product-owned.

Libraries:

- Citty owns command parsing, nested routing, help, and execution.
- Ajv and ajv-formats own JSON Schema and RFC 3339 timestamp validation.
- YAML owns project configuration parsing and serialization.
- proper-lockfile owns cross-process mutual exclusion for canonical writes.
- p-retry owns bounded CLI backoff for lock contention.
- Node standard library owns narrow filesystem, hashing, and JSONL operations.
- Official `git` and `gh` CLIs own repository and pull request operations;
  OpenNori validates their results.
- npm and official GitHub Actions own package installation, CI, trusted
  publishing, and provenance.

Decision: adapt the existing mature dependencies and independently implement
OpenNori task/contract/evidence semantics. Do not hand-write CLI parsing,
schema validation, Markdown parsing, transport protocols, or search engines.

## Failure Model

- Missing initialization: commands return `project_not_initialized` and the
  exact init command.
- User-modified managed file: update reports a conflict and preserves the file.
- Corrupt task or contract: writes stop; doctor reports the path and recovery
  action.
- No stable host session id: starting a task fails unless the caller supplies
  an explicit session key. OpenNori never falls back to a shared global pointer.
- Missing context file: context loading reports the missing entry and does not
  silently omit it.
- Unapproved contract: implementation start is blocked.
- Missing or failed required Evidence: Finish is blocked with the current Outcome.
- Missing, stale, or mismatched Git delivery: Finish is blocked with a concrete
  commit, worktree, or pull request recovery action.
- Uncommitted archived state: final completion stays blocked until the clean
  checkpoint and remote pull request head are verified.
- Older state schema: Doctor reports the supported update migration; migration
  failure restores original bytes and modes.
- Artifact Evidence with a missing file or mismatched byte size/hash: append is
  rejected before the Evidence log changes.
- Unsupported platform: init lists supported adapters and performs no platform
  writes.
- Missing or incompatible Codex CLI: init performs no project writes and gives
  the exact recovery action.
- Same-name marketplace from another source: init reports a conflict and never
  replaces or removes it automatically.

## Foundation Verification

Use a temporary repository to prove the real path:

1. Run `npx opennori setup`, then `opennori init --user jarl`, and inspect created/managed files.
2. Create a task and confirm its canonical artifact set.
3. Draft and approve a Contract with at least two Outcomes.
4. Add distinct implement/check context and load both.
5. Start the task under a stable session key and recover it in another CLI
   invocation.
6. Show that Finish fails before required Evidence and delivery exist.
7. Enter review, record proven Evidence, commit project changes, and verify
   commit or pull request delivery.
8. Finish, archive with its single journal entry, commit the final repo-native state, and
   finalize the clean checkpoint.
9. Migrate a schema 1 project and inject a failure to prove rollback.
10. Modify a managed file and show that update preserves it.
11. Run Doctor, package build, packed API import, and release dry-run.

The foundation is complete only when this path works through the single
authoritative workflow and completion model.
