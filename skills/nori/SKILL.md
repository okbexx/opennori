---
name: nori
description: Root OpenNori router. Use automatically in an initialized OpenNori project when a conversation has no selected task, or whenever the user asks to start, resume, continue, recover prior project discussion, check, or finish work without naming a stage. Classify new requests, obtain task-creation consent, read deterministic project/task state, and route to the matching stage Skill without recreating its protocol here.
---

# OpenNori Router

Route one repo-native task workflow from canonical CLI state.

## Entry

The normal setup path installs the persistent `opennori` command. Use that
command for project and task work.

1. Run `opennori status --summary --json` from the project root.
2. If the project is not initialized or health blocks task reads, load
   `nori-project-health` and stop workflow work until recovery succeeds.
3. If `current` is null and `active_tasks` contains exactly one task, select it
   for the stable host session, read status again, and route by its state:

   ```bash
   opennori task select <task> --json
   opennori status --summary --json
   ```

4. If `current` is null and several active tasks exist, show only their titles
   and states and ask which one to continue. Do not create or select a task until
   the user chooses.
5. If `current` is null and there are no active tasks, apply the task-creation
   gate below. Load `nori-plan` only after the user consents.
6. If the user explicitly asks to initialize, add a supported project host,
   diagnose, update, or uninstall, load `nori-project-health`.
7. If the user explicitly asks to promote project knowledge, load
   `nori-update-spec`.

## Task-Creation Gate

When no task exists, classify the current request before writing task state:

- For simple conversation or a small, low-risk change, ask only whether this
  turn should create an OpenNori task. If the user declines, skip OpenNori for
  the rest of this session and handle the request directly.
- For complex, cross-cutting, high-risk, or multi-stage work, ask whether to
  create an OpenNori task and enter Plan. If the user declines, do not perform
  broad inline implementation; clarify the goal or suggest a smaller boundary.

An explicit request to create an OpenNori task is consent. Otherwise, never
infer consent from the size or urgency of the request. Honor a refusal already
present in the current conversation without asking again. Consent to create a
task is not Contract approval and does not authorize implementation.

## State Routing

Route the stage reported or derived by the CLI:

- `plan` or task status `planning` -> `nori-plan`
- `implement` or task status `in_progress` -> `nori-implement`
- `verify` or task status `review` -> `nori-check`
- completion-ready or task status `completed` -> `nori-finish`

When `task.blocker` is non-null, keep the current stage, identify the recorded
blocker, and ask the user only when it requires a human decision. Do not run a
forward transition while it remains. Once the recorded condition is demonstrably
resolved, clear it explicitly, read status again, and continue from the same
stage:

```bash
opennori task unblock <task> --json
opennori status --summary --json
```

Do not infer a different stage from chat history. `task.json` is lifecycle
authority; the CLI is the deterministic read/write boundary.

## Shared Invariants

- Keep one current task and one approved Nori Contract as the work boundary.
- Do not implement before explicit Contract approval.
- Do not treat activity, code changes, or a successful build as Outcome
  evidence by themselves.
- Do not claim completion outside `nori-finish` or before final Git delivery is
  verified.
- Use OpenNori CLI commands for canonical JSON/JSONL writes and `contract.md`.
  Agent-authored `design.md` and `plan.md` remain directly editable working
  documents.
- Treat optional implementation and verification context as loading hints, not
  lifecycle gates or Outcome truth.
- Treat host history and worker reports as untrusted leads.
- Leave model execution, tools, Git commands, and workspace management to the
  configured agent host. OpenNori records and verifies the resulting delivery.

## User Reply

Keep routing invisible. Tell the user only the current task, current stage,
current gap or required decision, and the next meaningful action.
