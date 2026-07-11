import { defineCommand } from "citty";
import { runCliAction } from "../cli-output.ts";
import { loadContract } from "../contract.ts";
import { asOpenNoriError, OpenNoriError } from "../errors.ts";
import { appendEvidence, type EvidenceInput, runCommandEvidence } from "../evidence.ts";
import { ROOT_ARGS, readProjectInput, readyProjectRoot, requireTaskLocation } from "./common.ts";

function readEvidenceInput(root: string, taskId: string, relativePath: string): EvidenceInput {
  try {
    return readProjectInput<EvidenceInput>(root, relativePath);
  } catch (error) {
    const failure = asOpenNoriError(error);
    if (failure.code !== "unsafe_path") throw error;
    throw new OpenNoriError("unsafe_path", failure.message, {
      context: { path: relativePath, task_id: taskId },
      recovery: `Store the JSON under .opennori/tasks/${taskId}/research/evidence-inputs/ and pass its project-relative path.`
    });
  }
}

function evidenceCommandArguments(rawArgs: readonly string[]): string[] {
  const delimiter = rawArgs.indexOf("--");
  if (delimiter < 0 || delimiter === rawArgs.length - 1) {
    throw new OpenNoriError("evidence_command_missing", "Evidence command must follow a double dash delimiter.", {
      recovery: "Run: opennori task evidence run <task> --outcome <id> --summary <text> -- <executable> [args...]"
    });
  }
  return rawArgs.slice(delimiter + 1);
}

function evidenceTimeoutMs(value: string): number {
  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds) || seconds < 1 || seconds > 3600) {
    throw new OpenNoriError("evidence_timeout_invalid", "Evidence command timeout must be an integer from 1 to 3600 seconds.");
  }
  return seconds * 1000;
}

const evidenceAddCommand = defineCommand({
  meta: { name: "add", description: "Append one evidence fact from project-local JSON" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    input: { type: "string", description: "Project-relative evidence input JSON", required: true, valueHint: "file" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const location = requireTaskLocation(root, args.task);
        const contract = loadContract(location.directory, args.task);
        return appendEvidence(root, location.directory, location.task, contract, readEvidenceInput(root, args.task, args.input));
      },
      (evidence) => `Recorded ${evidence.result} Evidence for ${evidence.outcome_id}.`
    );
  }
});

const evidenceRunCommand = defineCommand({
  meta: { name: "run", description: "Execute a command without a shell and append its observed Evidence" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    outcome: { type: "string", description: "Outcome id", required: true, valueHint: "id" },
    summary: { type: "string", description: "Observed result summary", required: true, valueHint: "text" },
    cwd: { type: "string", description: "Project-relative command directory", default: ".", valueHint: "path" },
    timeout: { type: "string", description: "Command timeout in seconds", default: "600", valueHint: "seconds" }
  },
  async run({ args, rawArgs }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const location = requireTaskLocation(root, args.task);
        const contract = loadContract(location.directory, args.task);
        const commandArgv = evidenceCommandArguments(rawArgs);
        const command = commandArgv[0];
        if (!command) throw new OpenNoriError("evidence_command_missing", "Evidence executable is required after --.");
        return runCommandEvidence(root, location.directory, location.task, contract, {
          outcome_id: args.outcome,
          summary: args.summary,
          command,
          args: commandArgv.slice(1),
          cwd: args.cwd,
          timeout_ms: evidenceTimeoutMs(args.timeout)
        });
      },
      (evidence) =>
        `Recorded ${evidence.result} Evidence for ${evidence.outcome_id}; command exited ${evidence.sources[0]?.type === "command" ? evidence.sources[0].exit_code : "unknown"}.`
    );
  }
});

export const evidenceCommand = defineCommand({
  meta: { name: "evidence", description: "Append Outcome Evidence" },
  subCommands: { add: evidenceAddCommand, run: evidenceRunCommand }
});
