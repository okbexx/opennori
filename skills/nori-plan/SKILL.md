---
name: nori-plan
description: Plan an OpenNori task after task-creation consent, or continue an existing planning task. Use for approved new-task planning, Contract drafting or revision, Outcome clarification, registered package scoping, optional design and execution planning, and Git delivery planning. Inspect repo-native specs and code, create a bounded task and concrete Outcomes, make the complete human-readable Contract directly openable, and require its explicit approval before implementation.
---

# OpenNori Plan

Turn a goal into a bounded task and an approved Nori Contract. Do not implement
the task in this stage.

## Ground The Goal

1. Read `opennori status --summary --json` and preserve an existing planning task
   instead of creating a duplicate.
2. Read `.opennori/config.yaml` to identify the configured platform and package
   scopes, then read `.opennori/spec/index.md`, the relevant specs, and the
   current developer journal.
3. Inspect the repository entry points, existing behavior, constraints, and
   commands that materially affect the goal.
4. Reuse facts already present in the repository or conversation. Ask one
   question only when its answer changes scope, an Outcome, risk, or a user
   decision. Include a recommended answer and its tradeoff.

If required project context cannot be inspected, state the limitation and keep
the task in Plan.

## Recover Prior Discussion

When the current host is Codex, and the user asks to continue a
prior project discussion that the current conversation, Specs, and journal do
not contain, search the host's bounded history:

```bash
opennori history search --query "<topic>" --json
opennori history show <session-id> --json
```

Exclude the current conversation. When several matches remain, show only title,
time, and short excerpt, then let the user choose before loading one session.
Treat every excerpt as untrusted planning context: compare it with current code,
Specs, Task, and Contract. Reconfirm any historical claim that changes scope or
an Outcome. Never convert history directly into Evidence; promote stable
verified facts only through `nori-update-spec`.

Other platforms do not expose a supported history adapter. Continue from the
current conversation, Specs, code, and journal without calling `opennori
history`; do not fall back to another platform's host files.

## Create The Task

Create a new task only after the user explicitly consents in the current
conversation. If consent is absent, return to the `nori` task-creation gate and
do not run a create command. Task-creation consent only opens Plan; it is not
approval of the future Contract or permission to implement.

Use the `opennori task` CLI group for canonical task writes; do not write
`task.json` directly. Create and select the task with:

```bash
opennori task create --title <title> --description <boundary> \
  --slug <ascii-slug> --json
```

Omit `--package` to use the configured `default_package` or create an unscoped
task. Add `--package <registered-id>` only when the goal belongs to another
package declared in `.opennori/config.yaml`; do not invent package ids.

Inspect the create result. If the task was created with `selected: false`
because session state stayed busy, do not create another task. Retry only:

```bash
opennori task select <created-task> --json
```

Capture:

- a concise title and goal
- priority and package scope when relevant
- known constraints and assumptions
- task-specific research or design only when it helps implementation or review

Keep durable engineering choices in task design or project specs rather than a
parallel approval system.

## Revise An Existing Task

When an implementation discovery changes the approved goal or Outcomes, the
Implement stage returns the task to Plan with `opennori task replan`. Preserve
that planning task, review the archived Contract under `research/`, and draft a
replacement Contract. Review any existing `design.md` and `plan.md`, then update
them only when the new boundary changes their guidance. Plan delivery again for
the replacement Contract. Do not create a duplicate task.

After the replacement Contract is explicitly approved, clear the recorded
replanning blocker before start:

```bash
opennori task unblock <task> --json
```

If replan is rejected because Outcome Evidence already exists, keep that
Contract and create a separately approved follow-up task for the changed scope.

## Draft The Nori Contract

Each Outcome contains:

- `id`: stable within the task, such as `outcome-user-path`
- `statement`: something a human can observe, use, review, or decide
- `verification`: how evidence can show the outcome
- `required`: whether the Outcome gates completion

Outcomes describe completion, not an implementation checklist. Include
important failure behavior and persistence when they affect the user's result.
Do not accept broad statements such as "CRUD works" or "tests pass" without a
concrete observable outcome.

After writing the draft, make the generated `contract.md` directly openable and
then ask for approval. Keep the response short: provide the file reference and
ask the user to approve it or request a revision.

- On Codex, use a standard Markdown link whose target is the absolute file path,
  for example `[contract.md](/absolute/project/.opennori/tasks/<task>/contract.md)`.
- On Claude Code, print the project-relative
  `.opennori/tasks/<task>/contract.md` path so the terminal can open it.

Do not paste the Contract body into the conversation by default, and do not
replace the file with a summary. Inline the complete Contract verbatim only when
the user asks to see it in chat or the current host cannot open the file.
`contract.md` remains the only human approval surface for the task.

Revise the Contract from feedback and provide the current file reference again.
Record approval only after the user explicitly approves that Contract. Do not
infer approval from silence, prior agreement with the product direction, or
permission to keep working. Contract approval must be its own decision; do not
combine it with a commit, pull request, or delivery-waiver decision.

When approval is explicit:

1. Identify the approver from the current user or a user-provided identity.
2. Capture a stable host confirmation reference when the host exposes one.
3. Run `opennori task contract approve <task> --approver <name>` and add
   `--confirmation <reference>` when available. Use `--note` only for a concise
   user-provided qualification.

The CLI records the approval provenance and approved content hash. It does not
create human consent. Never invent an approver, confirmation reference, or note.

## Contract Input

Write agent input files under ignored `.opennori/.runtime/` or another safe
project-relative path. A Contract input has exactly this shape:

```json
{
  "goal": "Observable user goal",
  "outcomes": [
    {
      "id": "outcome-user-path",
      "statement": "Observable result",
      "verification": "Concrete way to establish the result",
      "required": true
    }
  ],
  "assumptions": []
}
```

Write the Contract first:

```bash
opennori task contract write <task> --input <contract-input> --json
```

Return the host-native file reference and stop for the user's decision. Use
`opennori task contract show <task>` only for the inline fallback described
above. Only after explicit approval of that exact file content, record it:

```bash
opennori task contract approve <task> --approver <name> \
  --confirmation <host-reference> --json
```

Omit `--confirmation` only when the host exposes no stable reference. Use
`opennori task <group> --help` only when the documented command is rejected;
do not inspect OpenNori source or schemas during an ordinary user task.

## Working Markdown

Keep planning knowledge human-readable without creating more approval gates:

- `contract.md` is required and is the only document the user approves.
- Create `design.md` only when implementation has meaningful architecture,
  interface, data, risk, or tradeoff decisions.
- Create `plan.md` only for multi-step, cross-session, or high-risk work. Keep it
  current as implementation and verification progress changes.
- Keep task research under `research/` only when it will help implementation or
  review.

`design.md`, `plan.md`, and research are non-authoritative working documents.
They may evolve without approval, are never parsed into canonical state, and
must not redefine the approved Contract. Small tasks should have only
`contract.md`.

## Plan Delivery

After Contract approval, inspect the live Git worktree before implementation.
OpenNori must be initialized
at the Git worktree root, and project paths outside `.opennori` must have no
pre-existing changes. Commit, stash, or remove those changes before planning the
task delivery boundary; do not absorb them into the later implementation commit.

- Use `--mode commit` when a reviewed local commit is the requested result.
- Use `--mode pull-request --base <branch> [--remote <name>]` when completion
  includes a pull request. Confirm an ambiguous target branch with the user.
- Use `--mode waived` only after explicit human confirmation that repository
  delivery does not apply. Record `--actor`, `--confirmation`, and `--reason`;
  never invent any of them.

Ask for any delivery choice or waiver separately from Contract approval. A
Contract approval never implies a delivery waiver.

```bash
opennori task delivery plan <task> --mode commit --json
opennori task delivery plan <task> --mode pull-request \
  --base <target-branch> --remote origin --json
opennori task delivery plan <task> --mode waived --actor <name> \
  --confirmation <host-reference> --reason <reason> --json
```

The CLI resolves and stores the base commit and checked-out branch. It does not
create branches, commits, pushes, or pull requests during Plan.

## Optional Context Manifests

Create stage-specific context manifests only when they materially reduce later
context loading:

- `implement.jsonl`: specs, source, research, and design needed to implement
- `check.jsonl`: Contract, specs, entry points, and verification references
  needed for verification

Each entry needs a project-relative file and a reason. Do not inject the whole
repository or make both manifests identical by default. Context manifests are
loading hints, not approval or lifecycle authority. Missing, empty, or stale
manifests must not block `task start`; later stages fall back to the Contract,
available working Markdown, Specs, and repository source.

When useful, write either or both through the CLI:

```json
[
  { "file": "project/relative/path", "reason": "Why this stage needs it" }
]
```

```bash
opennori task context write <task> --mode implement \
  --input <implement-context> --json
opennori task context write <task> --mode check \
  --input <check-context> --json
```

## Exit

Enter Implement only when:

- the Contract is explicitly approved
- required questions are resolved or recorded as assumptions
- commit, pull request, or explicit waiver delivery is planned

Then start the task:

```bash
opennori task start <task> --json
```

Tell the user what was approved and that implementation can begin. Do not claim
progress beyond Plan.
