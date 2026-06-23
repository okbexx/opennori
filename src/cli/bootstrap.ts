import { bootstrapResult, runBootstrapCommand } from "./commands/bootstrap.ts";
import { parseArgs } from "citty";
import { printHumanResult } from "./human-output.ts";

type JsonPrinter = (payload: unknown) => void;

type BootstrapPayload = {
  data: {
    root: string;
    status: string;
  };
};

type BootstrapOptions = {
  stdin?: NodeJS.ReadStream;
  stdout?: NodeJS.WriteStream;
  printJson?: JsonPrinter;
};

type BootstrapCliArgs = {
  root: string;
  confirm: boolean;
  json: boolean;
};

function printText(stdout: NodeJS.WriteStream, line = ""): void {
  stdout.write(`${line}\n`);
}

function printBootstrapHuman(stdout: NodeJS.WriteStream, payload: BootstrapPayload): void {
  printText(stdout, "");
  printHumanResult(payload as never, { commandPath: ["bootstrap"], stdout });
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

function isInteractive(args: string[], stdin: NodeJS.ReadStream, stdout: NodeJS.WriteStream): boolean {
  return !parseBootstrapArgs(args[0] === "bootstrap" ? args.slice(1) : args).json && stdin.isTTY && stdout.isTTY;
}

function asBootstrapPayload(payload: unknown): BootstrapPayload {
  return payload as BootstrapPayload;
}

function parseBootstrapArgs(rawArgs: string[]): BootstrapCliArgs {
  const args = parseArgs(rawArgs, {
    root: {
      type: "string",
      default: process.cwd()
    },
    confirm: {
      type: "boolean",
      default: false
    },
    json: {
      type: "boolean",
      default: false
    }
  }) as unknown as BootstrapCliArgs;
  return args;
}

export async function runBootstrap(args: string[], { stdin = process.stdin, stdout = process.stdout, printJson }: BootstrapOptions = {}): Promise<void> {
  const writeJson = printJson || ((payload) => stdout.write(`${JSON.stringify(payload, null, 2)}\n`));
  const bootstrapArgs = args[0] === "bootstrap" ? args.slice(1) : args;
  const parsed = parseBootstrapArgs(bootstrapArgs);

  if (!isInteractive(args, stdin, stdout)) {
    writeJson(await runBootstrapCommand(bootstrapArgs));
    return;
  }

  if (parsed.confirm) {
    printBootstrapHuman(stdout, asBootstrapPayload(bootstrapResult({ root: parsed.root, confirmed: true })));
    return;
  }

  const preview = asBootstrapPayload(bootstrapResult({ root: parsed.root, confirmed: false }));
  printBootstrapHuman(stdout, preview);
  if (preview.data.status === "ready") return;

  const shouldInstall = await promptConfirm(stdin, stdout, "Install OpenNori here?");
  if (!shouldInstall) {
    printText(stdout, "");
    printText(stdout, "No changes made.");
    return;
  }

  printBootstrapHuman(stdout, asBootstrapPayload(bootstrapResult({ root: preview.data.root, confirmed: true })));
}
