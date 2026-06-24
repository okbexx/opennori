import path from "node:path";
import type { JsonObject } from "../types/common.ts";
import type { LifecyclePlanAction } from "../types/lifecycle-plans.ts";
import type { NoriResult } from "../types/result.ts";

type OutputCommand =
  | "setup"
  | "init"
  | "bootstrap"
  | "install"
  | "uninstall"
  | "upgrade"
  | "plugin"
  | "doctor"
  | "check"
  | "status"
  | "report"
  | "dashboard"
  | "activity"
  | string;

type HumanOutputOptions = {
  commandPath: string[];
  stdout?: NodeJS.WriteStream;
};

function line(stdout: NodeJS.WriteStream, value = ""): void {
  stdout.write(`${value}\n`);
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" ? value as JsonObject : {};
}

function relative(root: unknown, filePath: unknown): string {
  if (typeof filePath !== "string") return String(filePath || "");
  if (typeof root !== "string" || !path.isAbsolute(filePath)) return filePath;
  return path.relative(root, filePath) || ".";
}

function summarizeActions(actions: unknown): string {
  if (!Array.isArray(actions)) return "none";
  const counts = new Map<string, number>();
  for (const action of actions) {
    const key = String(asObject(action).action || "unknown");
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].map(([key, count]) => `${key}: ${count}`).join(", ") || "none";
}

function changedActionPaths(actions: unknown, root: unknown, limit = 6): string[] {
  if (!Array.isArray(actions)) return [];
  return actions
    .map(asObject)
    .filter((action) => action.would_write || action.will_write || ["applied", "failed"].includes(String(action.action)))
    .slice(0, limit)
    .map((action) => `${relative(root, action.path || action.command_display)} (${action.action})`);
}

function printFailure(stdout: NodeJS.WriteStream, payload: NoriResult, title = "OpenNori command failed."): void {
  if (payload.ok) return;
  line(stdout, title);
  line(stdout, `Problem: ${payload.error.message}`);
  if (payload.error.fix) line(stdout, `Recovery: ${payload.error.fix}`);
}

function printPlanSummary(stdout: NodeJS.WriteStream, title: string, data: JsonObject, planKey: string): void {
  const plan = asObject(data[planKey]);
  const summary = asObject(plan.summary);
  const root = data.root || plan.root;
  line(stdout, title);
  line(stdout, `Project: ${root || "."}`);
  line(stdout, `Mode: ${plan.dry_run ? "preview" : "confirmed"}`);
  line(stdout, `Actions: ${summarizeActions(plan.actions)}`);
  line(stdout, `Writes: ${summary.will_write ?? 0} now, ${summary.would_write ?? 0} planned`);
  line(stdout, `Destructive: ${Number(summary.destructive || 0) > 0 ? "yes" : "no"}`);
  const paths = changedActionPaths(plan.actions, root);
  if (paths.length > 0) {
    line(stdout, "Changed:");
    for (const item of paths) line(stdout, `- ${item}`);
  }
}

function printExternalActionDetails(stdout: NodeJS.WriteStream, actions: unknown, root: unknown, limit = 6): void {
  if (!Array.isArray(actions)) return;
  const visible = actions
    .map(asObject)
    .filter((action) => action.action !== "exists" || action.reason)
    .slice(0, limit);
  if (visible.length === 0) return;
  line(stdout, "Actions:");
  for (const action of visible) {
    const status = action.action === "unavailable"
      ? "unavailable"
      : action.action === "failed"
        ? "failed"
        : action.action === "applied"
          ? "done"
          : action.action === "exists"
            ? "ready"
            : action.will_write
              ? "run"
              : "preview";
    const target = relative(root, action.path || action.command_display || action.kind);
    line(stdout, `- ${status}: ${action.reason || target}${target && action.reason ? ` (${target})` : ""}`);
  }
}

function printSetup(stdout: NodeJS.WriteStream, data: JsonObject): void {
  const plan = asObject(data.setup_plan);
  const summary = asObject(plan.summary);
  const confirmed = Boolean(data.confirmed);
  const title = data.status === "ready"
    ? "OpenNori setup complete."
    : data.status === "needs-action"
      ? "OpenNori setup needs action."
      : "OpenNori setup preview.";
  line(stdout, title);
  line(stdout, `Project: ${data.root || plan.root || "."}`);
  line(stdout, `Mode: ${plan.dry_run ? "preview" : confirmed ? "confirmed" : "preview"}`);
  line(stdout, "Bundle: Codex Plugin, packaged Skills, global opennori CLI, project .opennori state, doctor.");
  line(stdout, `Writes: ${summary.will_write ?? 0} now, ${summary.would_write ?? 0} planned`);
  if (Number(summary.unavailable || 0) > 0) line(stdout, `Unavailable: ${summary.unavailable}`);
  printExternalActionDetails(stdout, plan.actions, data.root || plan.root);
  if (data.next) line(stdout, `Next: ${data.next}`);
}

function printProjectBootstrap(stdout: NodeJS.WriteStream, data: JsonObject, command: string): void {
  const plan = asObject(data.install_plan);
  const summary = asObject(plan.summary);
  const doctor = asObject(data.doctor);
  const currentGoal = data.current_goal || doctor.current_goal;
  const label = command === "init" ? "project init" : "project setup";
  const title = data.status === "ready"
    ? "OpenNori project state is ready."
    : data.status === "installed"
      ? "OpenNori project state initialized."
      : `OpenNori ${label} preview.`;
  line(stdout, title);
  line(stdout, `Project: ${data.root || plan.root || "."}`);
  if (data.status !== "ready") {
    line(stdout, `Mode: ${plan.dry_run ? "preview" : data.confirmed ? "confirmed" : "preview"}`);
    line(stdout, `Writes: ${summary.will_write ?? 0} now, ${summary.would_write ?? 0} planned`);
    printExternalActionDetails(stdout, plan.actions, data.root || plan.root, 8);
  }
  line(stdout, `Current Nori Contract: ${currentGoal ? asObject(currentGoal).goal_id || "present" : "none"}`);
  if (!currentGoal) line(stdout, "Empty .opennori/current is normal until a Nori Contract is approved.");
  if (data.next) line(stdout, `Next: ${data.next}`);
}

function printPluginSync(stdout: NodeJS.WriteStream, data: JsonObject): void {
  const plan = asObject(data.plugin_sync_plan);
  const summary = asObject(plan.summary);
  line(stdout, data.status === "synced" ? "OpenNori plugin cache synced." : "OpenNori plugin sync preview.");
  line(stdout, `Mode: ${plan.dry_run ? "preview" : "confirmed"}`);
  line(stdout, `Actions: ${summarizeActions(plan.actions)}`);
  line(stdout, `Writes: ${summary.will_write ?? 0} now, ${summary.would_write ?? 0} planned`);
  line(stdout, `Destructive: ${Number(summary.destructive || 0) > 0 ? "yes" : "no"}`);
}

function printDoctor(stdout: NodeJS.WriteStream, data: JsonObject): void {
  const recovery = Array.isArray(data.recovery_actions) ? data.recovery_actions : [];
  const agentNext = asObject(data.agent_next);
  line(stdout, "OpenNori doctor");
  line(stdout, `Status: ${data.status || "unknown"}`);
  line(stdout, `Project: ${data.root || "."}`);
  line(stdout, `Recovery actions: ${recovery.length}`);
  if (agentNext.user_visible_next || agentNext.safe_next_command) {
    line(stdout, `Next: ${agentNext.user_visible_next || agentNext.safe_next_command}`);
  } else if (recovery[0]) {
    line(stdout, `Next: ${asObject(recovery[0]).action || "review recovery actions"}`);
  }
}

function printNoCurrentGoal(stdout: NodeJS.WriteStream, title: string, data: JsonObject): boolean {
  if (data.current_goal !== null || !["no_current_goal", "needs-action"].includes(String(data.status))) return false;
  const agentNext = asObject(data.agent_next);
  const health = asObject(data.health);
  const failedChecks = Array.isArray(health.failed_checks) ? health.failed_checks : [];
  line(stdout, title);
  line(stdout, "OpenNori has no current goal.");
  line(stdout, `Project: ${data.root || "."}`);
  line(stdout, `Status: ${data.status || "no_current_goal"}`);
  if (health.status) line(stdout, `Health: ${health.status}`);
  if (failedChecks.length > 0) {
    const first = asObject(failedChecks[0]);
    line(stdout, `Problem: ${first.summary || data.message || "OpenNori project state needs attention."}`);
  }
  if (agentNext.needs_user !== undefined) line(stdout, `Need user: ${agentNext.needs_user ? "yes" : "no"}`);
  line(stdout, `Next: ${agentNext.user_visible_next || "Ask your agent to use OpenNori for a goal."}`);
  return true;
}

function printAcceptanceStatus(stdout: NodeJS.WriteStream, title: string, data: JsonObject): void {
  if (printNoCurrentGoal(stdout, title, data)) return;
  const gap = data.current_gap === null ? null : asObject(data.current_gap);
  const completion = asObject(data.completion);
  const intervention = asObject(data.intervention);
  const basis = asObject(data.acceptance_basis);
  const basisLabel = [
    basis.source ? String(basis.source) : "",
    basis.mode ? String(basis.mode) : ""
  ].filter(Boolean).join(" ");
  line(stdout, title);
  line(stdout, `Goal: ${data.goal_id || "unknown"}`);
  if (basisLabel) line(stdout, `Acceptance basis: ${basisLabel}`);
  if (Array.isArray(basis.coverage_summary) && basis.coverage_summary.length > 0) {
    line(stdout, `Discovery coverage: ${basis.coverage_summary.slice(0, 6).map(String).join(", ")}`);
  }
  line(stdout, `Workflow: ${data.workflow_status || (completion.complete ? "complete" : "active") || "unknown"}`);
  line(stdout, `Current gap: ${gap ? `${gap.id}: ${gap.reason || gap.user_story || "needs evidence"}` : "none"}`);
  if (completion.answer) line(stdout, `Decision: ${completion.answer}`);
  if (intervention.required !== undefined) line(stdout, `Need user: ${intervention.required ? "yes" : "no"}`);
  if (intervention.required) line(stdout, `Next: ${intervention.action || "Ask the user for the required decision."}`);
  else if (gap) line(stdout, "Next: Work the current gap and record reviewable evidence.");
  else if (completion.complete) line(stdout, "Next: Review the report or start a new goal if needed.");
}

function printCheck(stdout: NodeJS.WriteStream, data: JsonObject, warnings: unknown): void {
  if (printNoCurrentGoal(stdout, "OpenNori check", data)) return;
  const warningCount = Array.isArray(warnings) ? warnings.length : 0;
  const gap = data.current_gap === null ? null : asObject(data.current_gap);
  const architecture = asObject(data.architecture_check);
  const evidence = asObject(data.evidence_health);
  line(stdout, "OpenNori check");
  line(stdout, `Goal: ${data.goal_id || "unknown"}`);
  line(stdout, `Workflow: ${data.workflow_status || "unknown"}`);
  line(stdout, `Current gap: ${gap ? `${gap.id}: ${gap.reason || "needs attention"}` : "none"}`);
  line(stdout, `Architecture: ${architecture.status || "unknown"}`);
  line(stdout, `Evidence health: ${evidence.status || "unknown"}`);
  line(stdout, `Review warnings: ${warningCount}`);
}

function printReport(stdout: NodeJS.WriteStream, data: JsonObject): void {
  printAcceptanceStatus(stdout, "OpenNori report generated.", data);
  if (data.report_path) line(stdout, `Report: ${relative(data.root, data.report_path)}`);
}

function printDraft(stdout: NodeJS.WriteStream, data: JsonObject): void {
  const basis = asObject(data.acceptance_basis);
  line(stdout, "OpenNori draft created.");
  line(stdout, `Goal: ${data.goal_id || "unknown"}`);
  if (basis.source || basis.mode) {
    line(stdout, `Acceptance basis: ${[basis.source, basis.mode].filter(Boolean).join(" ")}`);
  }
  line(stdout, `Nori Contract Draft: ${relative(data.root, data.acceptance_path)}`);
  if (data.evidence_path) line(stdout, `Internal evidence ledger: ${relative(data.root, data.evidence_path)}`);
  line(stdout, "State: draft, awaiting AC Review Loop and user approval.");
}

function printDashboard(stdout: NodeJS.WriteStream, data: JsonObject): void {
  line(stdout, "OpenNori dashboard running.");
  line(stdout, `URL: ${data.url || "unknown"}`);
  line(stdout, `Project: ${data.root || "."}`);
  line(stdout, "Browser: not opened automatically; open the URL yourself or rerun with --open.");
}

function printActivity(stdout: NodeJS.WriteStream, data: JsonObject, subcommand?: string): void {
  const activity = asObject(data.activity);
  const target = data.target === null ? null : asObject(data.target);
  const snapshot = asObject(data.snapshot_summary);
  line(stdout, `OpenNori activity ${subcommand || "updated"}.`);
  line(stdout, `Agent: ${activity.agent || "none"}`);
  line(stdout, `State: ${activity.state || snapshot.agent_state || "unknown"}`);
  if (activity.skill || snapshot.agent_skill) line(stdout, `Skill: ${activity.skill || snapshot.agent_skill}`);
  if (activity.summary) line(stdout, `Summary: ${activity.summary}`);
  line(stdout, `Goal: ${target?.goal_id || snapshot.goal_id || "none"}`);
  line(stdout, `Current gap: ${target?.gap_id || snapshot.current_gap_id || "none"}`);
  line(stdout, `Decision: ${snapshot.decision || "unknown"}`);
  if (snapshot.need_user !== undefined) line(stdout, `Need user: ${snapshot.need_user ? "yes" : "no"}`);
  if (data.snapshot_path) line(stdout, `Snapshot: ${data.snapshot_path}`);
}

function printProfile(stdout: NodeJS.WriteStream, data: JsonObject, subcommand?: string): void {
  const profile = asObject(data.profile);
  const items = Array.isArray(profile.items) ? profile.items.map(asObject) : [];
  const checks = Array.isArray(data.checks) ? data.checks : [];
  const compliance = asObject(data.compliance);
  const counts = new Map<string, number>();
  for (const item of items) counts.set(String(item.strength || "unknown"), (counts.get(String(item.strength || "unknown")) || 0) + 1);
  line(stdout, `OpenNori profile ${subcommand || "summary"}.`);
  line(stdout, `Scope: ${data.scope || "project"}`);
  line(stdout, `Items: ${items.length}`);
  if (checks.length > 0) line(stdout, `Checks: ${checks.length}`);
  if (items.length > 0) {
    line(stdout, `Strengths: ${[...counts.entries()].map(([key, count]) => `${key}: ${count}`).join(", ")}`);
    line(stdout, "Profile items:");
    for (const item of items.slice(0, 5)) {
      line(stdout, `- ${item.id || item.name}: ${item.name || "unnamed"} (${item.type || "constraint"}, ${item.strength || "prefer"})`);
    }
  }
  if (data.goal_id || data.current_goal) line(stdout, `Goal: ${data.goal_id || data.current_goal}`);
  if (compliance.complete !== undefined) line(stdout, `Compliance: ${compliance.complete ? "complete" : "needs review"}`);
  if (Array.isArray(compliance.blocking) && compliance.blocking.length > 0) line(stdout, `Blocking: ${compliance.blocking.length}`);
  if (Array.isArray(compliance.review) && compliance.review.length > 0) line(stdout, `Review: ${compliance.review.length}`);
  if (data.recorded !== undefined) line(stdout, `Recorded: ${data.recorded ? "yes" : "no"}`);
}

function printArchitecture(stdout: NodeJS.WriteStream, data: JsonObject, subcommand?: string): void {
  const architecture = asObject(data.architecture);
  const requirement = asObject(architecture.requirement || data.requirement);
  const baseline = asObject(data.baseline || architecture.baseline);
  const profiles = Array.isArray(data.profiles) ? data.profiles.map(asObject) : [];
  line(stdout, `OpenNori architecture ${subcommand || "summary"}.`);
  line(stdout, `Project: ${data.root || "."}`);
  if (data.confirmed !== undefined) line(stdout, `Confirmed: ${data.confirmed ? "yes" : "no"}`);
  if (data.goal_id || baseline.goal_id) line(stdout, `Goal: ${data.goal_id || baseline.goal_id}`);
  if (requirement.status) line(stdout, `Requirement: ${requirement.status}`);
  if (architecture.decision) line(stdout, `Architecture decision: ${architecture.decision}`);
  if (baseline.profile || baseline.profile_title) line(stdout, `Baseline: ${baseline.profile_title || baseline.profile}`);
  if (profiles.length > 0) {
    line(stdout, `Profiles: ${profiles.length}`);
    for (const profile of profiles.slice(0, 5)) {
      line(stdout, `- ${profile.id || profile.profile || "unknown"}: ${profile.title || profile.summary || profile.status || "review profile"}`);
    }
  }
  if (data.apply_record) {
    const record = asObject(data.apply_record);
    line(stdout, `Apply record: ${record.id || "unknown"} (${record.status || "unknown"})`);
  }
  if (data.challenge) {
    const challenge = asObject(data.challenge);
    line(stdout, `Challenge: ${challenge.id || "unknown"} (${challenge.status || "open"})`);
    line(stdout, `Need user: ${challenge.needs_user ? "yes" : "no"}`);
  }
  if (data.decision) {
    const decision = asObject(data.decision);
    line(stdout, `Build-vs-buy: ${decision.id || "unknown"} (${decision.recommendation || "unknown"})`);
  }
  if (data.markdown_path) line(stdout, `Review: ${relative(data.root, data.markdown_path)}`);
  else if (data.decision_path) line(stdout, `Decision record: ${relative(data.root, data.decision_path)}`);
}

export function shouldPrintHuman(args: string[], stdout: NodeJS.WriteStream = process.stdout): boolean {
  return !args.includes("--json") && Boolean(stdout.isTTY);
}

export function printHumanResult(payload: NoriResult, options: HumanOutputOptions): boolean {
  const stdout = options.stdout || process.stdout;
  const command = options.commandPath[0] as OutputCommand | undefined;
  const subcommand = options.commandPath[1];
  if (!payload.ok) {
    printFailure(stdout, payload, command ? `OpenNori ${[command, subcommand].filter(Boolean).join(" ")} failed.` : undefined);
    return true;
  }

  const data = payload.data as JsonObject;
  if (command === "setup") printSetup(stdout, data);
  else if (command === "init" || command === "bootstrap") printProjectBootstrap(stdout, data, command);
  else if (command === "install") printPlanSummary(stdout, data.dry_run ? "OpenNori install preview." : "OpenNori install complete.", data, "install_plan");
  else if (command === "upgrade") printPlanSummary(stdout, data.dry_run ? "OpenNori upgrade preview." : "OpenNori upgrade complete.", data, "upgrade_plan");
  else if (command === "uninstall") printPlanSummary(stdout, data.dry_run ? "OpenNori uninstall preview." : "OpenNori uninstall complete.", data, "uninstall_plan");
  else if (command === "plugin" && subcommand === "sync") printPluginSync(stdout, data);
  else if (command === "doctor") printDoctor(stdout, data);
  else if (command === "check") printCheck(stdout, data, payload.warnings);
  else if (command === "draft") printDraft(stdout, data);
  else if (command === "status" || command === "resume" || command === "next") printAcceptanceStatus(stdout, "OpenNori status", data);
  else if (command === "report") printReport(stdout, data);
  else if (command === "dashboard") printDashboard(stdout, data);
  else if (command === "activity") printActivity(stdout, data, subcommand);
  else if (command === "profile") printProfile(stdout, data, subcommand);
  else if (command === "architecture") printArchitecture(stdout, data, subcommand);
  else return false;

  if (!["status", "resume", "next", "report"].includes(String(command))) {
    for (const next of (payload.next_actions || []).slice(0, 2)) line(stdout, `Next: ${next}`);
  }
  return true;
}
