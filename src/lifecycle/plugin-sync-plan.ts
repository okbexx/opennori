import { defaultExternalCommandRunner } from "./adapters/external-command-runner.ts";
import { summarizeExternalActions } from "./external-actions.ts";
import {
  pluginSyncMarketplaceAction,
  pluginSyncPackagedSkillsAction,
  pluginSyncPluginAction
} from "./plugin-sync-actions.ts";
import type { PluginSyncOptions, PluginSyncPlan } from "./plugin-sync-types.ts";

export function buildPluginSyncPlan({
  dryRun = true,
  confirmed = false,
  local = false,
  runner = defaultExternalCommandRunner
}: PluginSyncOptions = {}): PluginSyncPlan {
  const willApply = confirmed && !dryRun;
  const marketplace = pluginSyncMarketplaceAction(runner, willApply, local);
  const actions = [
    marketplace.action,
    pluginSyncPluginAction(runner, marketplace.codexAvailable, willApply),
    pluginSyncPackagedSkillsAction()
  ];
  return {
    schema_version: "opennori/plugin-sync-plan-v1",
    dry_run: !willApply,
    confirmed,
    local,
    summary: summarizeExternalActions(actions),
    actions
  };
}
