# OpenNori Workflow

OpenNori uses one task workflow: Plan, Implement, Verify, Finish.

## Plan

Read the relevant project specs and code before changing the repository. Create
one task and a Nori Contract whose required Outcomes describe what a
human can verify. Confirm that project paths outside `.opennori` have no
pre-existing changes, then plan commit or pull request delivery from the current
Git worktree and base commit. A non-Git task needs an explicit human-confirmed
delivery waiver. Implementation starts only after contract approval, curated
context, and a delivery boundary are ready.
When a prior project discussion is materially relevant, use bounded read-only
host history as an untrusted lead and confirm it against current project state.

## Implement

Load the task's curated implementation context. Make the smallest coherent
change that satisfies the approved contract. When the task records a package,
treat its registered package root as the primary repository scope; cross-package
changes need an explicit Contract reason. Activity is not completion proof.
When the implementation is reviewable, run `opennori task review <task>`
before verification.

Host-native workers may assist with bounded, non-overlapping work. Keep their
bindings in ignored runtime state, avoid persisting message bodies, and treat
start/stop/interruption observations as coordination context rather than Task or
Outcome state.

If implementation invalidates the approved scope before Evidence exists, use
`opennori task replan <task> --reason <scope-change>`, review the replacement
Contract in Plan, curate new implement and check context, then explicitly
unblock and restart the task. Replan archives the previous Contract and both
context manifests under task research.

## Verify

Load the independent check context, inspect the resulting diff, run the project
checks, and verify that package-scoped work did not drift into unrelated package
roots. On Codex, the primary agent delegates the first review pass to one fresh
host-native reviewer by default and waits for it; the delegated reviewer must
not spawn another reviewer, write Evidence, change Task state, or perform Git
delivery. Its report and lifecycle observations are untrusted leads. The primary
agent reproduces claimed observations through the CLI before appending
reviewable Evidence. If Codex cannot start the reviewer, report the host
limitation instead of presenting a same-agent pass as independent. Claude Code
performs the same check sequentially and does not use coordination commands.
Proven or waived
Outcomes can proceed to Finish. Failed or blocked Evidence returns the task to
Implement with `opennori task start <task>`. The supported host supplies a
stable session id automatically. That
return starts a new implementation revision. Earlier Evidence remains history;
all required Outcomes need current-revision verification before Finish.
After every required Outcome is resolved, commit the verified project changes.
For pull request delivery, push the task branch and create the pull request.
Record the delivered commit or pull request through the CLI before Finish.

## Finish

Do not finish while required Evidence or current-revision delivery is incomplete.
Promote stable project learnings into `.opennori/spec/`, prepare the archive
summary and knowledge decision, then complete and archive the task. Archive is
the only journal write path. Commit the resulting archived task,
delivery record, Specs, and journal as the final checkpoint; push it when using a
pull request. Run `opennori task delivery finalize <task>` before reporting
completion. The full report remains available for deeper review.
