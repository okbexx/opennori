import { defineCommand } from "citty";
import { renderPlan, runCliAction } from "../cli-output.ts";
import { doctorProject } from "../doctor.ts";
import { OpenNoriError } from "../errors.ts";
import { applyLifecyclePlan, planInit, repairProjectManifest, uninstallProject, updateProject } from "../lifecycle.ts";
import { PLATFORM_IDS } from "../platform.ts";
import { createProjectConfig, currentProductVersion, projectAssets } from "../project.ts";
import { inspectGlobalCli, inspectPlatformHost, setupHost } from "../setup.ts";
import type { DoctorResult, LifecyclePlan, PlatformId } from "../types.ts";
import { ROOT_ARGS, projectRoot } from "./common.ts";

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

export const setupCommand = defineCommand({
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

export const initCommand = defineCommand({
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
          `Next: Open a new ${platformConversationName(result.platform.platform)} conversation and describe your goal. OpenNori will ask before creating a task.`
        ]
          .filter(Boolean)
          .join("\n");
      }
    );
  }
});

export const doctorCommand = defineCommand({
  meta: { name: "doctor", description: "Diagnose project state and managed assets" },
  args: ROOT_ARGS,
  async run({ args }) {
    await runCliAction(args.json, () => doctorProject(projectRoot(args.root)), renderDoctorResult);
  }
});

export function renderDoctorResult(result: DoctorResult): string {
  const failures = result.checks.filter((check) => !check.ok);
  if (failures.length === 0) {
    return "OpenNori is ready.\nNext: Continue the current goal or start a new one in an agent conversation.";
  }
  const lines = [result.status === "broken" ? "OpenNori cannot continue yet." : "OpenNori needs attention."];
  for (const check of failures) {
    lines.push(`- ${check.message}`);
    if (check.recovery) lines.push(`  Next: ${check.recovery}`);
  }
  return lines.join("\n");
}

export const updateCommand = defineCommand({
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

export const uninstallCommand = defineCommand({
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
