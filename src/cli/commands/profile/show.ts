import { defineCommand } from "citty";
import {
  currentGap,
  ok,
  profileCompliance
} from "../../../core.ts";
import { type ActiveGoalRuntime, runJsonCommand } from "../../runtime.ts";
import {
  goalArg,
  jsonArg,
  rootArg
} from "./shared.ts";

export const profileShowCommand = defineCommand({
  meta: {
    name: "show",
    description: "Show the Nori Profile attached to the active goal."
  },
  args: {
    root: rootArg,
    goal: goalArg,
    json: jsonArg
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

export async function runProfileShowCommand(rawArgs: string[], { loadPair }: ActiveGoalRuntime) {
  return runJsonCommand(profileShowCommand, rawArgs, { loadPair });
}
