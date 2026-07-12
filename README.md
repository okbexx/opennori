# OpenNori

Repo-native engineering workflow for coding agents, with outcome-driven completion.

Read this in: English | [Simplified Chinese](./README.zh-CN.md)

[![npm version](https://img.shields.io/npm/v/opennori.svg)](https://www.npmjs.com/package/opennori)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](./LICENSE)

OpenNori helps a coding agent carry one goal from an agreed result to a verified
Git delivery. The workflow and durable project knowledge stay with the
repository, so a new conversation can continue without treating chat history as
project truth.

## Start

Install OpenNori once on the current machine, then initialize each project:

```bash
npx opennori setup
cd <project>
opennori init --user <name>
```

Open a new Codex conversation in the project and describe what you need:

```text
Add account deletion with a recoverable confirmation flow.
```

OpenNori is available automatically. Before creating a task, the agent asks
whether this turn should use the OpenNori workflow. Decline for a small change
to handle it directly, or approve task creation to enter Plan. Task creation
does not approve the result boundary or start implementation.

Claude Code is available as an optional second host:

```bash
npx opennori setup --platform claude
opennori init --user <name> --platform claude
```

Open a new Claude Code conversation and describe the goal in the same way.
Setup installs the OpenNori Plugin through the official Claude Code marketplace
commands; initialization writes only the project route and shared OpenNori
state. Session and prompt hooks provide the same automatic task routing and
bounded context as Codex.

To add Claude Code to a project that already uses Codex, keep the Codex adapter
and add the second host through a reviewed lifecycle change:

```bash
npx opennori setup --platform claude
opennori platform add claude --dry-run
opennori platform add claude --confirm
opennori doctor
```

OpenNori then uses the current Codex or Claude Code session while both hosts
share the same project tasks, results, evidence, and delivery state.

## The Workflow

Every goal follows four stages:

1. **Plan**: the agent inspects the project, clarifies the result, shares one
   complete `contract.md` as a directly openable file, and plans the Git
   delivery. You review and approve that Contract before implementation starts.
   For complex work, the agent may also keep an optional `design.md` or
   `plan.md`; neither needs a separate approval.
2. **Implement**: the agent makes the agreed change without claiming the goal is
   complete.
3. **Verify**: on Codex, a fresh check agent reviews the diff and user-visible
   behavior before the primary agent records what actually passed or failed.
   Claude Code performs the same verification sequentially. Either host may use
   an optional separate check-context list when it improves focus.
4. **Finish**: OpenNori refuses completion until the required results and Git
   delivery are verified. Stable project learning and the completed task are
   preserved in the final clean Git state.

Activity, changed files, or agent confidence are never proof of completion.

## What You Can Review

During the workflow, OpenNori gives you four useful views:

- the complete `contract.md`, which is the only task document you approve;
- optional `design.md` and `plan.md` files when the work benefits from a durable
  technical design or execution plan;
- the current stage, remaining gap, and next action;
- verification for each required result and the verified Git delivery;
- the final `report.md` produced during Finish and kept in the repository.

If the requested result changes, tell the agent to return to Plan and revise it.
If a required result remains unproven or delivery is missing, Finish stays blocked.

## Continue Or Recover

In a later conversation, say:

```text
Continue the current OpenNori task.
```

For a direct project health check:

```bash
opennori doctor
opennori status
```

For a safe upgrade, review the plan before applying it:

```bash
opennori update --dry-run
opennori update --confirm
```

Plugin or Skill changes take effect in a new agent conversation.

## Technical Reference

- [Product Reference](docs/product-reference.md): workflow behavior, project
  state, failure handling, and operator commands.
- [Upgrades And Migrations](docs/migrations.md): preview, rollback, and recovery.
- [Public API](docs/api.md): supported programmatic integration surface.

## License

GPL-3.0-only
