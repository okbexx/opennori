import path from "node:path";
import { defineCommand } from "citty";
import { retryStateBusy, runCliAction, renderPlan } from "./cli-output.ts";
import { loadContextBundle, loadContextFiles, writeContextManifest } from "./context.ts";
import {
  assignCoordinationWorker,
  coordinationWorkerLabel,
  listCoordinationBindings,
  recordCoordinationContact,
  recordCoordinationInterruption
} from "./coordination.ts";
import { approveContract, loadContract, writeContractDraft } from "./contract.ts";
import { loadDelivery } from "./delivery-state.ts";
import { finalizeTaskDelivery, planTaskDelivery, recordTaskDelivery } from "./delivery.ts";
import { doctorProject } from "./doctor.ts";
import { asOpenNoriError, OpenNoriError } from "./errors.ts";
import { appendEvidence, type EvidenceInput, runCommandEvidence } from "./evidence.ts";
import { readJson, safeProjectPath } from "./io.ts";
import { applyLifecyclePlan, planInit, repairProjectManifest, uninstallProject, updateProject } from "./lifecycle.ts";
import { PLATFORM_IDS, platformSessionMemory, requirePlatformCoordination } from "./platform.ts";
import {
  createProjectConfig,
  currentProductVersion,
  developerSlug,
  projectAssets,
  readProjectConfig,
  requireCurrentStateSchema
} from "./project.ts";
import {
  appendJournalEntry,
  buildCompletionSummary,
  renderCompletionSummary,
  validateJournalEntry,
  writeTaskReport
} from "./report.ts";
import { inspectGlobalCli, inspectPlatformHost, setupHost } from "./setup.ts";
import {
  archiveTask,
  blockTask,
  createTask,
  findTask,
  finishTask,
  finalizeTaskArchive,
  listTasks,
  loadCurrentTask,
  loadTask,
  loadTaskView,
  replanTask,
  reviewTask,
  rollbackTaskArchive,
  selectTask,
  startTask,
  taskNextAction,
  taskDirectory,
  unblockTask
} from "./task.ts";
import { withTaskLock } from "./task-lock.ts";
import type { ContextEntry, ContextMode, ContractInput, LifecyclePlan, PlatformId, TaskView } from "./types.ts";

const ROOT_ARGS = {
  root: { type: "string", description: "Project root", default: ".", valueHint: "path" },
  json: { type: "boolean", description: "Emit stable JSON output", default: false }
} as const;

const SESSION_ARG = {
  session: { type: "string", description: "Stable host session key", valueHint: "id" }
} as const;

function projectRoot(value: string): string {
  return path.resolve(value);
}

function hostSessionKey(value?: string): string | undefined {
  return value || process.env.OPENNORI_SESSION_ID || process.env.CODEX_THREAD_ID || process.env.CLAUDE_CODE_SESSION_ID;
}

function requiredHostSessionKey(value?: string): string {
  const session = hostSessionKey(value);
  if (!session) {
    throw new OpenNoriError("session_id_required", "A stable host session key is required for worker coordination.", {
      recovery: "Pass --session or run from a supported host conversation."
    });
  }
  return session;
}

function readyProjectRoot(value: string): string {
  const root = projectRoot(value);
  readProjectConfig(root);
  requireCurrentStateSchema(root);
  return root;
}

function readProjectInput<T>(root: string, relativePath: string): T {
  return readJson<T>(safeProjectPath(root, relativePath));
}

function readEvidenceInput(root: string, taskId: string, relativePath: string): EvidenceInput {
  try {
    return readProjectInput<EvidenceInput>(root, relativePath);
  } catch (error) {
    const failure = asOpenNoriError(error);
    if (failure.code !== "unsafe_path") throw error;
    throw new OpenNoriError("unsafe_path", failure.message, {
      context: { path: relativePath, task_id: taskId },
      recovery: `Store the JSON under .opennori/tasks/${taskId}/research/evidence-inputs/ and pass its project-relative path.`
    });
  }
}

function evidenceCommandArguments(rawArgs: readonly string[]): string[] {
  const delimiter = rawArgs.indexOf("--");
  if (delimiter < 0 || delimiter === rawArgs.length - 1) {
    throw new OpenNoriError("evidence_command_missing", "Evidence command must follow a double dash delimiter.", {
      recovery: "Run: opennori task evidence run <task> --outcome <id> --summary <text> -- <executable> [args...]"
    });
  }
  return rawArgs.slice(delimiter + 1);
}

function evidenceTimeoutMs(value: string): number {
  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds) || seconds < 1 || seconds > 3600) {
    throw new OpenNoriError("evidence_timeout_invalid", "Evidence command timeout must be an integer from 1 to 3600 seconds.");
  }
  return seconds * 1000;
}

function contextMaxBytes(value?: string): number | undefined {
  if (value === undefined) return undefined;
  const bytes = Number(value);
  if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > 1024 * 1024) {
    throw new OpenNoriError("context_budget_invalid", "Context max bytes must be an integer from 1 to 1048576.");
  }
  return bytes;
}

function requireTaskLocation(root: string, taskId: string): NonNullable<ReturnType<typeof findTask>> {
  const location = findTask(root, taskId);
  if (!location) throw new OpenNoriError("task_not_found", `Task ${taskId} was not found.`);
  return location;
}

function renderTaskView(view: TaskView): string {
  const delivery = !view.task.delivery_required
    ? "not required"
    : !view.delivery
      ? "missing"
      : view.delivery.mode === "waived"
        ? `waived (${view.delivery_ready ? "current" : "stale"})`
        : view.delivery.status === "recorded"
          ? `${view.delivery.mode} ${view.delivery.commit}${view.delivery_ready ? "" : " [stale]"}`
          : `${view.delivery.mode} planned`;
  const lines = [
    `${view.task.id}  ${view.task.title}`,
    `Stage: ${view.phase} (${view.task.status})`,
    ...(view.task.package ? [`Package: ${view.task.package}`] : []),
    `Contract: ${view.contract?.status ?? "missing"}`,
    `Delivery: ${delivery}`,
    `Finish ready: ${view.finish_ready ? "yes" : "no"}`,
    ...(view.task.blocker ? [`Blocker: ${view.task.blocker}`] : []),
    `Current gap: ${view.current_gap ? `${view.current_gap.id} (${view.current_gap.status})` : "none"}`,
    `Next: ${taskNextAction(view)}`
  ];
  return lines.join("\n");
}

function summarizeTaskView(view: TaskView) {
  const summarizeOutcome = (outcome: TaskView["outcomes"][number]) => ({
    id: outcome.id,
    statement: outcome.statement,
    required: outcome.required,
    status: outcome.status,
    latest_evidence: outcome.latest_evidence
      ? {
          id: outcome.latest_evidence.id,
          result: outcome.latest_evidence.result,
          implementation_revision: outcome.latest_evidence.implementation_revision,
          summary: outcome.latest_evidence.summary,
          recorded_at: outcome.latest_evidence.recorded_at
        }
      : null
  });
  return {
    task: {
      id: view.task.id,
      title: view.task.title,
      status: view.task.status,
      implementation_revision: view.task.implementation_revision,
      priority: view.task.priority,
      delivery_required: view.task.delivery_required,
      package: view.task.package ?? null,
      blocker: view.task.blocker ?? null
    },
    archived: view.archived,
    phase: view.phase,
    contract: view.contract
      ? { task_id: view.contract.task_id, goal: view.contract.goal, status: view.contract.status }
      : null,
    outcomes: view.outcomes.map(summarizeOutcome),
    current_gap: view.current_gap ? summarizeOutcome(view.current_gap) : null,
    complete: view.complete,
    delivery: view.delivery
      ? {
          mode: view.delivery.mode,
          status: view.delivery.status,
          commit: view.delivery.commit,
          pull_request_url: view.delivery.pull_request_url,
          implementation_revision: view.delivery.implementation_revision,
          waiver: view.delivery.waiver
            ? { actor: view.delivery.waiver.actor, reason: view.delivery.waiver.reason }
            : null
        }
      : null,
    delivery_ready: view.delivery_ready,
    finish_ready: view.finish_ready
  };
}

function loadStatusState(rootValue: string, session?: string) {
  const root = readyProjectRoot(rootValue);
  const config = readProjectConfig(root);
  const sessionKey = hostSessionKey(session);
  const currentTask = sessionKey ? loadCurrentTask(root, { sessionKey }) : null;
  const current = currentTask ? loadTaskView(root, currentTask.id) : null;
  const active = listTasks(root).map((location) => location.task);
  return {
    project: { root, developer: config.developer, platforms: config.platforms },
    current,
    active_tasks: active,
    next_action: current
      ? taskNextAction(current)
      : active.length > 0
        ? "Select an active task or continue its planning conversation."
        : "Create a task and draft its Nori Contract."
  };
}

function summarizeStatusState(state: ReturnType<typeof loadStatusState>) {
  return {
    project: state.project,
    current: state.current ? summarizeTaskView(state.current) : null,
    active_tasks: state.active_tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      implementation_revision: task.implementation_revision,
      package: task.package ?? null,
      blocker: task.blocker ?? null
    })),
    next_action: state.next_action
  };
}

function renderLifecycle(result: { plan: LifecyclePlan; applied: boolean }): string {
  if (result.applied) return `Applied.\n${renderPlan(result.plan)}`;
  return `Preview only.\n${renderPlan(result.plan)}\nNext: Review the plan, then rerun without --dry-run and with --confirm.`;
}

function platformInitCommand(platform: PlatformId): string {
  return `opennori init --user <name>${platform === "codex" ? "" : ` --platform ${platform}`}`;
}

function platformSetupCommand(platform: PlatformId): string {
  return `npx opennori setup${platform === "codex" ? "" : ` --platform ${platform}`}`;
}

function platformConversationName(platform: PlatformId): string {
  return platform === "codex" ? "Codex" : "Claude Code";
}

function configuredPlatform(root: string): PlatformId {
  const platform = readProjectConfig(root).platforms[0];
  if (!platform) throw new OpenNoriError("platform_missing", "The project does not configure an agent platform.");
  return platform;
}

function coordinationRoot(value: string): string {
  const root = readyProjectRoot(value);
  requirePlatformCoordination(configuredPlatform(root));
  return root;
}

function commaSeparated(value?: string): string[] {
  return value?.split(",").map((entry) => entry.trim()).filter(Boolean) ?? [];
}

const setupCommand = defineCommand({
  meta: { name: "setup", description: "Prepare the OpenNori CLI and selected agent platform on this machine" },
  args: {
    json: ROOT_ARGS.json,
    platform: {
      type: "enum",
      description: "Agent platform to prepare",
      options: [...PLATFORM_IDS],
      default: "codex"
    },
    "dry-run": { type: "boolean", description: "Inspect host readiness without installing", default: false }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => setupHost(process.cwd(), { dryRun: Boolean(args.dryRun), platform: args.platform as PlatformId }),
      (result) => {
        if (!result.applied) {
          const ready = result.cli.ready && result.platform.ready;
          return [
            ready ? "OpenNori host setup is ready." : "OpenNori setup preview.",
            `CLI: ${result.cli.ready ? `ready (${result.cli.installed_version})` : `needs ${result.cli.expected_version}`}`,
            `${result.platform.display_name}: ${result.platform.ready ? `ready (${result.platform.version})` : "needs setup"}`,
            ready
              ? `Next: In your project, run ${platformInitCommand(args.platform as PlatformId)}.`
              : `Next: Run ${platformSetupCommand(args.platform as PlatformId)} to install missing host capabilities.`
          ].join("\n");
        }
        return [
          `OpenNori CLI ${result.cli.installed_version} is available on PATH.`,
          `${result.platform.display_name} ${result.platform.version ?? "runtime"} is ready.`,
          `Next: In your project, run ${platformInitCommand(args.platform as PlatformId)}.`
        ].join("\n");
      }
    );
  }
});

const initCommand = defineCommand({
  meta: { name: "init", description: "Initialize an OpenNori project for one agent platform" },
  args: {
    ...ROOT_ARGS,
    user: { type: "string", description: "Developer name", required: true, valueHint: "name" },
    platform: {
      type: "enum",
      description: "Agent platform adapter",
      options: [...PLATFORM_IDS],
      default: "codex"
    },
    confirm: { type: "boolean", description: "Confirm replacement of backed-up legacy state", default: false }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = projectRoot(args.root);
        const platformId = args.platform as PlatformId;
        const expectedVersion = currentProductVersion();
        const plan = planInit(root, args.user, expectedVersion, [platformId]);
        if (plan.blockers.length > 0) {
          throw new OpenNoriError("init_blocked", plan.blockers.join(" "), {
            context: { blockers: plan.blockers, warnings: plan.warnings },
            recovery: plan.warnings.join(" ") || "Resolve the reported project state, then rerun opennori init."
          });
        }
        const hasWrites = plan.actions.some((action) => ["create", "update", "remove"].includes(action.type));
        const destructive = plan.actions.some((action) => action.destructive);
        const unresolved = plan.actions.some((action) => action.type === "conflict" || action.type === "preserve");
        if ((destructive || unresolved) && !args.confirm) return { plan, applied: false, platform: null };
        const cli = inspectGlobalCli(process.cwd(), expectedVersion);
        if (!cli.ready) {
          throw new OpenNoriError("setup_required", "The persistent OpenNori CLI is not ready for this package version.", {
            context: cli,
            recovery: "Run npx opennori setup, then rerun opennori init."
          });
        }
        const platform = inspectPlatformHost(process.cwd(), platformId, expectedVersion);
        if (!platform.ready) {
          throw new OpenNoriError("setup_required", `${platform.display_name} host setup is not ready.`, {
            context: platform,
            recovery: `Run npx opennori setup --platform ${platformId}, then rerun opennori init --platform ${platformId}.`
          });
        }
        if (!hasWrites) return { plan, applied: false, platform };
        const config = createProjectConfig(args.user, [platformId]);
        const manifest = applyLifecyclePlan(plan, projectAssets(config), { confirm: true });
        return { plan, applied: true, manifest, platform };
      },
      (result) => {
        if (!result.platform) return renderLifecycle(result);
        const platformStatus = `${result.platform.display_name} ${result.platform.version ?? "runtime"} is ready.`;
        if (!result.applied) {
          return [
            "OpenNori is already initialized; no project files were changed.",
            platformStatus,
            "Next: Run opennori update --dry-run to inspect managed asset freshness."
          ].join("\n");
        }
        const unresolved = result.plan.actions.some((action) => action.type === "conflict" || action.type === "preserve");
        if (unresolved) {
          return `${renderLifecycle(result)}\n${platformStatus}\nNext: Resolve the preserved conflicts and run opennori doctor.`;
        }
        const backup = result.plan.actions.find((action) => action.asset_id === "core.legacy-backup");
        return [
          `Initialized OpenNori in ${result.plan.root}.`,
          backup ? `Previous OpenNori state was backed up at ${backup.path}.` : null,
          platformStatus,
          `Next: Open a new ${platformConversationName(result.platform.platform)} conversation and say: Use OpenNori for this goal: <goal>`
        ]
          .filter(Boolean)
          .join("\n");
      }
    );
  }
});

const doctorCommand = defineCommand({
  meta: { name: "doctor", description: "Diagnose project state and managed assets" },
  args: ROOT_ARGS,
  async run({ args }) {
    await runCliAction(args.json, () => doctorProject(projectRoot(args.root)), (result) => {
      const failures = result.checks.filter((check) => !check.ok);
      if (failures.length === 0) return "OpenNori doctor: ready\nProject workflow, configured agent route, and managed assets are healthy.";
      const lines = [`OpenNori doctor: ${result.status}`];
      for (const check of failures) {
        lines.push(`needs action  ${check.message}`);
        if (check.recovery) lines.push(`  Next: ${check.recovery}`);
      }
      return lines.join("\n");
    });
  }
});

const statusCommand = defineCommand({
  meta: { name: "status", description: "Show current task, stage, gap, and next action" },
  args: {
    ...ROOT_ARGS,
    ...SESSION_ARG,
    summary: { type: "boolean", description: "Omit raw Evidence sources from JSON output", default: false }
  },
  async run({ args }) {
    if (args.json && args.summary) {
      await runCliAction(
        true,
        () => summarizeStatusState(loadStatusState(args.root, args.session)),
        () => ""
      );
      return;
    }
    await runCliAction(
      args.json,
      () => loadStatusState(args.root, args.session),
      (result) => {
        if (result.current) return renderTaskView(result.current);
        return [
          "No current task is selected for this session.",
          `Active tasks: ${result.active_tasks.length}`,
          `Next: ${result.next_action}`
        ].join("\n");
      }
    );
  }
});

const taskCreateCommand = defineCommand({
  meta: { name: "create", description: "Create one planning task" },
  args: {
    ...ROOT_ARGS,
    title: { type: "string", description: "Task title", required: true },
    description: { type: "string", description: "Task boundary", default: "" },
    priority: { type: "enum", description: "Task priority", options: ["P0", "P1", "P2", "P3"], default: "P2" },
    package: { type: "string", description: "Optional package scope" },
    slug: { type: "string", description: "ASCII task id suffix" },
    ...SESSION_ARG
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      async () => {
        const root = readyProjectRoot(args.root);
        const config = readProjectConfig(root);
        const created = await retryStateBusy(() =>
          createTask(root, {
            title: args.title,
            description: args.description,
            creator: config.developer,
            priority: args.priority,
            package: args.package,
            slug: args.slug
          })
        );
        const sessionKey = hostSessionKey(args.session);
        let selected = false;
        let selection_error: string | null = null;
        if (sessionKey) {
          try {
            await retryStateBusy(() => selectTask(root, created.task.id, { sessionKey }));
            selected = true;
          } catch (error) {
            const failure = asOpenNoriError(error);
            if (failure.code !== "state_busy") throw error;
            selection_error = failure.code;
          }
        }
        return { ...created, selected, selection_error };
      },
      (result) =>
        result.selection_error
          ? `Created ${result.task.id}: ${result.task.title}\nSelection is still busy. Next: retry task selection with the same --root and --session values.`
          : `Created ${result.task.id}: ${result.task.title}\nNext: Draft and review its Nori Contract.`,
      { retryBusy: false }
    );
  }
});

const taskListCommand = defineCommand({
  meta: { name: "list", description: "List active or archived tasks" },
  args: { ...ROOT_ARGS, archived: { type: "boolean", description: "Include archived tasks", default: false } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        return listTasks(root, { includeArchived: args.archived });
      },
      (tasks) =>
        tasks.length === 0
          ? "No OpenNori tasks."
          : tasks.map(({ task, archived }) => `${task.id}  ${task.status.padEnd(11)} ${task.title}${archived ? " [archived]" : ""}`).join("\n")
    );
  }
});

const taskShowCommand = defineCommand({
  meta: { name: "show", description: "Show one task and its derived Outcome state" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(args.json, () => loadTaskView(readyProjectRoot(args.root), args.task), renderTaskView);
  }
});

const taskStartCommand = defineCommand({
  meta: { name: "start", description: "Start approved implementation and select it for this session" },
  args: { ...ROOT_ARGS, ...SESSION_ARG, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => startTask(readyProjectRoot(args.root), args.task, { sessionKey: hostSessionKey(args.session) }),
      (task) => `Started ${task.id}.\nNext: Load implement context and implement the approved Contract.`
    );
  }
});

const taskSelectCommand = defineCommand({
  meta: { name: "select", description: "Select an active task for this host session" },
  args: { ...ROOT_ARGS, ...SESSION_ARG, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => selectTask(readyProjectRoot(args.root), args.task, { sessionKey: hostSessionKey(args.session) }),
      (task) => `Selected ${task.id} for this session.`
    );
  }
});

const taskCurrentCommand = defineCommand({
  meta: { name: "current", description: "Read this session's selected task" },
  args: { ...ROOT_ARGS, ...SESSION_ARG },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const task = loadCurrentTask(root, { sessionKey: hostSessionKey(args.session) });
        return task ? loadTaskView(root, task.id) : null;
      },
      (view) => (view ? renderTaskView(view) : "No current task is selected for this session.")
    );
  }
});

const taskReviewCommand = defineCommand({
  meta: { name: "review", description: "Move an implemented task into Verify" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => reviewTask(readyProjectRoot(args.root), args.task),
      (task) => `${task.id} is ready for independent verification.`
    );
  }
});

const taskReplanCommand = defineCommand({
  meta: { name: "replan", description: "Return to Plan before Outcome evidence exists" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    reason: { type: "string", description: "Scope or Contract conflict", required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => replanTask(readyProjectRoot(args.root), args.task, args.reason),
      (task) => `${task.id} returned to Plan.\nNext: Revise and reapprove its Nori Contract.`
    );
  }
});

const taskBlockCommand = defineCommand({
  meta: { name: "block", description: "Record a blocker without changing the current stage" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    reason: { type: "string", description: "Concrete blocker", required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => blockTask(readyProjectRoot(args.root), args.task, args.reason),
      (task) => `${task.id} remains ${task.status} and is blocked: ${task.blocker}`
    );
  }
});

const taskUnblockCommand = defineCommand({
  meta: { name: "unblock", description: "Clear a resolved blocker without changing stage" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => unblockTask(readyProjectRoot(args.root), args.task),
      (task) => `${task.id} is unblocked and remains ${task.status}.`
    );
  }
});

const taskFinishCommand = defineCommand({
  meta: { name: "finish", description: "Complete a verified task when required Outcomes are resolved" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => finishTask(readyProjectRoot(args.root), args.task),
      (task) =>
        `${task.id} is verified and ready to archive.\nNext: Promote stable knowledge, prepare the archive summary, and archive the task; archive writes the journal entry.`
    );
  }
});

const taskArchiveCommand = defineCommand({
  meta: { name: "archive", description: "Finalize the report and journal while archiving a completed task" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    summary: { type: "string", description: "Durable journal summary", required: true },
    knowledge: {
      type: "enum",
      description: "Whether stable project knowledge was promoted",
      options: ["promoted", "none"],
      required: true
    },
    "knowledge-summary": { type: "string", description: "What was promoted or why none was needed", required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const config = readProjectConfig(root);
        return withTaskLock(root, args.task, () => {
          const initialLocation = requireTaskLocation(root, args.task);
          const task = initialLocation.task;
          if (task.status !== "completed") throw new OpenNoriError("task_not_completed", `Task ${task.id} is not completed.`);
          const view = loadTaskView(root, task.id);
          const journalEntry = {
            task_id: task.id,
            title: task.title,
            summary: args.summary,
            status: "completed",
            knowledge: args.knowledge,
            knowledge_summary: args["knowledge-summary"],
            commits: view.delivery?.commit ? [view.delivery.commit] : []
          } as const;
          validateJournalEntry(journalEntry);
          const summary = buildCompletionSummary(view, {
            decision: args.knowledge,
            summary: args["knowledge-summary"]
          });
          writeTaskReport(root, task.id);
          const archived = archiveTask(root, task.id);
          const movedByThisCommand = !initialLocation.archived;
          try {
            const journal = appendJournalEntry(root, developerSlug(config.developer), journalEntry);
            finalizeTaskArchive(root, task.id);
            return {
              task: archived.task,
              directory: archived.directory,
              report: path.join(archived.directory, "report.md"),
              journal,
              summary
            };
          } catch (error) {
            if (movedByThisCommand) rollbackTaskArchive(root, task.id);
            throw error;
          }
        });
      },
      (result) => {
        const summary = `${renderCompletionSummary(result.summary)}\nReport: ${result.report}\nJournal: ${result.journal}`;
        return !result.task.delivery_required || result.summary.delivery?.mode === "waived"
          ? `${summary}\nCompleted without Git finalization under the recorded migration or delivery waiver.`
          : `${summary}\nNext: Commit the archived OpenNori state, push it when using a pull request, then run opennori task delivery finalize ${result.task.id}.`;
      }
    );
  }
});

const taskReportCommand = defineCommand({
  meta: { name: "report", description: "Generate a human-readable task report" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => ({ path: writeTaskReport(readyProjectRoot(args.root), args.task) }),
      (result) => `Wrote ${result.path}`
    );
  }
});

const deliveryPlanCommand = defineCommand({
  meta: { name: "plan", description: "Choose commit, pull request, or explicitly waived delivery" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    mode: { type: "enum", description: "Delivery boundary", options: ["commit", "pull-request", "waived"], required: true },
    base: { type: "string", description: "Base branch or ref; required for pull requests" },
    branch: { type: "string", description: "Checked-out task branch" },
    remote: { type: "string", description: "Git remote for pull request delivery", default: "origin" },
    actor: { type: "string", description: "Person explicitly confirming a delivery waiver" },
    confirmation: { type: "string", description: "Stable host confirmation reference for a waiver" },
    reason: { type: "string", description: "Concrete reason Git delivery is waived" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () =>
        planTaskDelivery(readyProjectRoot(args.root), args.task, {
          mode: args.mode === "pull-request" ? "pull_request" : args.mode,
          base: args.base,
          branch: args.branch,
          remote: args.remote,
          actor: args.actor,
          hostConfirmationRef: args.confirmation,
          reason: args.reason
        }),
      (delivery) =>
        delivery.mode === "waived"
          ? `Recorded delivery waiver for ${delivery.task_id}.`
          : `Planned ${delivery.mode === "pull_request" ? "pull request" : "commit"} delivery for ${delivery.task_id} from ${delivery.base_commit}.`
    );
  }
});

const deliveryRecordCommand = defineCommand({
  meta: { name: "record", description: "Verify and record the delivered commit or pull request" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    commit: { type: "string", description: "Delivered commit ref", default: "HEAD" },
    pr: { type: "string", description: "Created pull request HTTPS URL" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => recordTaskDelivery(readyProjectRoot(args.root), args.task, { commit: args.commit, pullRequestUrl: args.pr }),
      (delivery) =>
        delivery.pull_request_url
          ? `Verified ${delivery.commit} in ${delivery.pull_request_url}.`
          : `Verified delivered commit ${delivery.commit}.`
    );
  }
});

const deliveryShowCommand = defineCommand({
  meta: { name: "show", description: "Show the task delivery plan and verified result" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const location = requireTaskLocation(readyProjectRoot(args.root), args.task);
        const delivery = loadDelivery(location.directory, args.task);
        if (!delivery) throw new OpenNoriError("delivery_not_found", `Task ${args.task} has no delivery plan.`);
        return delivery;
      },
      (delivery) =>
        delivery.mode === "waived"
          ? `Delivery waived by ${delivery.waiver?.actor}: ${delivery.waiver?.reason}`
          : `${delivery.mode} ${delivery.status}\nBase: ${delivery.base_commit}\nBranch: ${delivery.branch}${delivery.commit ? `\nCommit: ${delivery.commit}` : ""}${delivery.pull_request_url ? `\nPull request: ${delivery.pull_request_url}` : ""}`
    );
  }
});

const deliveryFinalizeCommand = defineCommand({
  meta: { name: "finalize", description: "Verify the clean archived Git checkpoint and pull request head" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Archived task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => finalizeTaskDelivery(readyProjectRoot(args.root), args.task),
      (delivery) =>
        delivery.pull_request_url
          ? `Completed: ${delivery.title}\nFinal checkpoint: ${delivery.final_commit}\nPull request: ${delivery.pull_request_url}`
          : `Completed: ${delivery.title}\nFinal checkpoint: ${delivery.final_commit}`
    );
  }
});

const historySearchCommand = defineCommand({
  meta: { name: "search", description: "Find bounded prior host discussions for this project" },
  args: {
    ...ROOT_ARGS,
    query: { type: "string", description: "Topic to find in prior sessions", required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const adapter = platformSessionMemory(configuredPlatform(root));
        return adapter.search(root, args.query, { excludeSessionId: hostSessionKey() });
      },
      (result) =>
        result.sessions.length === 0
          ? "No matching prior sessions were found for this project."
          : [
              ...result.sessions.map(
                (session) => `${session.session_id}  ${session.updated_at}  ${session.title}\n  ${session.excerpt}`
              ),
              "Next: Use opennori history show <session-id> to inspect one bounded excerpt."
            ].join("\n")
    );
  }
});

const historyShowCommand = defineCommand({
  meta: { name: "show", description: "Read one bounded prior host session excerpt" },
  args: {
    ...ROOT_ARGS,
    session: { type: "positional", description: "Host session id", required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        return platformSessionMemory(configuredPlatform(root)).read(root, args.session);
      },
      (result) =>
        [
          `${result.title}  ${result.updated_at}`,
          ...result.messages.map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.text}`),
          ...(result.truncated ? ["Earlier or oversized history was omitted."] : [])
        ].join("\n\n")
    );
  }
});

const historyCommand = defineCommand({
  meta: { name: "history", description: "Read bounded project history from the configured agent host" },
  subCommands: { search: historySearchCommand, show: historyShowCommand }
});

const contractWriteCommand = defineCommand({
  meta: { name: "write", description: "Write a draft Contract from project-local JSON" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    input: { type: "string", description: "Project-relative Contract input JSON", required: true, valueHint: "file" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const task = loadTask(root, args.task);
        return writeContractDraft(taskDirectory(root, task.id), task, readProjectInput<ContractInput>(root, args.input));
      },
      (contract) => `Drafted Contract for ${contract.task_id} with ${contract.outcomes.length} Outcomes.`
    );
  }
});

const contractApproveCommand = defineCommand({
  meta: { name: "approve", description: "Record a confirmed human approval of the reviewed Contract" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    approver: { type: "string", description: "Person who explicitly approved the Contract", required: true },
    confirmation: { type: "string", description: "Stable host confirmation reference, when available" },
    note: { type: "string", description: "Optional approval note" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const task = loadTask(root, args.task);
        return approveContract(taskDirectory(root, task.id), task, {
          approver: args.approver,
          host_confirmation_ref: args.confirmation,
          note: args.note
        });
      },
      (contract) =>
        `Recorded Contract approval by ${contract.approval?.approver} for ${contract.task_id}.\nNext: Start the task in a stable session.`
    );
  }
});

const contractShowCommand = defineCommand({
  meta: { name: "show", description: "Show the canonical Contract" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        return loadContract(requireTaskLocation(root, args.task).directory, args.task);
      },
      (contract) =>
        [
          `${contract.task_id} Contract: ${contract.status}`,
          ...(contract.approval
            ? [`Approved by: ${contract.approval.approver}`, `Approved at: ${contract.approval.approved_at}`]
            : []),
          ...contract.outcomes.map((outcome) => `${outcome.id}  ${outcome.statement}`)
        ].join("\n")
    );
  }
});

const contextWriteCommand = defineCommand({
  meta: { name: "write", description: "Write an implement or check context manifest" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    mode: { type: "enum", description: "Context mode", options: ["implement", "check"], required: true },
    input: { type: "string", description: "Project-relative JSON array of context entries", required: true, valueHint: "file" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const entries = readProjectInput<unknown>(root, args.input);
        if (!Array.isArray(entries)) throw new OpenNoriError("context_input_invalid", "Context input must be a JSON array.");
        return writeContextManifest(root, args.task, args.mode, entries as ContextEntry[]);
      },
      (entries) => `Wrote ${entries.length} ${args.mode} context entries.`
    );
  }
});

const contextShowCommand = defineCommand({
  meta: { name: "show", description: "Load and verify one context manifest" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    mode: { type: "enum", description: "Context mode", options: ["implement", "check"], required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => loadContextFiles(readyProjectRoot(args.root), args.task, args.mode as ContextMode),
      (entries) => (entries.length ? entries.map((entry) => `${entry.file}  ${entry.reason}`).join("\n") : `No ${args.mode} context.`)
    );
  }
});

const contextLoadCommand = defineCommand({
  meta: { name: "load", description: "Load bounded text content from one context manifest" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    mode: { type: "enum", description: "Context mode", options: ["implement", "check"], required: true },
    file: { type: "string", description: "Exact file registered in the context manifest", valueHint: "path" },
    "max-bytes": { type: "string", description: "Maximum complete-file content bytes", valueHint: "bytes" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () =>
        loadContextBundle(readyProjectRoot(args.root), args.task, args.mode as ContextMode, {
          file: args.file,
          maxBytes: contextMaxBytes(typeof args.maxBytes === "string" ? args.maxBytes : undefined)
        }),
      (bundle) => {
        const loaded = bundle.entries
          .map((entry) => `===== ${entry.file} =====\nReason: ${entry.reason}\n\n${entry.content.trimEnd()}`)
          .join("\n\n");
        const omitted = bundle.omitted
          .map((entry) => `Omitted ${entry.file} (${entry.bytes} bytes). Next: ${entry.recovery}`)
          .join("\n");
        return [loaded, omitted].filter(Boolean).join("\n\n");
      }
    );
  }
});

const evidenceAddCommand = defineCommand({
  meta: { name: "add", description: "Append one evidence fact from project-local JSON" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    input: { type: "string", description: "Project-relative evidence input JSON", required: true, valueHint: "file" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const location = requireTaskLocation(root, args.task);
        const contract = loadContract(location.directory, args.task);
        return appendEvidence(root, location.directory, location.task, contract, readEvidenceInput(root, args.task, args.input));
      },
      (evidence) => `Recorded ${evidence.result} Evidence for ${evidence.outcome_id}.`
    );
  }
});

const evidenceRunCommand = defineCommand({
  meta: { name: "run", description: "Execute a command without a shell and append its observed Evidence" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    outcome: { type: "string", description: "Outcome id", required: true, valueHint: "id" },
    summary: { type: "string", description: "Observed result summary", required: true, valueHint: "text" },
    cwd: { type: "string", description: "Project-relative command directory", default: ".", valueHint: "path" },
    timeout: { type: "string", description: "Command timeout in seconds", default: "600", valueHint: "seconds" }
  },
  async run({ args, rawArgs }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const location = requireTaskLocation(root, args.task);
        const contract = loadContract(location.directory, args.task);
        const commandArgv = evidenceCommandArguments(rawArgs);
        const command = commandArgv[0];
        if (!command) throw new OpenNoriError("evidence_command_missing", "Evidence executable is required after --.");
        return runCommandEvidence(root, location.directory, location.task, contract, {
          outcome_id: args.outcome,
          summary: args.summary,
          command,
          args: commandArgv.slice(1),
          cwd: args.cwd,
          timeout_ms: evidenceTimeoutMs(args.timeout)
        });
      },
      (evidence) =>
        `Recorded ${evidence.result} Evidence for ${evidence.outcome_id}; command exited ${evidence.sources[0]?.type === "command" ? evidence.sources[0].exit_code : "unknown"}.`
    );
  }
});

const coordinationAssignCommand = defineCommand({
  meta: { name: "assign", description: "Bind one host-native worker to this task revision" },
  args: {
    ...ROOT_ARGS,
    ...SESSION_ARG,
    task: { type: "positional", description: "Task id", required: true },
    worker: { type: "string", description: "Host worker reference", required: true },
    role: { type: "string", description: "Worker role", required: true },
    assignment: { type: "string", description: "Bounded assignment summary", required: true },
    outcomes: { type: "string", description: "Comma-separated Outcome ids" },
    paths: { type: "string", description: "Comma-separated project paths" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = coordinationRoot(args.root);
        return assignCoordinationWorker(root, args.task, {
          workerRef: args.worker,
          parentSession: requiredHostSessionKey(args.session),
          role: args.role,
          assignment: args.assignment,
          outcomeIds: commaSeparated(args.outcomes),
          paths: commaSeparated(args.paths)
        });
      },
      (binding) =>
        `Bound worker ${coordinationWorkerLabel(binding.worker_ref)} to ${binding.task_id} revision ${binding.implementation_revision}.`
    );
  }
});

const coordinationMessageCommand = defineCommand({
  meta: { name: "message", description: "Record that a host-native worker message succeeded" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    worker: { type: "string", description: "Host worker reference", required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => recordCoordinationContact(coordinationRoot(args.root), args.task, args.worker),
      (binding) => `Recorded worker ${coordinationWorkerLabel(binding.worker_ref)} contact at ${binding.last_contact_at}.`
    );
  }
});

const coordinationInterruptCommand = defineCommand({
  meta: { name: "interrupt", description: "Record a successful host-native worker interruption" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    worker: { type: "string", description: "Host worker reference", required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => recordCoordinationInterruption(coordinationRoot(args.root), args.task, args.worker),
      (binding) => `Recorded worker ${coordinationWorkerLabel(binding.worker_ref)} interruption at ${binding.interrupted_at}.`
    );
  }
});

const coordinationListCommand = defineCommand({
  meta: { name: "list", description: "Show local worker bindings and observations" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => listCoordinationBindings(coordinationRoot(args.root), args.task),
      (result) => {
        if (result.bindings.length === 0) return "No worker observations are recorded for this task.";
        const lines = result.bindings.map((binding) => {
          const observation = binding.stopped_at
            ? `stopped ${binding.stopped_at}`
            : binding.interrupted_at
              ? `interrupted ${binding.interrupted_at}`
              : binding.last_contact_at
                ? `contacted ${binding.last_contact_at}`
                : binding.started_at
                  ? `started ${binding.started_at}`
                  : "bound without a lifecycle observation";
          return `${coordinationWorkerLabel(binding.worker_ref)}  ${binding.role}  revision ${binding.implementation_revision}${binding.current_revision ? "" : " [stale]"}  ${observation}`;
        });
        if (result.invalid_records > 0) lines.push(`${result.invalid_records} invalid local binding record(s) were ignored.`);
        return lines.join("\n");
      }
    );
  }
});

const contractCommand = defineCommand({
  meta: { name: "contract", description: "Draft, inspect, and approve the task Contract" },
  subCommands: { write: contractWriteCommand, approve: contractApproveCommand, show: contractShowCommand }
});

const contextCommand = defineCommand({
  meta: { name: "context", description: "Curate separate implementation and verification context" },
  subCommands: { write: contextWriteCommand, show: contextShowCommand, load: contextLoadCommand }
});

const evidenceCommand = defineCommand({
  meta: { name: "evidence", description: "Append Outcome Evidence" },
  subCommands: { add: evidenceAddCommand, run: evidenceRunCommand }
});

const deliveryCommand = defineCommand({
  meta: { name: "delivery", description: "Plan and verify the task's Git delivery boundary" },
  subCommands: { plan: deliveryPlanCommand, record: deliveryRecordCommand, finalize: deliveryFinalizeCommand, show: deliveryShowCommand }
});

const coordinationCommand = defineCommand({
  meta: { name: "coordination", description: "Observe host-native workers without changing task completion" },
  subCommands: {
    assign: coordinationAssignCommand,
    message: coordinationMessageCommand,
    interrupt: coordinationInterruptCommand,
    list: coordinationListCommand
  }
});

const taskCommand = defineCommand({
  meta: { name: "task", description: "Manage one durable OpenNori task" },
  subCommands: {
    create: taskCreateCommand,
    list: taskListCommand,
    show: taskShowCommand,
    select: taskSelectCommand,
    start: taskStartCommand,
    current: taskCurrentCommand,
    block: taskBlockCommand,
    unblock: taskUnblockCommand,
    replan: taskReplanCommand,
    review: taskReviewCommand,
    finish: taskFinishCommand,
    archive: taskArchiveCommand,
    report: taskReportCommand,
    contract: contractCommand,
    context: contextCommand,
    evidence: evidenceCommand,
    delivery: deliveryCommand,
    coordination: coordinationCommand
  }
});

const updateCommand = defineCommand({
  meta: { name: "update", description: "Preview or apply managed asset updates" },
  args: {
    ...ROOT_ARGS,
    "dry-run": { type: "boolean", description: "Preview without writes", default: false },
    "repair-manifest": { type: "boolean", description: "Reconstruct ownership for hash-proven generated assets", default: false },
    confirm: { type: "boolean", description: "Apply the reviewed update", default: false }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        if (args.dryRun && args.confirm) throw new OpenNoriError("flags_conflict", "Use either --dry-run or --confirm, not both.");
        return args.repairManifest
          ? repairProjectManifest(projectRoot(args.root), { confirm: args.confirm })
          : updateProject(projectRoot(args.root), { confirm: args.confirm });
      },
      renderLifecycle
    );
  }
});

const uninstallCommand = defineCommand({
  meta: { name: "uninstall", description: "Preview or remove safely owned OpenNori assets" },
  args: {
    ...ROOT_ARGS,
    "dry-run": { type: "boolean", description: "Preview without writes", default: false },
    confirm: { type: "boolean", description: "Apply the reviewed uninstall", default: false }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        if (args.dryRun && args.confirm) throw new OpenNoriError("flags_conflict", "Use either --dry-run or --confirm, not both.");
        return uninstallProject(projectRoot(args.root), { confirm: args.confirm });
      },
      renderLifecycle
    );
  }
});

export const rootCommand = defineCommand({
  meta: {
    name: "opennori",
    version: currentProductVersion(),
    description: "Repo-native agent workflow with outcome-driven completion"
  },
  subCommands: {
    setup: setupCommand,
    init: initCommand,
    doctor: doctorCommand,
    status: statusCommand,
    history: historyCommand,
    task: taskCommand,
    update: updateCommand,
    uninstall: uninstallCommand
  }
});
