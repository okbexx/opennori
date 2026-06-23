import type { SubCommandsDef } from "citty";
import { defineCommand } from "citty";
import { approveCommand, brainstormCommand, criterionAddCommand, criterionUpdateCommand, discoverCommand, draftCommand, evaluateCommand, initCommand, nextCommand, resumeCommand, statusCommand } from "./commands/acceptance.ts";
import { architectureApplyCommand, architectureBaselineCommand, architectureBuildVsBuyCommand, architectureChallengeCommand, architectureProfileCommand, architectureProfilesCommand, architectureRequirementCommand, architectureShowCommand } from "./commands/architecture.ts";
import { activityFinishCommand, activityHeartbeatCommand, activityShowCommand, activityStartCommand } from "./commands/activity.ts";
import { bootstrapCommand } from "./commands/bootstrap.ts";
import { changesCommand } from "./commands/changes.ts";
import { checkCommand } from "./commands/check.ts";
import { contextExportCommand } from "./commands/context.ts";
import { dashboardCommand } from "./commands/dashboard.ts";
import { doctorCommand } from "./commands/doctor.ts";
import { evidenceAddCommand, evidencePruneCommand } from "./commands/evidence.ts";
import { installCommand } from "./commands/install.ts";
import { listCommand } from "./commands/list.ts";
import { mcpCommand } from "./commands/mcp.ts";
import { pluginSyncCommand } from "./commands/plugin.ts";
import { profileAddCommand, profileCheckCommand, profileEvidenceCommand, profileShowCommand } from "./commands/profile.ts";
import { archiveCommand, reportCommand } from "./commands/reporting.ts";
import { setupCommand } from "./commands/setup.ts";
import { uninstallCommand } from "./commands/uninstall.ts";
import { upgradeCommand } from "./commands/upgrade.ts";
import { asCommand, type AnyCommand } from "./command-types.ts";
import { withPolicy } from "./policies.ts";

export const CLI_NAME = "opennori";

function groupCommand(name: string, description: string, subCommands: SubCommandsDef): AnyCommand {
  return defineCommand({
    meta: { name, description },
    subCommands
  }) as AnyCommand;
}

const architectureCommand = groupCommand("architecture", "Review and manage OpenNori Architecture Baselines.", {
  profiles: asCommand(architectureProfilesCommand),
  profile: withPolicy(asCommand(architectureProfileCommand), { commandResult: true }),
  requirement: withPolicy(asCommand(architectureRequirementCommand), { commandResult: true }),
  baseline: asCommand(architectureBaselineCommand),
  apply: asCommand(architectureApplyCommand),
  show: asCommand(architectureShowCommand),
  challenge: asCommand(architectureChallengeCommand),
  "build-vs-buy": asCommand(architectureBuildVsBuyCommand)
});

const criterionCommand = groupCommand("criterion", "Revise human-centered acceptance criteria.", {
  add: withPolicy(asCommand(criterionAddCommand), { activeGoal: true, activeGoalWrite: true, commandResult: true }),
  update: withPolicy(asCommand(criterionUpdateCommand), { activeGoal: true, activeGoalWrite: true, commandResult: true })
});

const profileCommand = groupCommand("profile", "Manage Project Profile execution preferences.", {
  add: withPolicy(asCommand(profileAddCommand), { activeGoalWrite: true }),
  evidence: withPolicy(asCommand(profileEvidenceCommand), { activeGoal: true, activeGoalWrite: true }),
  show: asCommand(profileShowCommand),
  check: withPolicy(asCommand(profileCheckCommand), { activeGoalWrite: true })
});

const evidenceCommand = groupCommand("evidence", "Record OpenNori acceptance evidence.", {
  add: withPolicy(asCommand(evidenceAddCommand), { activeGoal: true, activeGoalWrite: true }),
  prune: withPolicy(asCommand(evidencePruneCommand), { activeGoal: true, activeGoalWrite: true })
});

const pluginCommand = groupCommand("plugin", "Manage OpenNori Codex Plugin cache sync.", {
  sync: withPolicy(asCommand(pluginSyncCommand), { commandResult: true })
});

const contextCommand = groupCommand("context", "Export OpenNori context for review tools.", {
  export: withPolicy(asCommand(contextExportCommand), { activeGoal: true })
});

const activityCommand = groupCommand("activity", "Publish current OpenNori agent activity for the local dashboard.", {
  start: asCommand(activityStartCommand),
  heartbeat: asCommand(activityHeartbeatCommand),
  finish: asCommand(activityFinishCommand),
  show: asCommand(activityShowCommand)
});

export const rootCommand = defineCommand({
  meta: {
    name: CLI_NAME,
    description: "OpenNori acceptance-driven agent state CLI."
  },
  subCommands: {
    setup: withPolicy(asCommand(setupCommand), { commandResult: true }),
    bootstrap: asCommand(bootstrapCommand),
    doctor: asCommand(doctorCommand),
    list: asCommand(listCommand),
    install: withPolicy(asCommand(installCommand), { commandResult: true }),
    uninstall: withPolicy(asCommand(uninstallCommand), { commandResult: true }),
    upgrade: withPolicy(asCommand(upgradeCommand), { commandResult: true }),
    dashboard: withPolicy(asCommand(dashboardCommand), { commandResult: true }),
    mcp: asCommand(mcpCommand),
    plugin: pluginCommand,
    brainstorm: asCommand(brainstormCommand),
    discover: asCommand(discoverCommand),
    draft: withPolicy(asCommand(draftCommand), { commandResult: true }),
    init: withPolicy(asCommand(initCommand), { commandResult: true }),
    check: withPolicy(asCommand(checkCommand), { activeGoal: true, commandResult: true }),
    approve: withPolicy(asCommand(approveCommand), { activeGoal: true, activeGoalWrite: true }),
    resume: withPolicy(asCommand(resumeCommand), { activeGoal: true }),
    next: withPolicy(asCommand(nextCommand), { activeGoal: true }),
    evaluate: withPolicy(asCommand(evaluateCommand), { activeGoal: true, activeGoalWrite: true }),
    status: withPolicy(asCommand(statusCommand), { activeGoal: true }),
    report: withPolicy(asCommand(reportCommand), { activeGoal: true }),
    changes: asCommand(changesCommand),
    archive: withPolicy(asCommand(archiveCommand), { activeGoal: true, activeGoalWrite: true, commandResult: true }),
    architecture: architectureCommand,
    criterion: criterionCommand,
    profile: profileCommand,
    evidence: evidenceCommand,
    context: contextCommand,
    activity: activityCommand
  }
}) as AnyCommand;
