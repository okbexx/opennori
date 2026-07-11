---
name: nori-implement
description: Implement an approved OpenNori task. Use when the current task is in Implement/in_progress or the user asks to build the approved Contract. Load curated implementation context, make the smallest coherent change within scope, keep canonical state in the CLI, and hand the actual diff to nori-check without claiming Outcomes are proven or the task is complete.
---

# OpenNori Implement

Implement the approved task without redefining its Outcome boundary.

## Preconditions

1. Run `opennori status --summary --json`.
2. Confirm the task is in Implement and the Contract is approved.
3. Inspect the curated implementation manifest with
   `opennori task context show <task> --mode implement --json`, then load each
   needed entry with `opennori task context load <task> --mode implement
   --file <file> --json`.
4. Stop if a required context file is missing or canonical state is corrupt.
5. Read `opennori task delivery show <task> --json` and keep work on the planned
   branch and base history.

If the Contract is still a draft, load `nori-plan`. If the task is already in
Verify, load `nori-check`.

If the task carries a blocker, do not resume work merely because it is in
Implement. Establish that the recorded condition is resolved, then clear it and
read status again:

```bash
opennori task unblock <task> --json
opennori status --summary --json
```

## Work

- Read the approved Contract before editing.
- Follow project specs and existing repository patterns.
- Keep changes within the task and package boundary.
- Prefer existing libraries and project infrastructure over new machinery.
- Add or update focused checks when the repository's verification model calls
  for them.
- Keep durable research and design in the task directory; promote stable
  project knowledge only through `nori-update-spec`.
- Leave the task's project changes reviewable for `nori-check`. Intermediate
  commits are allowed, but do not record final delivery before independent
  verification succeeds.

Use the CLI for task state and context changes. Do not patch `task.json`,
`contract.json`, or JSONL state directly.

## Host-Native Workers

Read `.opennori/config.yaml` first. Only when the first configured platform is
`codex`, use Codex's native worker tools for independent, bounded work that can
proceed without multiple agents editing the same files. Keep one controlled
writer; use a host worktree when parallel edits require isolation. OpenNori does
not provide a queue or worker runtime.

After a worker starts, bind its host reference to the current task revision and
record only a bounded assignment, Outcome ids, and project paths:

```bash
opennori task coordination assign <task> --worker <host-ref> \
  --role <role> --assignment <summary> --outcomes <ids> --paths <paths> --json
```

`SubagentStart` and `SubagentStop` hooks record start/stop observations when
trusted. After a native message or interruption succeeds, record only its time:

```bash
opennori task coordination message <task> --worker <host-ref> --json
opennori task coordination interrupt <task> --worker <host-ref> --json
```

Do not persist message bodies or transcript paths. A stopped worker, completed
assignment, or worker summary is not Outcome Evidence and never transitions the
Task. Use `coordination list` to spot stale-revision work before integrating it.

On platforms without coordination support, work sequentially and do not call
the `task coordination` commands. Unsupported coordination must not fall back
to Codex state.

## Scope Conflict

When implementation evidence contradicts the Contract or reveals a materially
different user outcome:

1. stop the affected work
2. return the task to Plan with a concrete reason:

   ```bash
   opennori task replan <task> --reason <scope-change> --json
   ```

3. load `nori-plan` for a user-reviewed Contract revision

Replan preserves the previous Contract and both context manifests under task
research and records the reason as a blocker. Plan must approve the replacement
Contract and curate new implement/check context before start. If existing
Outcome Evidence prevents Contract replacement, keep the approved task boundary
and create a follow-up task for the changed scope.

Do not silently widen scope or weaken an Outcome.

## Exit

Run focused engineering checks needed to make the implementation reviewable,
then move the task to Verify before loading `nori-check`:

```bash
opennori task review <task> --json
```

Report:

- what changed
- what remains intentionally out of scope
- any known implementation limitation
- that independent verification is next

Do not record proven Evidence merely because the code was written
or a local check succeeded during implementation. `nori-check` owns that
judgment.
