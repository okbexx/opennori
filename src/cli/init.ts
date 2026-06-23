import { parseArgs } from "citty";
import { bootstrapResult, runBootstrapCommand } from "./commands/bootstrap.ts";
import { printHumanResult } from "./human-output.ts";

type JsonPrinter = (payload: unknown) => void;

type InitPayload = {
  data: {
    root: string;
    status: string;
  };
};

type InitOptions = {
  stdin?: NodeJS.ReadStream;
  stdout?: NodeJS.WriteStream;
  printJson?: JsonPrinter;
};

type InitCliArgs = {
  root: string;
  confirm: boolean;
  json: boolean;
};

function printText(stdout: NodeJS.WriteStream, line = ""): void {
  stdout.write(`${line}\n`);
}

function parseInitArgs(rawArgs: string[]): InitCliArgs {
  return parseArgs(rawArgs, {
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
  }) as unknown as InitCliArgs;
}

function isInteractive(args: string[], stdin: NodeJS.ReadStream, stdout: NodeJS.WriteStream): boolean {
  return !parseInitArgs(args[0] === "init" ? args.slice(1) : args).json && stdin.isTTY && stdout.isTTY;
}

function asInitPayload(payload: unknown): InitPayload {
  return payload as InitPayload;
}

function printInitHuman(stdout: NodeJS.WriteStream, payload: InitPayload): void {
  printText(stdout, "");
  printHumanResult(payload as never, { commandPath: ["init"], stdout });
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

export async function runInit(args: string[], { stdin = process.stdin, stdout = process.stdout, printJson }: InitOptions = {}): Promise<void> {
  const writeJson = printJson || ((payload) => stdout.write(`${JSON.stringify(payload, null, 2)}\n`));
  const initArgs = args[0] === "init" ? args.slice(1) : args;
  const parsed = parseInitArgs(initArgs);

  if (!isInteractive(args, stdin, stdout)) {
    writeJson(await runBootstrapCommand(initArgs));
    return;
  }

  if (parsed.confirm) {
    printInitHuman(stdout, asInitPayload(bootstrapResult({ root: parsed.root, confirmed: true })));
    return;
  }

  const preview = asInitPayload(bootstrapResult({ root: parsed.root, confirmed: false }));
  printInitHuman(stdout, preview);
  if (preview.data.status === "ready") return;

  const shouldInit = await promptConfirm(stdin, stdout, "Initialize OpenNori project state?");
  if (!shouldInit) {
    printText(stdout, "");
    printText(stdout, "No changes made.");
    return;
  }

  printInitHuman(stdout, asInitPayload(bootstrapResult({ root: preview.data.root, confirmed: true })));
}
