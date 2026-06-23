import type { InstallPlan, NoriResult } from "../types/lifecycle.ts";
import type { ExternalCommandResult, ExternalCommandRunner } from "./adapters/external-command-runner.ts";
import type {
  ExternalActionStatus,
  ExternalCommandAction
} from "./external-actions.ts";

export type SetupActionId = "codex_marketplace" | "codex_plugin" | "packaged_skills" | "global_cli" | "project_state" | "doctor";
export type SetupActionStatus = ExternalActionStatus;
export type SetupPlanAction = ExternalCommandAction<SetupActionId>;

export type SetupPlan = {
  schema_version: "opennori/setup-plan-v1";
  root: string;
  dry_run: boolean;
  confirmed: boolean;
  summary: {
    total: number;
    would_write: number;
    will_write: number;
    unavailable: number;
    destructive: number;
  };
  actions: SetupPlanAction[];
  project_install_plan: InstallPlan;
};

export type SetupCommandResult = ExternalCommandResult;
export type SetupCommandRunner = ExternalCommandRunner;

export type SetupOptions = {
  root?: string;
  dryRun?: boolean;
  confirmed?: boolean;
  runner?: SetupCommandRunner;
};

export type SetupResult = NoriResult;
