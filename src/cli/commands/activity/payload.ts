import {
  fail,
  finishActivity,
  readActivity,
  refreshSnapshot,
  writeActivity
} from "../../../core.ts";
import { activityResponse } from "./response.ts";
import {
  type ActivityAction,
  finishActivityInput,
  targetForAction,
  targetFromActivity,
  writeActivityInput
} from "./input.ts";

export function activityPayload(root: string, args: Record<string, any>, action: ActivityAction) {
  try {
    const previous = readActivity(root);
    const target = targetForAction(root, args, action, previous);
    const activity = action === "finish"
      ? finishActivity(root, finishActivityInput(args, target))
      : writeActivity(root, writeActivityInput(args, target), { mode: action });
    const snapshot = refreshSnapshot(root, { goalId: activity.goal_id });
    return activityResponse(root, activity, target, snapshot);
  } catch (error) {
    return fail(
      "ambiguous_activity_target",
      error instanceof Error ? error.message : String(error),
      "Recover .opennori/current so exactly one current Nori Contract exists before publishing dashboard activity."
    );
  }
}

export function activityShowPayload(root: string) {
  const activity = readActivity(root);
  const snapshot = refreshSnapshot(root, { goalId: activity?.goal_id });
  return activityResponse(root, activity, targetFromActivity(activity), snapshot);
}
