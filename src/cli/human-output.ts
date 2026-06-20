import path from "node:path";
import type { JsonObject, LifecyclePlanAction, NoriResult } from "../types.ts";

type OutputCommand =
  | "install"
  | "uninstall"
  | "upgrade"
  | "plugin"
  | "doctor"
  | "check"
  | "status"
  | "report"
  | "dashboard"
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

function printFailure(stdout: NodeJS.WriteStream, payload: NoriResult): void {
  if (payload.ok) return;
  line(stdout, "OpenNori command failed.");
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

function printDashboard(stdout: NodeJS.WriteStream, data: JsonObject): void {
  line(stdout, "OpenNori dashboard running.");
  line(stdout, `URL: ${data.url || "unknown"}`);
  line(stdout, `Project: ${data.root || "."}`);
}

export function shouldPrintHuman(args: string[], stdout: NodeJS.WriteStream = process.stdout): boolean {
  return !args.includes("--json") && Boolean(stdout.isTTY);
}

export function printHumanResult(payload: NoriResult, options: HumanOutputOptions): boolean {
  const stdout = options.stdout || process.stdout;
  if (!payload.ok) {
    printFailure(stdout, payload);
    return true;
  }

  const command = options.commandPath[0] as OutputCommand | undefined;
  const subcommand = options.commandPath[1];
  const data = payload.data as JsonObject;
  if (command === "install") printPlanSummary(stdout, data.dry_run ? "OpenNori install preview." : "OpenNori install complete.", data, "install_plan");
  else if (command === "upgrade") printPlanSummary(stdout, data.dry_run ? "OpenNori upgrade preview." : "OpenNori upgrade complete.", data, "upgrade_plan");
  else if (command === "uninstall") printPlanSummary(stdout, data.dry_run ? "OpenNori uninstall preview." : "OpenNori uninstall complete.", data, "uninstall_plan");
  else if (command === "plugin" && subcommand === "sync") printPluginSync(stdout, data);
  else if (command === "doctor") printDoctor(stdout, data);
  else if (command === "check") printCheck(stdout, data, payload.warnings);
  else if (command === "status" || command === "resume" || command === "next") printAcceptanceStatus(stdout, "OpenNori status", data);
  else if (command === "report") printReport(stdout, data);
  else if (command === "dashboard") printDashboard(stdout, data);
  else return false;

  if (!["status", "resume", "next", "report"].includes(String(command))) {
    for (const next of (payload.next_actions || []).slice(0, 2)) line(stdout, `Next: ${next}`);
  }
  return true;
}
