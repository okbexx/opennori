---
name: nori-finish
description: Finish an OpenNori task. Use when verification and delivery are complete, the user asks whether the goal is done, or a completed task must be archived and checkpointed. Recompute Outcomes and current-revision delivery, preserve stable learning, let archive write the single developer journal entry, commit the final repo-native state, verify the clean final Git checkpoint and pull request head, then return a concise evidence-based report.
---

# OpenNori Finish

Close a task only from Outcome Evidence, then preserve the knowledge future
work needs.

## Completion Gate

1. Run `opennori status --summary --json`; do not trust a cached status from the
   conversation.
2. Read `opennori task show <task> --json` and confirm the Contract is approved.
3. Recompute every required Outcome from append-only Evidence bound to the
   current implementation revision.
4. Refuse completion if any required Outcome is unproven, failed, or blocked.
5. Refuse completion if required Git delivery is missing or belongs to an older
   implementation revision.

Host worker activity does not participate in this gate. Never use a worker
report to prove an Outcome or infer task completion.

When blocked, name the current Outcome, latest Evidence, required decision or
action, and route to `nori-check`, `nori-implement`, or the user. Do not mark the
task completed first and repair evidence later.

## Preserve Learning

Before archive:

1. Load `nori-update-spec` for stable, reusable project learning.
2. Keep temporary debugging details and task chronology out of project specs.
3. Prepare one durable archive summary covering the outcome, important choices,
   remaining limitations, and useful next leads. Do not edit the journal
   directly; `task archive` is its only write path.

If the task produced no reusable project knowledge, leave specs unchanged and
explain why through `--knowledge-summary` rather than inventing a spec update.

## Complete, Archive, And Checkpoint

Use the CLI to:

- mark the task completed
- set its completion timestamp
- archive it under the appropriate month for organization
- render the final human-readable report
- verify the archived state is present in a clean final Git checkpoint

Complete the verified task first, then archive it with an explicit knowledge
decision:

```bash
opennori task finish <task> --json
opennori task archive <task> --summary <outcome> \
  --knowledge <promoted|none> --knowledge-summary <decision> --json
```

`promoted` means the relevant specs were updated before archive. `none` means
the archive knowledge summary explains why this task produced no reusable
project knowledge. The archive command writes exactly one developer journal
entry from these arguments.
Successful archive output already contains the compact completion projection.
It is not permission to tell the user the goal is complete until the final Git
checkpoint is verified.

Archiving is organization, not a second state transition. Canonical task state
remains `completed`.

For commit or pull request delivery, stage the archived task, `delivery.json`,
report, promoted Specs, and developer journal. Create one final metadata
checkpoint without rewriting the implementation commit. Push that checkpoint
to the existing pull request branch when applicable, then run:

```bash
opennori task delivery finalize <task> --json
```

Finalization is read-only. It requires a clean worktree, proves that HEAD
contains the archived task, proves that the implementation commit is an
ancestor, and in pull request mode confirms that the remote head and base still
match. If it fails, resolve the reported Git condition and retry; do not alter
canonical completion state by hand. An explicitly waived delivery skips this
Git checkpoint.

## User Reply

Report:

- the delivered outcome and final Git checkpoint or explicit waiver
- each required Outcome and its latest proven or waived Evidence
- checks performed
- specs or journal updated
- remaining limitations or waivers

Do not expose internal hashes, runtime pointers, or manifest details unless
recovery requires them. A user-visible commit id or pull request URL is delivery
information, not an internal hash. Do not merge the pull request or start another
task without a separate user request.
