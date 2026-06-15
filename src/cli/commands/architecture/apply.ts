import { defineCommand } from "citty";
import {
  architectureState,
  buildArchitectureApplyRecord,
  readArchitectureBaseline,
  writeArchitectureApplyRecord
} from "../../../architecture.ts";
import { ok, slugify } from "../../../core.ts";
import { refreshManifest } from "../../../lifecycle.ts";
import { runJsonCommand } from "../../runtime.ts";
import { jsonArg, resolveRoot, rootArg } from "./shared.ts";

export const architectureApplyCommand = defineCommand({
  meta: {
    name: "apply",
    description: "Record architecture alignment for the current acceptance gap."
  },
  args: {
    root: rootArg,
    id: {
      type: "string",
      description: "Optional stable apply record id."
    },
    goal: {
      type: "string",
      description: "Active goal id."
    },
    criterion: {
      type: "string",
      description: "Acceptance criterion id."
    },
    status: {
      type: "string",
      description: "aligned, needs-challenge, or waived.",
      default: "aligned"
    },
    summary: {
      type: "string",
      description: "Human-readable architecture alignment summary."
    },
    fit: {
      type: "string",
      description: "How the intended work fits the baseline."
    },
    implementationFocus: {
      type: "string",
      description: "Current acceptance-gap implementation focus."
    },
    evidence: {
      type: "string",
      description: "Reviewable source or observation used for the architecture fit."
    },
    limitations: {
      type: "string",
      description: "Known limitations of this architecture alignment record.",
      default: ""
    },
    json: jsonArg
  },
  run({ args }) {
    const root = resolveRoot(args.root);
    const baseline = readArchitectureBaseline(root);
    if (!baseline || baseline.status !== "active") {
      throw new Error("Active Architecture Baseline is required before architecture apply.");
    }
    const goalId = String(args.goal || baseline.goal_id || "").trim();
    const criterionId = String(args.criterion || "").trim();
    const summary = String(args.summary || "").trim();
    const fit = String(args.fit || "").trim();
    const implementationFocus = String(args.implementationFocus || "").trim();
    if (!goalId) throw new Error("--goal is required");
    if (!criterionId) throw new Error("--criterion is required");
    if (!summary) throw new Error("--summary is required");
    if (!fit) throw new Error("--fit is required");
    if (!implementationFocus) throw new Error("--implementation-focus is required");

    const id = String(args.id || slugify(`${goalId}-${criterionId}-${args.status || "aligned"}`.slice(0, 80)));
    const record = buildArchitectureApplyRecord({
      id,
      goal_id: goalId,
      criterion_id: criterionId,
      status: String(args.status || "aligned"),
      baseline: {
        profile: baseline.profile,
        profile_title: baseline.profile_title,
        accepted_at: baseline.accepted_at
      },
      summary,
      fit,
      implementation_focus: implementationFocus,
      evidence: String(args.evidence || "").trim(),
      limitations: String(args.limitations || "").trim()
    });
    const paths = writeArchitectureApplyRecord(root, record);
    refreshManifest(root);
    return ok(
      {
        root,
        apply_record: record,
        apply_path: paths.jsonPath,
        markdown_path: paths.markdownPath,
        architecture: architectureState(root, goalId),
        side_effect: "write"
      },
      [
        { kind: "architecture_apply", path: paths.jsonPath },
        { kind: "architecture_apply_markdown", path: paths.markdownPath }
      ],
      record.status === "needs-challenge"
        ? [{ type: "architecture", message: "Architecture apply record indicates a challenge is needed before implementation continues." }]
        : [],
      record.status === "needs-challenge"
        ? ["Create an Architecture Challenge before implementation continues."]
        : [`Record Product AC evidence for ${criterionId} with this architecture apply record as context.`]
    );
  }
});

export async function runArchitectureApplyCommand(rawArgs: string[]) {
  return runJsonCommand(architectureApplyCommand, rawArgs);
}
