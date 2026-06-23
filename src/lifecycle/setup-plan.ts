import { defaultExternalCommandRunner, summarizeExternalActions } from "./external-actions.ts";
import { installActions } from "./install.ts";
import { buildInstallPlan } from "./plans.ts";
import { buildSetupExternalActions, setupDoctorAction, setupProjectStateAction } from "./setup-actions.ts";
import type { SetupOptions, SetupPlan } from "./setup-types.ts";

export function buildSetupPlan(
  root: string,
  { dryRun = true, confirmed = false, runner = defaultExternalCommandRunner }: SetupOptions = {}
): SetupPlan {
  const willApply = confirmed && !dryRun;
  const projectActions = installActions(root, { dryRun: !willApply, force: false, mergeAgentRoute: false });
  const projectInstallPlan = buildInstallPlan(root, projectActions, { dryRun: !willApply, force: false, mergeAgentRoute: false });
  const actions = [
    ...buildSetupExternalActions(runner, willApply),
    setupProjectStateAction(projectInstallPlan, willApply),
    setupDoctorAction(willApply)
  ];
  return {
    schema_version: "opennori/setup-plan-v1",
    root,
    dry_run: !willApply,
    confirmed,
    summary: summarizeExternalActions(actions),
    actions,
    project_install_plan: projectInstallPlan
  };
}
