---
name: nori-implement
description: Implement an approved OpenNori task. Use when the current task is in Implement/in_progress or the user asks to build the approved Contract. Read the Contract and available human-readable task documents, make the smallest coherent change within scope, keep an existing execution plan current, and hand the actual diff to nori-check without claiming Outcomes are proven or the task is complete.
---

# OpenNori Implement

Implement the approved task without redefining its Outcome boundary.

## Preconditions

1. Run `opennori status --summary --json`.
2. Confirm the task is in Implement and the Contract is approved, then read the
   complete `contract.md`.
3. Read available `design.md`, `plan.md`, and relevant task research. If an
   implement context manifest exists, load the useful entries through
   `opennori task context show` and `opennori task context load`.
4. Treat a missing, empty, or stale context manifest as a loading hint failure:
   inspect the Contract, Specs, working Markdown, and repository source instead.
   Stop only when canonical task or Contract state is corrupt.
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
- Keep an existing `plan.md` current as steps, discoveries, checks, and remaining
  work change. Create one only when the work becomes multi-step, cross-session,
  or high-risk.
- Update `design.md` when a meaningful implementation decision changes. Neither
  document may redefine the approved Contract.
- Keep durable research and design in the task directory; promote stable
  project knowledge only through `nori-update-spec`.
- Leave the task's project changes reviewable for `nori-check`. Intermediate
  commits are allowed, but do not record final delivery before Outcome
  verification succeeds.

Use the CLI for canonical task state changes. Do not patch `task.json`,
`contract.json`, or JSONL state directly.

## Host-Native Workers

Use the current host's native workers for bounded, independent work when they
help. Keep one controlled writer or use host-native worktree isolation, then
inspect results before integration. OpenNori does not provide a worker runtime
or record worker activity. Work sequentially when the host has no parallel
worker capability.

## Scope Conflict

When implementation evidence contradicts the Contract or reveals a materially
different user outcome:

1. stop the affected work
2. return the task to Plan with a concrete reason:

   ```bash
   opennori task replan <task> --reason <scope-change> --json
   ```

3. load `nori-plan` for a user-reviewed Contract revision

Replan preserves the previous Contract under task research and records the
reason as a blocker. Plan must approve the replacement Contract before start
and may update working Markdown or optional context manifests. If existing
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
- that Outcome verification is next

Do not record proven Evidence merely because the code was written
or a local check succeeded during implementation. `nori-check` owns that
judgment.
