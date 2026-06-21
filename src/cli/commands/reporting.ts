import fs from "node:fs";
import path from "node:path";
import { defineCommand } from "citty";
import { reviewAcceptanceQuality } from "../../acceptance.ts";
import { agentNextForRecommendation } from "../../agent-next.ts";
import { appendEvent, completionAnswer, currentGap, evidenceHealth, fail, interventionForProfile, nextRecommendation, ok, pathsForGoal, readProjectProfile, refreshSnapshot, recomputeWorkflowStatus } from "../../core.ts";
import { architectureState, renderReportWithArchitecture } from "../../architecture.ts";
import { refreshManifest } from "../../lifecycle.ts";
import { activeGoalArgs, type ActiveGoalRuntime, runJsonCommand, savePair } from "../runtime.ts";

type CommandRuntimeOverride = Pick<ActiveGoalRuntime, "loadPair"> & Partial<Pick<ActiveGoalRuntime, "savePair" | "refreshManifest">>;

export const reportCommand = defineCommand({
  meta: {
    name: "report",
    description: "Render a human-readable OpenNori acceptance report for the current goal."
  },
  args: {
    ...activeGoalArgs,
    output: {
      type: "string",
      description: "Report output path."
    },
    json: {
      type: "boolean",
      description: "Keep deterministic JSON output for agents.",
      default: false
    }
  },
  run({ args, data }) {
    const { contract, ledger, root } = data.loadPair(args);
    const architecture = architectureState(root, contract.goal_id);
    const profile = readProjectProfile(root);
    const output = path.resolve(args.output || pathsForGoal(root, contract.goal_id).reportPath);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, renderReportWithArchitecture(root, contract, ledger));
    refreshManifest(root);
    const gap = currentGap(contract, ledger, profile);
    const recommendation = nextRecommendation(contract, ledger, { root, architecture, profile });
    appendEvent(root, {
      type: "report.generated",
      goal_id: contract.goal_id,
      gap_id: gap?.id,
      actor: { kind: "agent", name: "Agent", skill: "nori-reporting" },
      summary: `Generated OpenNori report for ${contract.goal_id}.`,
      data: { report_path: output, workflow_status: ledger.status }
    });
    refreshSnapshot(root, { goalId: contract.goal_id });
    return ok(
      {
        goal_id: contract.goal_id,
        presentation: contract.presentation,
        report_path: output,
        workflow_status: ledger.status,
        current_gap: gap,
        completion: completionAnswer(contract, ledger, { root, architecture, profile }),
        intervention: interventionForProfile(contract, ledger, profile),
        acceptance_review: reviewAcceptanceQuality(contract),
        evidence_health: evidenceHealth(contract, ledger, { root }),
        architecture,
        next_recommendation: recommendation,
        agent_next: agentNextForRecommendation(contract.goal_id, gap, recommendation)
      },
      [{ kind: "acceptance_report", path: output }],
      [],
      recommendation.actions
    );
  }
});

export async function runReportCommand(rawArgs: string[], { loadPair }: Pick<ActiveGoalRuntime, "loadPair">) {
  return runJsonCommand(reportCommand, rawArgs, { loadPair });
}

export const archiveCommand = defineCommand({
  meta: {
    name: "archive",
    description: "Move a complete or blocked OpenNori goal out of current work and preserve its report."
  },
  args: {
    ...activeGoalArgs,
    force: {
      type: "boolean",
      description: "Allow overwriting an existing archive target.",
      default: false
    },
    json: {
      type: "boolean",
      description: "Keep deterministic JSON output for agents.",
      default: false
    }
  },
  run({ args, data }) {
    const root = path.resolve(String(args.root || process.cwd()));
    const { contract, ledger, acceptancePath, evidencePath, goalDir } = data.loadPair(args);
    const profile = readProjectProfile(root);
    recomputeWorkflowStatus(contract, ledger, profile);
    if (ledger.status !== "complete" && ledger.status !== "blocked") {
      return fail("not_archivable", `Goal ${contract.goal_id} is ${ledger.status}`, "Only complete or blocked OpenNori goals can be archived.");
    }

    const archiveDir = ledger.status === "complete" ? "completed" : "blocked";
    const targetGoalDir = path.join(root, ".opennori", archiveDir, contract.goal_id);
    const reportPath = pathsForGoal(root, contract.goal_id).reportPath;
    if (fs.existsSync(targetGoalDir) && !args.force) {
      return fail("archive_target_exists", `Archive target exists: ${path.relative(root, targetGoalDir) || "."}`, "Pass --force or move the existing archive directory.");
    }

    data.savePair(acceptancePath, evidencePath, contract, ledger);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, renderReportWithArchitecture(root, contract, ledger));
    fs.mkdirSync(path.dirname(targetGoalDir), { recursive: true });
    if (fs.existsSync(targetGoalDir) && args.force) fs.rmSync(targetGoalDir, { recursive: true, force: true });
    fs.renameSync(goalDir, targetGoalDir);
    refreshManifest(root);
    return ok(
      {
        goal_id: contract.goal_id,
        archived_as: archiveDir,
        goal_path: targetGoalDir,
        acceptance_path: path.join(targetGoalDir, "README.md"),
        evidence_path: path.join(targetGoalDir, "ledger.json"),
        report_path: reportPath
      },
      [
        { kind: "archived_goal_dossier", path: targetGoalDir },
        { kind: "acceptance_report", path: reportPath }
      ]
    );
  }
});

export async function runArchiveCommand(rawArgs: string[], runtime: CommandRuntimeOverride) {
  return runJsonCommand(archiveCommand, rawArgs, { savePair, refreshManifest, ...runtime });
}
