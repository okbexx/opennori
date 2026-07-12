import { defineCommand } from "citty";
import { currentProductVersion } from "./project.ts";
import { historyCommand } from "./cli/history-command.ts";
import { platformCommand } from "./cli/platform-command.ts";
import { doctorCommand, initCommand, setupCommand, uninstallCommand, updateCommand } from "./cli/project-commands.ts";
import { statusCommand } from "./cli/status-command.ts";
import { taskCommand } from "./cli/task-command.ts";

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
    platform: platformCommand,
    task: taskCommand,
    update: updateCommand,
    uninstall: uninstallCommand
  }
});
