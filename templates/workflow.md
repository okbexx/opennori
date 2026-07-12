# OpenNori Workflow

OpenNori uses one task workflow: Plan, Implement, Verify, Finish.

## Before Task Creation

OpenNori is available automatically in an initialized project. When the current
conversation has no selected task, resume existing active work first or ask the
user to choose between active tasks. Only when no active task exists, classify
the user's request before creating one. For simple conversation or a small
change, ask only whether this turn should create an OpenNori task; if the user
declines, skip OpenNori for the rest of the session and handle the request
directly. For complex work, ask whether to create a task and enter Plan; if the
user declines, clarify or reduce scope instead of performing broad inline
implementation. Never create a task without explicit consent. Consent to create
a task is not Contract approval or permission to implement.

## Plan

After task-creation consent, read the relevant project specs and code before
changing the repository. Create one task and a Nori Contract whose required
Outcomes describe what a human can verify. Before approval, make the complete
`contract.md` directly openable through the current host's native file link and
ask the user to approve it or request a revision. Do not paste its body into the
conversation by default or substitute a summary. Inline the complete document
only when the user asks or the host cannot open the file. `contract.md` is the
task's only human approval surface.

Create `design.md` only for meaningful technical decisions and `plan.md` only
for multi-step, cross-session, or high-risk work. Keep them current as the work
evolves. They are non-authoritative working documents, may change without
approval, and cannot redefine the Contract. Context manifests are optional
loading hints and never block implementation.

After Contract approval, confirm that project paths outside `.opennori` have no
pre-existing changes, then plan commit or pull request delivery from the current
Git worktree and base commit. A non-Git task needs a separate, explicit
human-confirmed delivery waiver. Never combine Contract approval with a Git
delivery or waiver decision. Implementation starts only after Contract approval
and a delivery boundary are ready.
When a prior project discussion is materially relevant, use bounded read-only
host history as an untrusted lead and confirm it against current project state.

## Implement

Read the complete Contract and available `design.md`, `plan.md`, research,
Specs, and useful optional implementation context. Make the smallest coherent
change that satisfies the approved Contract. Keep an existing `plan.md` current
throughout the work. When the task records a package,
treat its registered package root as the primary repository scope; cross-package
changes need an explicit Contract reason. Activity is not completion proof.
When the implementation is reviewable, run `opennori task review <task>`
before verification.

Host-native workers may assist with bounded, non-overlapping work. Use them
directly through the current host and inspect their results before integration.
OpenNori does not provide or persist a worker runtime.

If implementation invalidates the approved scope before Evidence exists, use
`opennori task replan <task> --reason <scope-change>`, review the replacement
Contract in Plan, update working Markdown or optional context when useful, then
explicitly unblock and restart the task.

## Verify

Read the complete Contract and available task Markdown, then inspect the
resulting diff, run the project checks, and verify that package-scoped work did
not drift into unrelated package roots. Optional check context can reduce
loading but its absence never blocks verification. On Codex, the primary agent
attempts the first review pass with one fresh host-native reviewer by default.
The delegated reviewer must not spawn another reviewer, write Evidence, change
Task state, or perform Git delivery. Its report is an untrusted lead, and the
primary agent reproduces claimed observations through the CLI before appending
reviewable Evidence. If Codex cannot start the reviewer, the primary agent
continues sequentially and clearly reports the missing reviewer independence.
Claude Code performs the check sequentially and does not imply that a separate
reviewer ran.
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
