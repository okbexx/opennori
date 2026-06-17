import { defineCommand } from "citty";
import { syncPlugin } from "../../lifecycle/plugin-sync.ts";
import type { PluginSyncCommandRunner } from "../../lifecycle/plugin-sync.ts";
import { runJsonCommand } from "../runtime.ts";

export const pluginSyncCommand = defineCommand({
  meta: {
    name: "sync",
    description: "Sync the installed OpenNori Codex Plugin cache without changing project state."
  },
  args: {
    dryRun: {
      type: "boolean",
      description: "Preview planned plugin sync actions without updating Codex Plugin cache.",
      default: false
    },
    confirm: {
      type: "boolean",
      description: "Apply the plugin sync after preview.",
      default: false
    },
    local: {
      type: "boolean",
      description: "Register this OpenNori package root as the Codex Plugin marketplace before syncing.",
      default: false
    },
    json: {
      type: "boolean",
      description: "Keep deterministic JSON output for agents.",
      default: false
    }
  },
  run({ args, data }) {
    return syncPlugin({
      dryRun: Boolean(args.dryRun) || !args.confirm,
      confirmed: Boolean(args.confirm),
      local: Boolean(args.local),
      runner: (data as { runner?: PluginSyncCommandRunner } | undefined)?.runner
    });
  }
});

export async function runPluginSyncCommand(rawArgs: string[], data?: { runner?: PluginSyncCommandRunner }) {
  return runJsonCommand(pluginSyncCommand, rawArgs, data);
}
