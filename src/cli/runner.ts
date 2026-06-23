import { runCommand } from "citty";
import { agentNextForDoctor } from "../agent-next.ts";
import { fail, ok } from "../core.ts";
import { doctor } from "../lifecycle.ts";
import type { JsonObject } from "../types/common.ts";
import { withActiveGoalWriteLock } from "./active-goal-lock.ts";
import { activeGoalRuntime, isActiveGoalLoadError } from "./active-goal-store.ts";
import { CLI_NAME } from "./registry.ts";
import type { ResolvedCliCommand } from "./command-types.ts";

function missingCurrentGoalStatus(error: { root: string; type: string; message: string }): JsonObject {
  const health = doctor(error.root);
  const agentNext = health.agent_next || agentNextForDoctor(error.root, health);
  const isHealthRecovery = health.status !== "ready";
  const nextActions = [
    agentNext.user_visible_next,
    ...(agentNext.commands || []),
    agentNext.safe_next_command
  ].filter(Boolean) as string[];
  return {
    status: isHealthRecovery ? "needs-action" : "no_current_goal",
    reason: error.type,
    message: error.message,
    root: error.root,
    current_goal: null,
    active_goals: health.active_goals,
    draft_goals: health.draft_goals,
    health: {
      status: health.status,
      recovery_actions: health.recovery_actions,
      failed_checks: health.checks
        .filter((check) => !check.ok)
        .map((check) => ({
          name: check.name,
          summary: check.summary,
          recovery: check.recovery,
          severity: check.severity
        }))
    },
    agent_next: agentNext,
    side_effect: "none",
    next_actions: nextActions
  };
}

export async function runCliCommand(resolved: Extract<ResolvedCliCommand, { ok: true }>): Promise<unknown> {
  const runtime = resolved.policy.activeGoal ? activeGoalRuntime() : {};
  const execute = async () => {
    const { result } = await runCommand(resolved.command, {
      rawArgs: resolved.rawArgs,
      data: {
        ...runtime,
        rawArgs: resolved.rawArgs
      }
    });
    return result;
  };
  try {
    return await (resolved.policy.activeGoalWrite
      ? withActiveGoalWriteLock(resolved.rawArgs, execute)
      : execute());
  } catch (error) {
    if (isActiveGoalLoadError(error) && (error.type === "no_current_goal" || error.type === "multiple_current_goals") && !resolved.policy.activeGoalWrite && !error.goal) {
      const data = missingCurrentGoalStatus(error);
      return ok(data, [], [], data.next_actions as string[]);
    }
    if (isActiveGoalLoadError(error)) {
      return fail(
        error.type,
        error.message,
        `Run ${CLI_NAME} doctor --root ${error.root} --json to inspect OpenNori state before retrying.`
      );
    }
    throw error;
  }
}
