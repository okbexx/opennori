import { parseArgs } from "citty";
import { runSetupCommand, setupResult } from "./commands/setup.ts";
import type { SetupCommandRunner } from "../lifecycle/setup.ts";
import { printHumanResult } from "./human-output.ts";

type JsonPrinter = (payload: unknown) => void;

type SetupPayload = {
  ok: boolean;
  data?: {
    root: string;
  };
  error?: {
    type: string;
    message: string;
    fix?: string;
  };
};

type SetupOptions = {
  stdin?: NodeJS.ReadStream;
  stdout?: NodeJS.WriteStream;
  printJson?: JsonPrinter;
  runner?: SetupCommandRunner;
};

type SetupCliArgs = {
  root: string;
  confirm: boolean;
  dryRun: boolean;
  json: boolean;
};

function printText(stdout: NodeJS.WriteStream, line = ""): void {
  stdout.write(`${line}\n`);
}

function parseSetupArgs(rawArgs: string[]): SetupCliArgs {
  return parseArgs(rawArgs, {
    root: {
      type: "string",
      default: process.cwd()
    },
    confirm: {
      type: "boolean",
      default: false
    },
    dryRun: {
      type: "boolean",
      default: false
    },
    json: {
      type: "boolean",
      default: false
    }
  }) as unknown as SetupCliArgs;
}

function asSetupPayload(payload: unknown): SetupPayload {
  return payload as SetupPayload;
}

function isInteractive(args: string[], stdin: NodeJS.ReadStream, stdout: NodeJS.WriteStream): boolean {
  return !parseSetupArgs(args[0] === "setup" ? args.slice(1) : args).json && stdin.isTTY && stdout.isTTY;
}

async function promptConfirm(stdin: NodeJS.ReadStream, stdout: NodeJS.WriteStream, message: string): Promise<boolean> {
  stdout.write(`${message} [y/N] `);
  return new Promise((resolve) => {
    stdin.setEncoding("utf8");
    stdin.once("data", (chunk) => {
      stdin.pause();
      resolve(/^y(es)?$/i.test(String(chunk).trim()));
    });
  });
}

function printSetupHuman(stdout: NodeJS.WriteStream, payload: SetupPayload): void {
  printText(stdout, "");
  printHumanResult(payload as never, { commandPath: ["setup"], stdout });
}

export async function runSetup(args: string[], { stdin = process.stdin, stdout = process.stdout, printJson, runner }: SetupOptions = {}): Promise<void> {
  const writeJson = printJson || ((payload) => stdout.write(`${JSON.stringify(payload, null, 2)}\n`));
  const setupArgs = args[0] === "setup" ? args.slice(1) : args;
  const parsed = parseSetupArgs(setupArgs);

  if (!isInteractive(args, stdin, stdout)) {
    writeJson(await runSetupCommand(setupArgs, { runner }));
    return;
  }

  if (parsed.confirm) {
    printSetupHuman(stdout, asSetupPayload(setupResult({ root: parsed.root, dryRun: false, confirmed: true, runner })));
    return;
  }

  const preview = asSetupPayload(setupResult({ root: parsed.root, dryRun: true, confirmed: false, runner }));
  printSetupHuman(stdout, preview);
  if (!preview.ok || !preview.data) return;

  const shouldInstall = await promptConfirm(stdin, stdout, "Install OpenNori capability bundle?");
  if (!shouldInstall) {
    printText(stdout, "");
    printText(stdout, "No changes made.");
    return;
  }

  printSetupHuman(stdout, asSetupPayload(setupResult({ root: preview.data.root, dryRun: false, confirmed: true, runner })));
}
