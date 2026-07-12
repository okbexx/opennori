import { defineCommand } from "citty";
import { renderPlan, runCliAction } from "../cli-output.ts";
import { OpenNoriError } from "../errors.ts";
import { addProjectPlatform } from "../lifecycle.ts";
import { PLATFORM_IDS } from "../platform.ts";
import { currentProductVersion } from "../project.ts";
import { inspectPlatformHost } from "../setup.ts";
import type { PlatformId } from "../types.ts";
import { ROOT_ARGS, readyProjectRoot } from "./common.ts";

function platformId(value: string): PlatformId {
  if ((PLATFORM_IDS as readonly string[]).includes(value)) return value as PlatformId;
  throw new OpenNoriError("platform_unsupported", `Unsupported platform: ${value}.`, {
    recovery: `Choose one of: ${PLATFORM_IDS.join(", ")}.`
  });
}

const addPlatformCommand = defineCommand({
  meta: { name: "add", description: "Add one agent platform without replacing existing adapters" },
  args: {
    ...ROOT_ARGS,
    platform: { type: "positional", description: "Agent platform adapter", required: true },
    "dry-run": { type: "boolean", description: "Preview without writes", default: false },
    confirm: { type: "boolean", description: "Apply the reviewed platform plan", default: false }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        if (args.dryRun && args.confirm) {
          throw new OpenNoriError("arguments_conflict", "--dry-run and --confirm cannot be used together.");
        }
        const root = readyProjectRoot(args.root);
        const platform = platformId(args.platform);
        const expectedVersion = currentProductVersion();
        const host = inspectPlatformHost(root, platform, expectedVersion);
        if (!host.ready) {
          throw new OpenNoriError("setup_required", `${host.display_name} host setup is not ready.`, {
            context: host,
            recovery: `Run npx opennori setup --platform ${platform}, then preview the platform addition again.`
          });
        }
        return {
          ...addProjectPlatform(root, platform, { confirm: Boolean(args.confirm), productVersion: expectedVersion }),
          platform,
          host
        };
      },
      (result) => {
        if (result.applied) {
          return `Added ${result.host.display_name} to this OpenNori project.\nNext: Open a new ${result.host.display_name} conversation in the project.`;
        }
        const alreadyConfigured = result.manifest?.platforms.includes(result.platform) ?? false;
        if (alreadyConfigured && result.plan.actions.every((entry) => entry.type === "skip")) {
          return `${result.host.display_name} is already configured for this OpenNori project.`;
        }
        return `Preview only.\n${renderPlan(result.plan)}\nNext: Review the plan, then rerun with --confirm.`;
      }
    );
  }
});

export const platformCommand = defineCommand({
  meta: { name: "platform", description: "Manage project agent platform adapters" },
  subCommands: { add: addPlatformCommand }
});
