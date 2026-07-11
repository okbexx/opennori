import fs from "node:fs";
import path from "node:path";
import { loadDelivery, writeDelivery } from "./delivery-state.ts";
import { OpenNoriError } from "./errors.ts";
import { defaultHostCommandRunner, type HostCommandResult, type HostCommandRunner } from "./host-command.ts";
import { nowIso } from "./io.ts";
import { findTask, loadTaskView } from "./task.ts";
import { withTaskLock } from "./task-lock.ts";
import type { DeliveryMode, DeliveryRecord } from "./types.ts";

export type DeliveryPlanInput = {
  mode: DeliveryMode;
  base?: string;
  branch?: string;
  remote?: string;
  actor?: string;
  hostConfirmationRef?: string;
  reason?: string;
};

export type DeliveryRecordInput = {
  commit?: string;
  pullRequestUrl?: string;
};

type PullRequestInspection = {
  url: string;
  headRefOid: string;
  baseRefName: string;
  state: "OPEN" | "CLOSED" | "MERGED";
};

function commandFailure(command: string, args: readonly string[], result: HostCommandResult): OpenNoriError {
  const missing = result.error && "code" in result.error && result.error.code === "ENOENT";
  return new OpenNoriError(
    missing ? "delivery_tool_missing" : "delivery_command_failed",
    missing ? `${command} is required to verify Git delivery.` : `Delivery verification failed: ${command} ${args.join(" ")}`,
    {
      context: {
        command: [command, ...args].join(" "),
        exit_code: result.status,
        stdout: result.stdout.trim(),
        stderr: result.stderr.trim()
      },
      recovery: missing
        ? `Install ${command}, then retry delivery verification.`
        : "Resolve the reported Git delivery problem, then retry without changing the approved Contract."
    }
  );
}

function runRequired(runner: HostCommandRunner, command: string, args: readonly string[], cwd: string): string {
  return runRequiredRaw(runner, command, args, cwd).trim();
}

function runRequiredRaw(runner: HostCommandRunner, command: string, args: readonly string[], cwd: string): string {
  const result = runner(command, args, cwd);
  if (result.error || result.status !== 0) throw commandFailure(command, args, result);
  return result.stdout;
}

function assertRepositoryRoot(root: string, runner: HostCommandRunner): void {
  const topLevel = runRequired(runner, "git", ["rev-parse", "--show-toplevel"], root);
  const actual = fs.realpathSync(path.resolve(topLevel));
  const expected = fs.realpathSync(path.resolve(root));
  if (actual !== expected) {
    throw new OpenNoriError("delivery_repository_mismatch", "OpenNori must be initialized at the Git worktree root to verify delivery.", {
      context: { project_root: expected, git_root: actual },
      recovery: "Run OpenNori from the repository root, or initialize the repository root as the OpenNori project."
    });
  }
}

function safeGitArgument(value: string, label: string): string {
  const normalized = value.trim();
  const hasControlCharacter = [...normalized].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });
  if (!normalized || normalized.startsWith("-") || hasControlCharacter) {
    throw new OpenNoriError("delivery_git_argument_invalid", `${label} is not a safe Git argument.`, {
      context: { label },
      recovery: `Use a named ${label.toLowerCase()} without option prefixes or control characters.`
    });
  }
  return normalized;
}

function resolveCommit(root: string, ref: string, runner: HostCommandRunner): string {
  const safeRef = safeGitArgument(ref, "Git ref");
  return runRequired(runner, "git", ["rev-parse", "--verify", `${safeRef}^{commit}`], root).toLowerCase();
}

function currentBranch(root: string, runner: HostCommandRunner): string {
  const branch = runRequired(runner, "git", ["branch", "--show-current"], root);
  if (!branch) {
    throw new OpenNoriError("delivery_detached_head", "Git delivery requires a named branch, but the worktree is detached.", {
      recovery: "Create or switch to the task branch, then plan delivery again."
    });
  }
  return branch;
}

function workingTreeChanges(root: string, runner: HostCommandRunner): string[] {
  const output = runRequiredRaw(runner, "git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], root);
  const records = output.split("\0").filter(Boolean);
  const paths: string[] = [];
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index] as string;
    const status = record.slice(0, 2);
    const file = record.slice(3);
    if (file) paths.push(file);
    if ((status.includes("R") || status.includes("C")) && index + 1 < records.length) {
      index += 1;
      const source = records[index] as string;
      if (source) paths.push(source);
    }
  }
  return [...new Set(paths)].sort();
}

function nonWorkflowChanges(root: string, runner: HostCommandRunner): string[] {
  return workingTreeChanges(root, runner).filter((file) => file !== ".opennori" && !file.startsWith(".opennori/"));
}

function assertAncestor(root: string, ancestor: string, descendant: string, runner: HostCommandRunner): void {
  const args = ["merge-base", "--is-ancestor", ancestor, descendant] as const;
  const result = runner("git", args, root);
  if (!result.error && result.status === 0) return;
  if (!result.error && result.status === 1) {
    throw new OpenNoriError("delivery_history_mismatch", `Delivery commit ${descendant} does not descend from planned base ${ancestor}.`, {
      recovery: "Use a commit from the planned task branch, or return to Plan and review a new delivery base."
    });
  }
  throw commandFailure("git", args, result);
}

function inspectPullRequest(root: string, url: string, runner: HostCommandRunner): PullRequestInspection {
  const output = runRequired(
    runner,
    "gh",
    ["pr", "view", url, "--json", "url,headRefOid,baseRefName,state"],
    root
  );
  try {
    const value = JSON.parse(output) as PullRequestInspection;
    if (
      typeof value.url !== "string" ||
      typeof value.headRefOid !== "string" ||
      typeof value.baseRefName !== "string" ||
      !["OPEN", "CLOSED", "MERGED"].includes(value.state)
    ) {
      throw new Error("missing required fields");
    }
    return value;
  } catch (error) {
    throw new OpenNoriError("delivery_pr_output_invalid", `GitHub CLI returned invalid pull request data: ${error instanceof Error ? error.message : String(error)}.`, {
      recovery: "Update GitHub CLI and verify that 'gh pr view <url>' succeeds, then retry."
    });
  }
}

/** Plan the task's delivery boundary before implementation. Git commands remain owned by the host tools. */
export function planTaskDelivery(
  root: string,
  taskId: string,
  input: DeliveryPlanInput,
  runner: HostCommandRunner = defaultHostCommandRunner
): DeliveryRecord {
  return withTaskLock(root, taskId, () => {
    const location = findTask(root, taskId);
    if (!location || location.archived) throw new OpenNoriError("task_not_active", `Task ${taskId} is not active.`);
    if (location.task.status === "completed") throw new OpenNoriError("task_completed", `Task ${taskId} is already completed.`);
    const existing = loadDelivery(location.directory, taskId);
    const timestamp = nowIso();
    if (input.mode === "waived") {
      const actor = input.actor?.trim() ?? "";
      const confirmation = input.hostConfirmationRef?.trim() ?? "";
      const reason = input.reason?.trim() ?? "";
      if (!actor || !confirmation || !reason) {
        throw new OpenNoriError("delivery_waiver_incomplete", "A delivery waiver needs an actor, host confirmation reference, and concrete reason.", {
          recovery: "Obtain explicit human confirmation, then provide --actor, --confirmation, and --reason."
        });
      }
      return writeDelivery(location.directory, {
        schema_version: "opennori/delivery-v1",
        task_id: taskId,
        mode: "waived",
        status: "waived",
        base_branch: null,
        base_commit: null,
        branch: null,
        commit: null,
        remote: null,
        pull_request_url: null,
        implementation_revision: location.task.implementation_revision,
        waiver: { actor, host_confirmation_ref: confirmation, reason },
        created_at: existing?.created_at ?? timestamp,
        updated_at: timestamp
      });
    }

    assertRepositoryRoot(root, runner);
    const checkedOutBranch = currentBranch(root, runner);
    const initialHead = resolveCommit(root, "HEAD", runner);
    const dirty = nonWorkflowChanges(root, runner);
    if (dirty.length > 0) {
      throw new OpenNoriError("delivery_plan_dirty", "Git delivery must start from a clean project worktree.", {
        context: { paths: dirty },
        recovery: "Commit, stash, or remove existing project changes before planning this task's delivery boundary."
      });
    }
    const branch = safeGitArgument(input.branch?.trim() || checkedOutBranch, "Task branch");
    if (branch !== checkedOutBranch) {
      throw new OpenNoriError("delivery_branch_mismatch", `Planned branch ${branch} is not checked out (${checkedOutBranch}).`, {
        recovery: "Switch to the task branch, then plan delivery again."
      });
    }
    if (input.mode === "pull_request" && !input.base?.trim()) {
      throw new OpenNoriError("delivery_base_required", "Pull request delivery needs an explicit base branch.", {
        recovery: "Pass --base <branch> after confirming the intended merge target."
      });
    }
    const baseBranch = safeGitArgument(input.base?.trim() || checkedOutBranch, "Base branch");
    const baseCommit = resolveCommit(root, input.base?.trim() || "HEAD", runner);
    const remote = input.mode === "pull_request" ? safeGitArgument(input.remote?.trim() || "origin", "Git remote") : null;
    if (remote) runRequired(runner, "git", ["remote", "get-url", remote], root);
    if (currentBranch(root, runner) !== checkedOutBranch || resolveCommit(root, "HEAD", runner) !== initialHead || nonWorkflowChanges(root, runner).length > 0) {
      throw new OpenNoriError("delivery_repository_changed", "The repository changed while delivery was being planned.", {
        recovery: "Stop concurrent Git writes and plan delivery again from a clean, stable task branch."
      });
    }
    return writeDelivery(location.directory, {
      schema_version: "opennori/delivery-v1",
      task_id: taskId,
      mode: input.mode,
      status: "planned",
      base_branch: baseBranch,
      base_commit: baseCommit,
      branch,
      commit: null,
      remote,
      pull_request_url: null,
      implementation_revision: null,
      waiver: null,
      created_at: existing?.created_at ?? timestamp,
      updated_at: timestamp
    });
  });
}

/** Verify an existing commit or pull request and bind it to the current implementation revision. */
export function recordTaskDelivery(
  root: string,
  taskId: string,
  input: DeliveryRecordInput,
  runner: HostCommandRunner = defaultHostCommandRunner
): DeliveryRecord {
  return withTaskLock(root, taskId, () => {
    const location = findTask(root, taskId);
    if (!location || location.archived) throw new OpenNoriError("task_not_active", `Task ${taskId} is not active.`);
    if (location.task.status !== "review") {
      throw new OpenNoriError("delivery_not_allowed", `Task ${taskId} must be in Verify before delivery can be recorded.`);
    }
    const view = loadTaskView(root, taskId);
    if (!view.complete) {
      throw new OpenNoriError("delivery_outcomes_incomplete", "Git delivery cannot be recorded before required Outcomes are proven or waived.", {
        recovery: "Complete independent verification and record current-revision Evidence first."
      });
    }
    const planned = loadDelivery(location.directory, taskId);
    if (!planned || planned.mode === "waived" || planned.status !== "planned") {
      throw new OpenNoriError("delivery_plan_required", "Record a current Git delivery plan before verifying its result.");
    }
    assertRepositoryRoot(root, runner);
    const branch = currentBranch(root, runner);
    if (branch !== planned.branch) {
      throw new OpenNoriError("delivery_branch_mismatch", `Delivery is planned for ${planned.branch}, but ${branch} is checked out.`);
    }
    const commit = resolveCommit(root, input.commit?.trim() || "HEAD", runner);
    if (commit === planned.base_commit) {
      throw new OpenNoriError("delivery_commit_empty", "The delivery commit is still the planned base commit.", {
        recovery: "Commit the verified task changes, then record delivery again."
      });
    }
    assertAncestor(root, planned.base_commit as string, commit, runner);
    const head = resolveCommit(root, "HEAD", runner);
    if (commit !== head) {
      throw new OpenNoriError("delivery_commit_not_head", "The recorded delivery commit must be the current task branch HEAD.", {
        context: { commit, head },
        recovery: "Check out the delivered task branch at its verified head, then record delivery again."
      });
    }
    const dirty = nonWorkflowChanges(root, runner);
    if (dirty.length > 0) {
      throw new OpenNoriError("delivery_changes_uncommitted", "Project changes remain outside the recorded delivery commit.", {
        context: { paths: dirty },
        recovery: "Commit the task's project changes or remove unrelated work from this worktree, then record delivery again."
      });
    }

    let pullRequestUrl: string | null = null;
    if (planned.mode === "pull_request") {
      const requestedUrl = input.pullRequestUrl?.trim() ?? "";
      if (!requestedUrl) {
        throw new OpenNoriError("delivery_pr_required", "Pull request delivery needs the created pull request URL.", {
          recovery: "Create the pull request with GitHub CLI, then pass --pr <https-url>."
        });
      }
      const pullRequest = inspectPullRequest(root, requestedUrl, runner);
      if (pullRequest.url !== requestedUrl || pullRequest.headRefOid.toLowerCase() !== commit) {
        throw new OpenNoriError("delivery_pr_commit_mismatch", "The pull request head does not match the recorded delivery commit.", {
          context: { requested_url: requestedUrl, actual_url: pullRequest.url, expected_commit: commit, actual_commit: pullRequest.headRefOid }
        });
      }
      if (pullRequest.baseRefName !== planned.base_branch || pullRequest.state === "CLOSED") {
        throw new OpenNoriError("delivery_pr_invalid", "The pull request is closed without merge or targets a different base branch.", {
          context: { state: pullRequest.state, expected_base: planned.base_branch, actual_base: pullRequest.baseRefName }
        });
      }
      pullRequestUrl = pullRequest.url;
    }

    if (resolveCommit(root, "HEAD", runner) !== head || nonWorkflowChanges(root, runner).length > 0) {
      throw new OpenNoriError("delivery_repository_changed", "The repository changed while delivery was being verified.", {
        recovery: "Stop concurrent Git writes and retry delivery verification from the stable task branch HEAD."
      });
    }

    const timestamp = nowIso();
    return writeDelivery(location.directory, {
      ...planned,
      status: "recorded",
      commit,
      pull_request_url: pullRequestUrl,
      implementation_revision: location.task.implementation_revision,
      updated_at: timestamp
    });
  });
}

export type FinalizedDelivery = {
  task_id: string;
  title: string;
  mode: "commit" | "pull_request";
  implementation_commit: string;
  final_commit: string;
  pull_request_url: string | null;
};

/** Prove that archived workflow state and the delivered implementation share one clean final Git checkpoint. */
export function finalizeTaskDelivery(
  root: string,
  taskId: string,
  runner: HostCommandRunner = defaultHostCommandRunner
): FinalizedDelivery {
  const location = findTask(root, taskId);
  if (!location?.archived || location.task.status !== "completed") {
    throw new OpenNoriError("delivery_archive_required", `Task ${taskId} must be completed and archived before final delivery verification.`);
  }
  const delivery = loadDelivery(location.directory, taskId);
  if (!delivery || delivery.mode === "waived" || delivery.status !== "recorded" || !delivery.commit) {
    throw new OpenNoriError("delivery_record_required", `Task ${taskId} has no Git delivery to finalize.`);
  }
  assertRepositoryRoot(root, runner);
  const dirty = workingTreeChanges(root, runner);
  if (dirty.length > 0) {
    throw new OpenNoriError("delivery_checkpoint_dirty", "The final OpenNori checkpoint is not committed.", {
      context: { paths: dirty },
      recovery: "Commit the archived task, delivery record, promoted Specs, and developer journal, then retry final delivery verification."
    });
  }
  const finalCommit = resolveCommit(root, "HEAD", runner);
  assertAncestor(root, delivery.commit, finalCommit, runner);
  const archivedTaskPath = `${path.relative(root, location.directory).split(path.sep).join("/")}/task.json`;
  runRequired(runner, "git", ["cat-file", "-e", `${finalCommit}:${archivedTaskPath}`], root);

  if (delivery.mode === "pull_request") {
    const pullRequest = inspectPullRequest(root, delivery.pull_request_url as string, runner);
    if (
      pullRequest.url !== delivery.pull_request_url ||
      pullRequest.headRefOid.toLowerCase() !== finalCommit ||
      pullRequest.baseRefName !== delivery.base_branch ||
      pullRequest.state === "CLOSED"
    ) {
      throw new OpenNoriError("delivery_pr_final_mismatch", "The pull request does not contain the clean final OpenNori checkpoint.", {
        context: {
          url: pullRequest.url,
          state: pullRequest.state,
          expected_head: finalCommit,
          actual_head: pullRequest.headRefOid,
          expected_base: delivery.base_branch,
          actual_base: pullRequest.baseRefName
        },
        recovery: "Push the final checkpoint to the pull request branch, then retry final delivery verification."
      });
    }
  }

  if (resolveCommit(root, "HEAD", runner) !== finalCommit || workingTreeChanges(root, runner).length > 0) {
    throw new OpenNoriError("delivery_checkpoint_changed", "The repository changed while the final checkpoint was being verified.", {
      recovery: "Stop concurrent Git writes and retry final delivery verification from a clean worktree."
    });
  }

  return {
    task_id: taskId,
    title: location.task.title,
    mode: delivery.mode,
    implementation_commit: delivery.commit,
    final_commit: finalCommit,
    pull_request_url: delivery.pull_request_url
  };
}
