import type { NoriActivity, NoriActivityInput } from "../types.ts";
import { publishActivityChange, publishActivityFinished } from "./activity-events.ts";
import { inferActivityTarget, resolveInputTarget } from "./activity-target.ts";
import { DEFAULT_ACTIVITY_TTL_MS, normalizeActivity, readActivity, saveActivity } from "./activity-store.ts";

type WriteActivityOptions = {
  mode?: "start" | "heartbeat";
};

export { ACTIVITY_SCHEMA_VERSION, activityPath, readActivity } from "./activity-store.ts";
export { inferActivityTarget } from "./activity-target.ts";

export function writeActivity(root: string, input: NoriActivityInput, options: WriteActivityOptions = {}): NoriActivity {
  const previous = readActivity(root) || undefined;
  const activity = normalizeActivity(resolveInputTarget(root, input, previous), previous);
  const mode = options.mode || (previous ? "heartbeat" : "start");
  saveActivity(root, activity);
  publishActivityChange(root, { previous, activity, mode });
  return activity;
}

export function finishActivity(root: string, input: Partial<NoriActivityInput> = {}): NoriActivity {
  const previous = readActivity(root) || undefined;
  const activity = normalizeActivity(resolveInputTarget(root, {
    ...input,
    state: input.state || "idle",
    summary: input.summary || "OpenNori agent activity finished.",
    ttl_ms: DEFAULT_ACTIVITY_TTL_MS
  }, previous), previous);
  saveActivity(root, activity);
  publishActivityFinished(root, { previous, activity });
  return activity;
}
