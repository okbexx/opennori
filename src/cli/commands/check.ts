import { defineCommand } from "citty";
import { fail, ok, validateContract } from "../../core.ts";
import { goalReviewState } from "../../lifecycle.ts";
import type { JsonObject } from "../../types/common.ts";
import { activeGoalArgs, type ActiveGoalRuntime, runJsonCommand } from "../runtime.ts";

export const checkCommand = defineCommand({
  meta: {
    name: "check",
    description: "Validate current OpenNori contract structure, architecture health, profile state, and evidence health."
  },
  args: {
    ...activeGoalArgs,
    json: {
      type: "boolean",
      description: "Keep deterministic JSON output for agents.",
      default: false
    }
  },
  run({ args, data }) {
    const { contract, ledger, root } = data.loadPair(args);
    const issues = validateContract(contract, ledger);
    if (issues.length > 0) {
      return { ...fail("invalid_acceptance", "Acceptance contract failed validation", "Fix reported issues before continuing"), issues };
    }
    const review = goalReviewState(root, contract, ledger);
    const acceptanceReview = review.acceptance_review;
    const projectProfile = review.profile;
    const warnings = acceptanceReview.findings.map((finding: JsonObject) => ({
      type: "acceptance_review",
      criterion_id: finding.criterion_id,
      gap_id: finding.gap_id,
      message: finding.question,
      agent_guidance: finding.agent_guidance,
      source: finding.source
    }));
    const nextActions = acceptanceReview.status === "needs-user-review"
      ? ["Use nori-acceptance to review unresolved acceptance ambiguity with the user, then revise criteria, record assumptions, or accept the review risk before claiming confident completion."]
      : [];
    const architecture = review.architecture;
    const architectureWarnings: JsonObject[] = [];
    if (architecture.requirement.status === "unknown") {
      architectureWarnings.push({
        type: "architecture_requirement",
        message: "Architecture requirement has not been decided for this goal.",
        recovery: "Use nori-architecture-brainstorm to decide required, not_required, or waived, then record the decision with opennori architecture requirement."
      });
    }
    if (architecture.requirement.status === "waived") {
      architectureWarnings.push({
        type: "architecture_requirement",
        message: `Architecture review was waived: ${architecture.requirement.reason}`,
        recovery: "Ask the user whether the remaining architecture review risk is acceptable, or revise the requirement to required/not_required with a reason."
      });
    }
    if (architecture.required_for_goal && architecture.decision === "missing") {
      architectureWarnings.push({
        type: "architecture",
        message: "This goal requires Architecture Baseline review, but no Architecture Baseline is recorded.",
        recovery: "Preview an Architecture Baseline, show it to the user, then rerun opennori architecture baseline --root <project> --goal <goal> --confirm --json after confirmation."
      });
    }
    if (architecture.required_for_goal && architecture.decision === "draft") {
      architectureWarnings.push({
        type: "architecture",
        message: "Architecture Baseline is still draft.",
        recovery: "Ask the user to confirm or revise the baseline before implementation."
      });
    }
    if (architecture.required_for_goal && architecture.decision === "invalid") {
      architectureWarnings.push({
        type: "architecture",
        message: "Architecture Baseline is invalid.",
        recovery: "Inspect .opennori/architecture/baseline.json, fix the reported issues, then rerun opennori check."
      });
    }
    if (architecture.required_for_goal && architecture.decision === "challenged") {
      architectureWarnings.push({
        type: "architecture",
        message: "Architecture Baseline has open challenges.",
        recovery: "Ask the user to resolve the Architecture Challenge before claiming architecture completion."
      });
    }
    if (!architecture.agent_surface.guide.installed || !architecture.agent_surface.guide.in_sync) {
      architectureWarnings.push({
        type: "architecture",
        message: ".opennori/agent-guide.md is missing or stale.",
        recovery: "Preview opennori install --root <project> --merge-agent-route --dry-run --json, then confirm the refresh if acceptable."
      });
    }
    if (architecture.evidence_health.status !== "clear") {
      for (const finding of architecture.evidence_health.findings) {
        architectureWarnings.push({
          type: "architecture_evidence",
          path: finding.path,
          issue: finding.issue,
          severity: finding.severity,
          message: finding.message,
          recovery: finding.recovery
        });
      }
    }
    const architectureStatus = architectureWarnings.length > 0 ? "needs-action" : "clear";
    const buildVsBuyWarnings = (architecture.required_for_goal || architecture.build_vs_buy_decisions.length > 0)
      ? architecture.build_vs_buy.findings.map((finding: JsonObject) => ({
      type: "build_vs_buy",
      decision_id: finding.decision_id,
      severity: finding.severity,
      issue: finding.issue,
      message: finding.message,
      recovery: finding.recovery
    }))
      : [];
    const health = review.evidence_health;
    const evidenceHealthWarnings = health.findings.map((finding: JsonObject) => ({
      type: "evidence_health",
      criterion_id: finding.criterion_id,
      severity: finding.severity,
      issue: finding.issue,
      message: finding.message,
      recovery: finding.recovery
    }));
    const profile = review.capability_compliance;
    const profileWarnings = profile.review.map((item: JsonObject) => ({
      type: "profile_review",
      item_id: item.id,
      strength: item.strength,
      status: item.status,
      message: `Project Profile item ${item.name} is ${item.status}.`,
      recovery: "Record profile evidence, waive the preference, or ask the user whether the remaining profile risk is acceptable."
    }));
    const combinedWarnings = [...warnings, ...architectureWarnings, ...buildVsBuyWarnings, ...evidenceHealthWarnings, ...profileWarnings];
    if (architecture.requirement.status === "unknown") {
      nextActions.push("Record an architecture requirement decision before implementation: required, not_required, or waived with a reason.");
    } else if (architectureStatus === "needs-action") {
      nextActions.push("Resolve architecture_check warnings before treating this goal as architecture-complete.");
    }
    if (buildVsBuyWarnings.length > 0) {
      nextActions.push("Resolve build_vs_buy warnings before treating custom infrastructure as mature.");
    }
    if (architecture.evidence_health.status !== "clear") {
      nextActions.push("Clean invalid architecture evidence files before treating architecture state as recoverable.");
    }
    if (health.status !== "clear") {
      nextActions.push("Review evidence_health warnings before treating this goal as confidently complete.");
    }
    if (profile.review.length > 0) {
      nextActions.push("Review profile_review warnings before treating this goal as confidently complete.");
    }
    return ok({
      goal_id: contract.goal_id,
      presentation: contract.presentation,
      workflow_status: ledger.status,
      current_gap: review.current_gap,
      statuses: Object.fromEntries(Object.entries(ledger.criteria).map(([id, state]) => [id, (state as any).status])),
      acceptance_review: acceptanceReview,
      capability_profile: projectProfile,
      capability_compliance: profile,
      architecture_check: {
        status: architectureStatus,
        decision: architecture.decision,
        warnings: architectureWarnings,
        architecture
      },
      evidence_health: health,
      next_recommendation: review.next_recommendation,
      agent_next: review.agent_next
    }, [], combinedWarnings, nextActions);
  }
});

export async function runCheckCommand(rawArgs: string[], { loadPair }: ActiveGoalRuntime) {
  return runJsonCommand(checkCommand, rawArgs, { loadPair });
}
