#!/usr/bin/env node

import { runCommand, runMain } from "citty";
import { rootCommand } from "../src/cli.ts";

const rawArgs = process.argv.slice(2);
const delimiter = rawArgs.indexOf("--");
const route = delimiter < 0 ? rawArgs : rawArgs.slice(0, delimiter);
const evidenceRun = route.some(
  (entry, index) => entry === "task" && route[index + 1] === "evidence" && route[index + 2] === "run"
);
const childHelp = delimiter >= 0 && rawArgs.slice(delimiter + 1).some((argument) => argument === "--help" || argument === "-h");

if (evidenceRun && childHelp) {
  try {
    await runCommand(rootCommand, { rawArgs });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (route.includes("--json")) {
      process.stderr.write(`${JSON.stringify({ ok: false, error: { code: "invalid_cli_arguments", message } }, null, 2)}\n`);
    } else {
      process.stderr.write(`OpenNori: ${message}\n`);
    }
    process.exitCode = 1;
  }
} else {
  await runMain(rootCommand, { rawArgs });
}
