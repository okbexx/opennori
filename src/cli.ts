import { fail, ok } from "./core.ts";
import { runBootstrap } from "./cli/bootstrap.ts";
import { CLI_NAME, commandLabelFor, helpTextFor, resolveCliCommand, runCliCommand, usageFor } from "./cli/command-tree.ts";
import { printHumanResult, shouldPrintHuman } from "./cli/human-output.ts";
import { runInit } from "./cli/init.ts";
import { runSetup } from "./cli/setup.ts";
import { PACKAGE_JSON } from "./lifecycle/shared.ts";
import { mcpResourceSummary } from "./mcp/resources.ts";

type CommandPayload = {
  ok?: boolean;
};

type JsonPrinter = (payload: unknown) => void;

function printJson(payload: unknown): void {
  console.log(JSON.stringify(payload, null, 2));
}

function printCommandResult(payload: CommandPayload): void {
  printJson(payload);
  if (!payload.ok) process.exitCode = 1;
}

function printPayload(payload: CommandPayload): void {
  printJson(payload);
  if (!payload.ok) process.exitCode = 1;
}

function wantsHelp(args: string[]): boolean {
  return args.includes("--help") || args.includes("-h");
}

function wantsJson(args: string[]): boolean {
  return args.includes("--json");
}

function optionValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  return value && !value.startsWith("-") ? value : undefined;
}

export async function main(args: string[]): Promise<void> {
  const command = args[0];
  if (command === "--help" || command === "-h") {
    if (wantsJson(args)) printJson(ok({ usage: await usageFor([]), side_effect: "none" }));
    else console.log(await helpTextFor(args));
    return;
  }

  if (!command) {
    await runSetup(["setup"], { printJson } as { printJson: JsonPrinter });
    return;
  }

  if (wantsHelp(args)) {
    if (wantsJson(args)) printJson(ok({ command: await commandLabelFor(args), usage: await usageFor(args), side_effect: "none" }));
    else console.log(await helpTextFor(args));
    return;
  }

  if (command === "setup") {
    await runSetup(args, { printJson } as { printJson: JsonPrinter });
    return;
  }

  if (command === "init") {
    await runInit(args, { printJson } as { printJson: JsonPrinter });
    return;
  }

  if (command === "bootstrap") {
    await runBootstrap(args, { printJson } as { printJson: JsonPrinter });
    return;
  }

  if (command === "mcp") {
    const root = optionValue(args, "--root") || process.cwd();
    if (wantsJson(args)) {
      printJson(ok({
        ...mcpResourceSummary(root),
        command: "opennori mcp",
        transport: "stdio",
        version: String(PACKAGE_JSON.version),
        focused_goal_id: optionValue(args, "--goal") || null
      }));
      return;
    }
    const { serveOpenNoriMcpStdio } = await import("./mcp/server.ts");
    await serveOpenNoriMcpStdio({
      root,
      goalId: optionValue(args, "--goal"),
      version: String(PACKAGE_JSON.version)
    });
    return;
  }

  const resolved = await resolveCliCommand(args);
  if (!resolved.ok) {
    printJson(fail("unknown_command", resolved.message, `Run ${CLI_NAME} --help to inspect available commands.`));
    process.exitCode = 2;
    return;
  }

  const payload = await runCliCommand(resolved);
  if (shouldPrintHuman(args) && printHumanResult(payload as any, { commandPath: resolved.path })) {
    if (!(payload as CommandPayload).ok) process.exitCode = 1;
    return;
  }
  if (resolved.policy.commandResult) printCommandResult(payload as CommandPayload);
  else printPayload(payload as CommandPayload);
}
