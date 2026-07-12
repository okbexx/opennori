# OpenNori Product Reference

OpenNori is a repo-native engineering workflow for coding agents. It combines
durable project knowledge and task artifacts with Outcome-driven completion.

## User Path

Install the host capabilities once, then initialize a repository:

```bash
npx opennori setup
cd <project>
opennori init --user <name>
```

Setup installs the matching npm CLI and configures the selected Plugin through
the official Codex or Claude Code CLI. Initialization only creates the managed
workflow and project route after host readiness and project safety checks pass.
OpenNori does not write personal host configuration or Plugin cache files
directly.
Initialization does not start a task. Open a new Codex conversation and
describe the goal naturally:

```text
Add account deletion with a recoverable confirmation flow.
```

OpenNori is available automatically in the initialized project. With no task
selected, the agent first resumes existing active work or asks the user to
choose between active tasks. Only when none exists does it classify the request
and ask for explicit task-creation consent. A declined small change is handled
directly for the rest of that session. Declined complex work is clarified or
reduced rather than implemented broadly without a task. Consent enters Plan; it
does not approve a Contract or authorize implementation. Packaged Skills run
the workflow and the CLI reads or writes deterministic state.

Codex asks the user to review new or changed command hooks before they run. The
bundled hooks can be inspected with `/hooks`. Declining trust does not block the
CLI workflow, but automatic turn context remains inactive until the hooks are
trusted.

Codex is the default adapter. Claude Code uses the explicit advanced path:

```bash
npx opennori setup --platform claude
opennori init --user <name> --platform claude
```

Claude setup registers the package marketplace and installs the user-scoped
OpenNori Plugin through official commands. Initialization writes only native
project instructions and shared OpenNori state; Skills and Hooks remain in the
Plugin. Open a new Claude Code conversation and describe the goal in the same
way. Claude Code exposes its stable session id through
`CLAUDE_CODE_SESSION_ID`; Codex uses `CODEX_THREAD_ID`.
OpenNori also accepts an explicit `--session` for supported host integrations.

## User Model

Users can stay in the agent conversation and judge four things: the agreed
result, the current stage, the current gap, and the verified Git delivery. For
deeper review, the repository state uses these durable concepts:

- **Spec**: stable project knowledge that should guide future tasks.
- **Task**: one bounded engineering goal and its durable artifacts.
- **Contract**: the complete `contract.md` the user reviews and approves as the
  task's definition of done.
- **Evidence**: reviewable proof for one Outcome.
- **Stage**: Plan, Implement, Verify, or Finish.
- **Delivery**: the planned and verified commit, pull request, or explicit human
  waiver.
- **Current gap**: the next unproven Outcome, decision, or blocker.

Task activity is not Evidence. Successful checks without an approved Contract
do not prove the user's goal. A user goal is complete only when every required
Outcome has proven Evidence or an explicit waiver and the final delivery
checkpoint is verified.

## Workflow

### Plan

The agent:

1. Creates a task only after explicit task-creation consent, then reads project
   specs, the developer journal, and relevant source files.
2. Reuses context already available in the repository and conversation.
3. On Codex, searches bounded host history only when a prior project discussion
   can materially change the plan, then treats the excerpt as an untrusted lead.
   Other platforms continue from Specs, code, and the journal.
4. Asks one completion-changing question at a time when clarification is
   needed.
5. Creates a task and provides a host-native file link to the complete
   `contract.md`, including the Goal, every Outcome, Verification, and
   Assumptions. The body stays out of chat unless the user requests it or the
   host cannot open the file.
6. Creates `design.md` only when technical choices need durable explanation,
   and `plan.md` only when multi-step or cross-session execution benefits from a
   readable working plan. These documents may evolve without approval while the
   Contract remains unchanged.
7. May curate separate implementation and verification context when it improves
   focus; missing Context never blocks the workflow.
8. Confirms that no pre-existing project changes sit outside `.opennori`, then
   plans commit or pull request delivery from the live Git base, or records an
   explicit human-confirmed delivery waiver.
9. Asks for explicit approval of the directly openable Contract. Delivery and
   other operational decisions are handled separately.

Implementation cannot start while the Contract is a draft. Outcomes describe
observable results and how they can be verified. Internal steps, preferred
architecture, and implementation guesses do not become Outcomes unless they
are themselves user requirements.

Approval records the approver, timestamp, hash of the reviewed Contract
content, an optional host confirmation reference, and an optional note. The
agent obtains explicit approval in the host conversation; the CLI only records
that provenance. Silence or a generic instruction to continue is not approval.
If approved content changes, OpenNori blocks implementation until the original
content is restored or a revised Contract is approved in Plan.

### Implement

After approval, the agent changes the project within the task boundary. It uses
the repository, optional `design.md` and `plan.md`, and any available curated
context. It may run focused checks while working, but it does not mark Outcomes
proven or claim completion.

If repository evidence invalidates the Contract, the agent blocks the task and
returns to Plan for a user-reviewed revision. It does not silently broaden the
goal.

### Verify

Verification starts from the approved Contract, not from the implementation
summary. The agent may use an independent check-context list when one is useful,
then inspects the actual diff, runs the project's checks, exercises user-visible
behavior when relevant, and records append-only Evidence for each Outcome.

On Codex, the primary agent delegates the first review pass to one fresh
host-native check subagent by default. The reviewer receives the task id,
required Outcomes, package boundary, and any available check context. It may inspect
and run non-destructive checks, but it cannot write Evidence, transition the
Task, perform Git delivery, or delegate another reviewer. The primary agent
waits for the report, treats it as an untrusted lead, reproduces the claimed
observations, and records only CLI-validated typed Evidence. If Codex cannot
start the reviewer, the primary agent continues sequentially and reports that
reviewer independence was unavailable. Claude Code performs a sequential
verification pass without implying that a separate reviewer ran.

Proven Evidence names what was observed and where the user can review it.
`task evidence run` executes command observations without a shell and preserves
the exact argv, project-relative working directory, exit code, stdout, and
stderr. Exit 0 derives `proven`; another numeric exit derives `failed`.
Artifact observations contain a project-relative path, byte size, and SHA-256;
the CLI checks all three against the current file before append. Human
observations name the actor and host confirmation reference. URL observations
contain a stable HTTPS reference and a concise finding. Free-form summary text
cannot prove an Outcome by itself. Failed or blocked Evidence keeps the task
open. A failed implementation check returns the unchanged Contract to
Implement for correction, then enters Verify again. That return starts a new
implementation revision. Existing Evidence remains append-only history, but
only Evidence recorded for the current revision can prove completion. A waiver
requires an explicit human observation.

After every required Outcome is resolved, the agent uses the host's official Git
tools to commit the reviewed project changes. Pull request delivery also pushes
the planned branch and creates the pull request. The CLI verifies commit
ancestry, branch, remaining project changes, pull request head and target, then
binds the delivery to the current implementation revision.

### Finish

Finish recomputes completion from the Contract, Evidence, and delivery record.
It refuses to complete while a required Outcome is unproven, failed, or blocked,
or while current-revision delivery is missing. Once the task is ready, the agent:

1. Promotes stable, reusable learnings into the project specs.
2. Prepares the durable outcome summary and knowledge decision.
3. Generates `report.md` with the Goal, Outcome Evidence, Git delivery, and any
   remaining limitations.
4. Marks the task completed and archives it for organization; archive writes
   exactly one current-developer journal entry.
5. Commits the archived task, delivery record, report, Specs, and journal as one
   final Git checkpoint and pushes it to the existing pull request when needed.
6. Runs read-only finalization to prove the clean checkpoint and remote head.
7. Gives the user a concise completion report with Evidence, delivery, and
   limitations.

Archive requires an explicit `promoted` or `none` knowledge decision and stores
its explanation in the developer journal. Archive is the only journal write path
for that Task. The CLI records the decision; the
Skill and human review remain responsible for its quality. Successful archive
output includes a compact completion projection: the goal, each required
Outcome's proven or waived Evidence summary, delivery, and the knowledge decision. Raw
command output, hashes, runtime pointers, and manifest details remain in their
review surfaces instead of the user-facing summary.

Finish never merges a pull request or operates a separate Git runtime. The host
executes Git and provider CLI commands; OpenNori records and verifies their
results. An explicit delivery waiver skips Git finalization.

## State Authority

OpenNori keeps one lifecycle state machine:

| State | Derived stage | Meaning |
| --- | --- | --- |
| `planning` | Plan | Task and Contract are being defined. |
| `in_progress` | Implement | Contract is approved and implementation is active. |
| `review` | Verify | Implementation is ready for independent verification. |
| `completed` | Finish | Required Outcomes and implementation delivery are resolved; user completion still waits for the archived final checkpoint. |

Planning, in-progress, and review tasks may carry a `blocker` without changing
their lifecycle state. The current stage therefore remains deterministic.
Every forward transition refuses a non-null blocker. Verify may return to
Implement to resolve failed or blocked Evidence without replacing the approved
Contract or discarding the append-only Evidence history. The return increments
the implementation revision, so every required Outcome must be verified again
before Finish.

`task.json` is the lifecycle authority. The stage is derived from task state;
there is no separate phase store.

Within a task:

- `contract.json` is the internal approved Outcome authority.
- `contract.md` is the only human approval surface and is never parsed as state.
- `design.md` and `plan.md` are optional, human-readable working documents. They
  can evolve without changing lifecycle state or requiring approval.
- `implement.jsonl` and `check.jsonl` are optional curated context manifests.
- `delivery.json` records the delivery plan and current-revision verification.
- `evidence.jsonl` is an append-only record of typed verification observations.
- Each Evidence record is bound to the current implementation revision.
- Outcome status, current gap, and completion are computed at read time from
  the current revision.
- `TaskView.complete` remains the Contract/Evidence projection;
  `delivery_ready` is the delivery projection and `finish_ready` is their
  read-only conjunction.
- `TaskView.archived` is an organization projection used for recovery guidance;
  it is not another lifecycle state.

There is no parallel lifecycle projection or second completion authority.
The implementation commit is stored in `delivery.json`. The final checkpoint is
verified from Git and returned as a read-only projection; it is not written back
into tracked state because a commit cannot contain its own hash.

## Repository Layout

```text
.opennori/
  config.yaml                 # developer, platform, and package roots
  workflow.md                 # canonical Plan/Implement/Verify/Finish protocol
  manifest.json               # managed asset ownership and hashes
  spec/
    index.md                  # spec routing
    project.md                # project-wide conventions
  tasks/
    <YYYY-MM-DD-slug>/
      task.json               # lifecycle authority
      contract.json           # internal approved Outcome authority
      contract.md             # only human approval surface
      delivery.json           # planned and verified Git delivery
      design.md               # optional technical design
      plan.md                 # optional execution plan and progress
      implement.jsonl         # optional implementation context
      check.jsonl             # optional verification context
      evidence.jsonl          # append-only evidence
      report.md               # Finish completion report
      research/               # durable task-specific research
    archive/<YYYY-MM>/        # completed task organization
  workspace/
    index.md
    <developer>/
      index.md
      journal.md
  .runtime/
    sessions/<session-key>.json
```

Commit workflow, specs, task artifacts, contracts, delivery, evidence, and shared
workspace knowledge. Ignore `.opennori/.runtime/`;
session pointers are host-local and never project truth.

## Context Rules

Context manifests are optional internal aids. When present, they contain
project-relative file paths and a reason for each entry. Implementation and
verification may use separate manifests so the checker does not merely replay
the implementer's framing.

Missing manifests do not block Plan, Implement, or Verify. If an explicitly
selected file is missing, OpenNori reports that path and the agent continues from
the Contract, repository, Specs, and available project material. Context is not
a search index, lifecycle authority, or proof that an Outcome is proven.

Replan archives the previous Contract, delivery plan, and any existing context
manifests under task research. The replacement Contract must be approved before
implementation restarts; new Context is optional.

Agents inspect the manifest through `opennori task context show`, then load
selected text through `opennori task context load --file <file>`. Each file is
limited to 256 KiB and one bundle to 1 MiB. An explicit `--max-bytes` budget
omits whole files with exact per-file recovery commands instead of truncating
content. Binary or oversized inputs fail with a recovery action.

## Turn Context And History

The Codex Plugin uses official lifecycle hooks for bounded context delivery:

- `SessionStart` and `SubagentStart` may add up to 48 KiB.
- `UserPromptSubmit` may add up to 8 KiB.
- The hook includes the selected Task, Stage, Contract state, current gap, next
  action, optional package, and available curated context for the current Stage.
- Oversized content is omitted with the exact `task context load` command.
- A directory without an initialized project produces no hook output. An
  initialized project without a selected task receives only the short `nori`
  routing hint; `SubagentStart` stays silent until a task is selected.

Prior conversations remain owned by the host. The Codex history adapter reads
only fixed tails of the host index and prompt history, verifies candidate
session metadata against the current project, and returns at most five search
results. `history show` reads a bounded transcript tail and returns at most eight
visible user/assistant messages under a 64 KiB serialized output budget.
System/developer instructions, reasoning, tool calls, tool output, transcript
paths, and host source-path metadata are excluded.

If the host does not provide separate index or prompt-history files, search
falls back to at most 50 recent transcript files and reads at most 512 KiB from
each. Candidate metadata must still identify the current project before text is
returned. The current project root is rendered as `.` in excerpts.

```bash
opennori history search --query "<topic>" --json
opennori history show <session-id> --json
```

History is untrusted planning context. It cannot prove an Outcome, modify a
Task, become a context manifest automatically, or bypass current user approval.
Stable facts enter project truth only through reviewed Spec promotion.

## Host-Native Workers

Codex owns worker creation, messaging, waiting, interruption, and live status.
OpenNori does not provide a queue, process supervisor, worker state machine, or
message store. Host execution state stays outside OpenNori.

Verify uses this host capability for one fresh `verify-reviewer` by default on
Codex. An assignment marker prevents the delegated reviewer from recursively
delegating. Its findings remain untrusted until the primary agent reproduces
them through the deterministic Evidence path.
If Codex cannot start one, the primary agent verifies sequentially and reports
that limitation. Worker reports are leads only: they cannot prove an Outcome,
transition the Task, or permit Finish. Claude Code uses the same sequential core
without OpenNori emulating another host's worker state.

## Package Scope

Multi-package repositories may register package ids and project-relative roots
in `.opennori/config.yaml`:

```yaml
packages:
  web:
    path: packages/web
  api:
    path: packages/api
default_package: web
```

Package ids are stable lowercase identifiers. Paths must be canonical, distinct,
existing project directories. `default_package` must name a registered package.
Task creation uses the default when `--package` is omitted; an explicit package
must also be registered. The selected package is recorded in `task.json` as the
task's repository scope, while the Contract remains the Outcome boundary.
Create, Start, Verify entry, and Finish refuse an unavailable package scope.
Task selection remains available so an agent can inspect and repair the active
task or package registry; Doctor reports missing, unsafe, or aliased package
directories separately from lifecycle state.

## Spec Promotion

Project specs contain stable knowledge that should affect later tasks: durable
conventions, verified architecture facts, package boundaries, or recurring
commands. Task history, temporary debugging notes, and unverified guesses stay
in the task or journal.

`nori-update-spec` updates the narrowest relevant spec and keeps `spec/index.md`
accurate. Finish invokes it before archive when the task produced reusable
knowledge.

## CLI Surface

Normal users only need initialization and conversation. These direct commands
are useful for inspection and recovery:

```bash
opennori doctor
opennori status
opennori history search --query "<topic>"
opennori history show <session-id>
npx opennori setup --dry-run
opennori platform add claude --dry-run
opennori platform add claude --confirm
opennori update --dry-run
opennori update --confirm
opennori update --repair-manifest --dry-run
opennori update --repair-manifest --confirm
opennori uninstall --dry-run
opennori uninstall --confirm
```

Human `status`, `doctor`, Finish, archive, and final delivery output lead with
the agreed result, current stage, current gap, required decision, and next
action. Canonical status values, implementation revisions, evidence ids, and
ownership details remain available through `--json` or the deeper report and
file review surfaces instead of appearing in the normal summary.

Agents normally route with `opennori status --summary --json`, which keeps the
current gap, Outcome summaries, readiness, and next action while omitting raw
Evidence sources and command output. Verify and Finish use `task show <task>
--json` when they need the full canonical view. The `task` command group owns task,
Contract, delivery, context, evidence, and lifecycle writes; inspect its current command
contract with:

```bash
opennori task --help
```

Do not patch canonical JSON or JSONL state by hand. `contract.md` is the user
approval surface; optional `design.md` and `plan.md` are working documents; the
Finish `report.md` is the durable result. They are not state import APIs.

## Public API And Releases

The `opennori` npm package exports a supported ESM API from its root. The API
reuses the same domain functions, schemas, locks, and recovery behavior as the
CLI; `OPENNORI_API_VERSION` identifies that contract. CLI internals, hooks, and
raw filesystem helpers are not public entry points.

CI runs the complete repository check and packed-artifact tests on the supported
Node version. Publication occurs only from a matching GitHub Release tag through
npm trusted publishing with provenance. The workflow refuses a tag that differs
from `package.json`; publication never runs from initialization, update, or
ordinary development commands. See `docs/releasing.md` and `CHANGELOG.md`.

## Managed Assets

Initialization and update record only files OpenNori actually writes. Content
hashes distinguish unchanged generated assets from user-modified files.

- Update is preview-first and preserves conflicting files.
- Platform addition is preview-first, append-only, and preserves every existing
  adapter and project setting. It writes the new adapter assets and updates the
  install manifest only after the complete plan succeeds.
- Update previews state schema migrations, validates all affected state before
  writes, updates the manifest last, and restores original bytes and modes on a
  migration failure.
- Uninstall removes only safely owned generated assets.
- Specs, tasks, Contracts, evidence, research, and journals are user/project
  content and are preserved by default.
- An unsupported platform or unsafe path stops the operation before writes.

After uninstall, reactivate preserved project content through reviewed
ownership reconstruction and a managed update:

```bash
opennori update --repair-manifest --dry-run
opennori update --repair-manifest --confirm
opennori update --confirm
```

The platform registry supports Codex and Claude Code over the same workflow and
state model. Further platform expansion is not part of the current product.
An existing project adds the other supported host without rerunning
initialization:

```bash
npx opennori setup --platform claude
opennori platform add claude --dry-run
opennori platform add claude --confirm
opennori doctor
```

At runtime, OpenNori selects the configured adapter from `CODEX_THREAD_ID` or
`CLAUDE_CODE_SESSION_ID`. A multi-platform command outside either host, or an
environment that exposes both identifiers, stops instead of guessing.

| Capability | Codex | Claude Code |
| --- | --- | --- |
| Managed workflow, Skills, Task, Contract, and Evidence | supported | supported |
| Automatic turn context | supported | supported |
| Read-only host history | supported | unsupported |
| Fresh host-native Verify reviewer | default | sequential fallback |

An unsupported optional capability fails explicitly and never reads another
platform's host state. The core sequential workflow remains available.

## Failure Behavior

- **Host setup missing**: run `npx opennori setup` before project initialization.
- **Host setup partially applied**: npm and the selected agent host commit their
  own changes. If platform setup fails after the matching CLI is installed,
  OpenNori keeps that working CLI, reports the completed step, and reuses it
  when setup is retried after the host error is resolved.
- **Not initialized**: run `opennori init --user <name>` after setup.
- **Codex CLI unavailable**: install or update Codex before setup.
- **Marketplace conflict**: review the existing same-name source; OpenNori does
  not overwrite or remove it automatically.
- **Plugin missing, disabled, or wrong version**: rerun setup, then open a new
  conversation.
- **Hooks awaiting trust**: inspect and approve them with `/hooks`; continue
  sequentially through the CLI until they are trusted.
- **Manifest missing or unreadable**: preview `update --repair-manifest`, then
  confirm only after reviewing reconstructed ownership.
- **Managed file modified**: update reports a conflict and preserves the file.
- **New adapter path conflicts**: platform addition blocks before any write and
  preserves the existing project and adapter routes.
- **Current host ambiguous or absent**: a multi-platform project stops and asks
  the caller to run from one Codex or Claude Code conversation.
- **Corrupt state**: writes stop; `opennori doctor` reports the path and
  recovery action.
- **No stable session key**: task activation stops instead of using a shared
  global pointer. Codex and Claude Code provide their session ids automatically;
  other supported integrations pass `--session` explicitly.
- **Canonical state busy**: the CLI waits with bounded backoff, then reports
  `state_busy` without retrying unrelated domain failures.
- **Unknown task package**: task creation stops and names the package registry
  recovery in `.opennori/config.yaml`.
- **Contract unapproved**: Implement is blocked.
- **Delivery plan missing**: Implement is blocked until commit, pull request, or
  explicit waiver delivery is planned.
- **Project worktree already dirty during Plan**: delivery planning stops and
  lists the existing project paths to commit, stash, or remove first.
- **Approved Contract changed**: Implement is blocked and reports the recorded
  and actual content hashes.
- **Context missing**: the optional context load identifies the missing entry;
  the workflow continues from the Contract and repository material.
- **History unavailable or format unsupported**: continue from Specs and the
  developer journal; no project state is changed.
- **History outside the project**: the session is rejected without returning
  its text.
- **Fresh reviewer unavailable**: continue sequentially and report the missing
  reviewer independence without weakening Evidence requirements.
- **Evidence incomplete**: Finish reports the current Outcome gap.
- **Delivery incomplete or stale**: Finish reports the required current-revision
  commit, pull request, or waiver.
- **Final checkpoint dirty or absent from the pull request**: completion remains
  unclaimed until the host commits and pushes the archived state and finalization
  succeeds.
- **State schema old**: Doctor reports a reviewed `update --dry-run` migration
  path instead of treating historical state as corrupt.
- **Platform unsupported**: initialization stops before project writes and
  lists the registered adapters.

## Packaged Skills

The Plugin contains seven focused agent protocols:

- `nori`: root router for the current project and task state.
- `nori-plan`: task discovery, optional design/plan/context authoring, delivery
  planning, and complete Contract review and approval.
- `nori-implement`: implementation within an approved task.
- `nori-check`: independent verification, Evidence, and implementation delivery.
- `nori-finish`: completion gate, journal, archive, and final Git checkpoint.
- `nori-update-spec`: stable knowledge promotion.
- `nori-project-health`: initialization, doctor, update, and uninstall recovery.

Skills are instructions for the agent, not user manuals. They do not replace
CLI state validation or human approval. Stage Skills include the canonical CLI
input shapes and command order so an ordinary task does not need to inspect the
OpenNori package source or schemas.

The npm package is both Plugin roots: `.codex-plugin/plugin.json` and
`.claude-plugin/plugin.json` declare the host packages while `skills/` contains
the seven canonical protocols. Each marketplace points to the matching package
version. New Skills and Hooks become available only in a new host conversation.
Both Plugins inject bounded task context. Codex requires the user to review and
trust command hooks.

## Product Boundary

OpenNori owns workflow artifacts, delivery verification, and Outcome completion.
Codex or Claude Code owns agent execution, tools, and Git commands; repository
conventions continue to own engineering and merge policy.

Read-only Codex history can inform Plan without becoming project truth. Host
workers remain entirely host-owned. Additional platform capabilities must
remain explicit adapter features over the same kernel.

## Source Checkout Maintenance

Do not initialize the OpenNori source repository as an OpenNori user project.
Keep local `.opennori/` ignored and verify the product in a temporary Git
repository.

```bash
npm run check
node dist/bin/opennori.js --help
```

## License

GPL-3.0-only
