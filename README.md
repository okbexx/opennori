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

Open a new Codex conversation in the project and say:

```text
Use OpenNori for this goal: <goal>
```

That is the normal path. You keep describing the product result in natural
language; OpenNori guides the agent and prevents an unsupported completion
claim.

Claude Code is available as an optional second host:

```bash
npx opennori setup --platform claude
opennori init --user <name> --platform claude
```

Open a new Claude Code conversation and use the same goal prompt.

## The Workflow

Every goal follows four stages:

1. **Plan**: the agent inspects the project, clarifies the result, proposes
   reviewable Outcomes, and plans the Git delivery. You approve the result
   boundary before implementation starts.
2. **Implement**: the agent makes the agreed change without claiming the goal is
   complete.
3. **Verify**: the agent independently checks the diff, project checks, and
   user-visible behavior, then records what actually passed or failed.
4. **Finish**: OpenNori refuses completion until the required results and Git
   delivery are verified. Stable project learning and the completed task are
   preserved in the final clean Git state.

Activity, changed files, or agent confidence are never proof of completion.

## What You Can Review

During the workflow, OpenNori gives you four useful views:

- the proposed result boundary before implementation;
- the current stage, remaining gap, and next action;
- verification for each required result and the verified Git delivery;
- a final human-readable report that remains in the repository.

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
