import { defineCommand } from "citty";
import { currentGap, ok, profileCompliance, recomputeWorkflowStatus } from "../../core.js";
import { autoProfileChecks, recordAutoProfileChecks } from "../../lifecycle.js";
import { runJsonCommand } from "../runtime.js";

export const profileShowCommand = defineCommand({
  meta: {
    name: "show",
    description: "Show the Nori Profile attached to the active goal."
  },
  args: {
    root: {
      type: "string",
      description: "Project root.",
      default: process.cwd()
    },
    goal: {
      type: "string",
      description: "Active goal id to inspect."
    },
    json: {
      type: "boolean",
      description: "Keep deterministic JSON output for agents.",
      default: false
    }
  },
  run({ data }) {
    const { contract, ledger } = data.loadPair();
    return ok({
      goal_id: contract.goal_id,
      profile: ledger.capability_profile || { items: [], evidence: [] },
      compliance: profileCompliance(ledger),
      workflow_status: ledger.status,
      current_gap: currentGap(contract, ledger)
    });
  }
});

export async function runProfileShowCommand(rawArgs, { loadPair }) {
  return runJsonCommand(profileShowCommand, rawArgs, { loadPair });
}

export const profileCheckCommand = defineCommand({
  meta: {
    name: "check",
    description: "Check Nori Profile preferences against local project state."
  },
  args: {
    root: {
      type: "string",
      description: "Project root.",
      default: process.cwd()
    },
    goal: {
      type: "string",
      description: "Active goal id to inspect."
    },
    record: {
      type: "boolean",
      description: "Record automatic profile checks into the evidence ledger.",
      default: false
    },
    json: {
      type: "boolean",
      description: "Keep deterministic JSON output for agents.",
      default: false
    }
  },
  run({ args, data }) {
    const { contract, ledger, acceptancePath, evidencePath, root } = data.loadPair();
    const checks = autoProfileChecks(root, ledger);
    if (args.record) {
      recordAutoProfileChecks(ledger, checks);
      recomputeWorkflowStatus(contract, ledger);
      data.savePair(acceptancePath, evidencePath, contract, ledger);
      data.refreshManifest(root);
    }

    return ok({
      goal_id: contract.goal_id,
      recorded: args.record,
      checks,
      profile: ledger.capability_profile || { items: [], evidence: [] },
      compliance: profileCompliance(ledger),
      workflow_status: ledger.status,
      current_gap: currentGap(contract, ledger)
    });
  }
});

export async function runProfileCheckCommand(rawArgs, { loadPair, savePair, refreshManifest }) {
  return runJsonCommand(profileCheckCommand, rawArgs, { loadPair, savePair, refreshManifest });
}
