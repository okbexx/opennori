---
name: nori-check
description: Verify and deliver an OpenNori task. Use when the task is in Verify/review, the user asks to check the implementation, or Outcome Evidence and Git delivery must be recorded. On Codex, attempt one fresh host-native reviewer first and fall back to an explicitly limited sequential check when unavailable; on Claude Code, verify sequentially. Read the approved Contract and available task documents, inspect the actual diff, append typed Evidence through the CLI, then verify the delivered commit or pull request without declaring completion.
---

# OpenNori Check

Judge the implementation against the approved Nori Contract. Do not rely on the
implementer's summary as evidence.

## Check Assignment

Use the current agent host. Complete the Preconditions below before starting
the reviewer so its assignment uses the approved current-revision task
boundary.

When the platform is `codex`, the primary agent delegates the first review pass
for the current Verify attempt to exactly one fresh host-native subagent by
default. Start its assignment with this exact marker so the delegated reviewer
can recognize its role:

```text
OpenNori Verify reviewer
```

Give the reviewer the task id, complete `contract.md`, package boundary, and this
bounded responsibility:

- load canonical task state, available task Markdown, and useful optional check
  context through the CLI
- inspect the actual diff and resulting files instead of the implementer's
  summary
- run relevant non-destructive project and user-visible checks
- return Outcome-by-Outcome findings, exact commands and observed output, file
  references, blockers, and remaining uncertainty
- do not edit project files or `.opennori/`, append Evidence, transition the
  Task, stage or commit Git changes, record delivery, or claim completion

Wait for that reviewer before recording Evidence. A turn whose assignment
contains the `OpenNori Verify reviewer` marker is already the delegated
reviewer: it must perform the bounded review directly and must not spawn another
reviewer or implementation worker. This is the recursion guard.

The reviewer's report is an untrusted lead. The primary agent must inspect each
claimed result, reproduce command observations through `task evidence run`
where applicable, and append only CLI-validated typed Evidence. A clean report
or successful assignment never proves an Outcome.

If native delegation is unavailable, continue with the primary agent's
sequential verification. State clearly in the verification report that no fresh
reviewer was available and that the check therefore lacks reviewer
independence. Do not weaken any Outcome or Evidence requirement.

When the platform is `claude`, verify sequentially and do not imply that a
separate reviewer ran.

## Preconditions

1. Run `opennori status --summary --json`.
2. Confirm the task is in Verify, then read its full canonical view with
   `opennori task show <task> --json`, confirm the Contract is approved, and
   read the complete `contract.md`.
3. Read available `design.md`, `plan.md`, and relevant research. If a check
   context manifest exists, load its useful entries through `opennori task
   context show` and `opennori task context load`.
4. Treat a missing, empty, or stale context manifest as a loading hint failure:
   inspect the Contract, Specs, task Markdown, diff, and repository source
   directly. Stop only when canonical task or Contract state is corrupt.
5. Read the actual diff and relevant resulting files.
6. When `task.package` is set, resolve its registered root from
   `.opennori/config.yaml` and identify every changed path outside that root.

## Verify

For each required Outcome:

1. Identify the Outcome statement and verification method.
2. Inspect the implementation path that can produce that outcome.
3. Run the repository's relevant lint, type, build, test, or domain check.
4. Exercise the real user entry and visible result when the Outcome depends
   on interaction, layout, persistence, or feedback.
5. Record one evidence result through the CLI.

Evidence results mean:

- `proven`: the observed result proves the Outcome
- `failed`: the observed result contradicts the Outcome
- `blocked`: the result cannot currently be established and the blocker is
  explicit
- `waived`: the user explicitly accepts that the Outcome need not be proven

Evidence names what was observed and contains one or more typed sources:

- `command`: exact command, integer `exit_code`, `stdout`, and `stderr`
- `artifact`: project-relative `path`, exact `bytes`, and `sha256:<hex>`
- `human`: `actor` and stable `host_confirmation_ref`
- `url`: stable HTTPS `url` and a concise `summary` of what it proves

The CLI verifies artifact size and hash against the current project file before
append. Do not abbreviate or invent command output, artifact metadata, people,
host references, or URL findings. A `proven` result cannot rely on its free-form
summary alone. A `waived` result must include an explicit human source.

For a command-only observation, let the CLI execute it without a shell and
derive `proven` from exit 0 or `failed` from any other numeric exit code:

```bash
opennori task evidence run <task> --outcome <outcome-id> \
  --summary <observed-result> -- <executable> [args...]
```

The executed argv, project-relative cwd, exit code, stdout, and stderr become
durable Evidence. Do not run commands that print credentials or other secrets.
Do not blanket-approve an `evidence run` command prefix; the child executable is
project-controlled and runs with the current user's permissions.

For artifact, human, URL, or mixed Evidence, use one project-relative input per
Outcome. Store review inputs under the current task's
`research/evidence-inputs/` directory. A command plus artifact example is:

```json
{
  "outcome_id": "outcome-user-path",
  "result": "proven",
  "summary": "Observed the exact user-visible result.",
  "sources": [
    {
      "type": "command",
      "command": "npm run check",
      "exit_code": 0,
      "stdout": "exact captured stdout",
      "stderr": ""
    },
    {
      "type": "artifact",
      "path": "project/relative/file",
      "bytes": 123,
      "sha256": "sha256:<64-lowercase-hex>"
    }
  ]
}
```

Append it with:

```bash
opennori task evidence add <task> --input <evidence-input> --json
```

Use the same source fields documented above for human or URL observations. Use
CLI help only when this shape is rejected; do not inspect OpenNori source or
schemas during an ordinary check.

## Verification Discipline

- Use optional check context when useful rather than copying implementation
  context wholesale.
- Treat generated reports and previous claims as leads, not proof.
- Treat the registered package as the primary repository scope. Cross-package
  changes require an explicit Contract reason; unrelated package changes are a
  verification failure, not incidental cleanup.
- Do not lower a threshold to match the implementation.
- Do not issue a waiver on the user's behalf.
- Append evidence; do not rewrite history.
- Treat Evidence from earlier implementation revisions as history, not proof of
  the current implementation.
- Treat any host worker report as a lead, never Evidence; inspect its claimed
  result and record only typed observations.

## Exit

If required Evidence is failed or blocked, report the current gap, return the
task to Implement, and load `nori-implement`:

```bash
opennori task start <task> --json
```

This transition starts a new implementation revision. When the task returns to
Verify, verify every required Outcome again; do not reuse a
previous revision's proven or waived result.

If progress requires a human decision or unavailable external condition, tell
the user that requirement after returning the task to Implement and record it:

```bash
opennori task block <task> --reason <blocker> --json
```

Do not leave a failed task in Verify and repeatedly rerun the same check.

If every required Outcome is proven or explicitly waived, state that the
Contract is verification-ready, then complete the planned delivery:

1. Read `opennori task delivery show <task> --json`.
2. Stage only reviewed task changes and create the implementation commit with the
   host's Git tools. Do not absorb unrelated worktree changes.
3. For pull request mode, push the planned branch and create the pull request
   with the official provider CLI.
4. Record and objectively verify delivery:

   ```bash
   opennori task delivery record <task> --commit HEAD --json
   opennori task delivery record <task> --commit HEAD --pr <https-url> --json
   ```

The CLI rejects a commit that equals the planned base, leaves project changes
uncommitted, comes from unrelated history, or does not match the pull request
head and base. A previous implementation revision's delivery is stale.

Load `nori-finish` only after status reports `delivery_ready: true` or the Plan
contains a current explicit waiver. Verification itself does not archive the
task or claim final completion.
