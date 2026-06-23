import type { NoriResult } from "../types/lifecycle.ts";
import type {
  ExternalActionStatus,
  ExternalCommandAction,
  ExternalCommandResult,
  ExternalCommandRunner
} from "./external-actions.ts";

export type PluginSyncActionStatus = ExternalActionStatus;

export type PluginSyncAction = ExternalCommandAction<"codex_marketplace" | "codex_plugin" | "packaged_skills">;

export type PluginSyncPlan = {
  schema_version: "opennori/plugin-sync-plan-v1";
  dry_run: boolean;
  confirmed: boolean;
  local: boolean;
  summary: {
    total: number;
    would_write: number;
    will_write: number;
    unavailable: number;
    destructive: number;
  };
  actions: PluginSyncAction[];
};

export type PluginSyncCommandResult = ExternalCommandResult;
export type PluginSyncCommandRunner = ExternalCommandRunner;

export type PluginSyncOptions = {
  dryRun?: boolean;
  confirmed?: boolean;
  local?: boolean;
  runner?: PluginSyncCommandRunner;
};

export type PluginSyncResult = NoriResult;
