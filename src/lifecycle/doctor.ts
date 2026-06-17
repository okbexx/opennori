import { architectureState } from "../architecture.ts";
import { agentNextForDoctor } from "../agent-next.ts";
import type {
  DoctorCheck,
  DoctorState
} from "../types.ts";
import { inspectActiveGoals } from "./doctor/active-goals.ts";
import { inspectManifestHealth } from "./doctor/manifest-health.ts";
import { architectureHealthChecks, projectHealthChecks } from "./doctor/project-health.ts";
import { doctorCheck, doctorRecoveryActions, doctorStatus } from "./doctor/shared.ts";
import { inspectPluginHealth } from "./doctor/plugin-health.ts";

export function doctor(root: string): DoctorState {
  const checks: DoctorCheck[] = [];
  const active = inspectActiveGoals(root);
  const architecture = architectureState(root, active.details[0]?.goal_id);
  const manifest = inspectManifestHealth(root, active.details);

  checks.push(...projectHealthChecks(root));
  checks.push(...architectureHealthChecks(architecture, active.details.length > 0));
  checks.push(...manifest.checks);
  checks.push(doctorCheck(
    "current_goal_recoverable",
    active.issues.length === 0,
    active.issues.length === 0 ? `${active.details.length} current goal(s) are recoverable.` : `${active.issues.length} current/draft/history issue(s) found.`,
    "Inspect active_goal_issues, fix the reported .opennori/current or .opennori/drafts contract/evidence pair, then rerun opennori doctor --root <project> --json.",
    "broken"
  ));
  const plugin = inspectPluginHealth(manifest.manifest, manifest.manifestReadable);
  checks.push(...plugin.checks);

  const state: DoctorState = {
    status: doctorStatus(checks),
    checks,
    recovery_actions: doctorRecoveryActions(checks, active.issues),
    active_goals: active.details,
    current_goal: active.details[0] || null,
    draft_goals: active.drafts,
    legacy_active_goals: active.legacy,
    active_goal_issues: active.issues,
    manifest_path: manifest.manifestFile,
    plugin: plugin.plugin,
    architecture
  };
  state.agent_next = agentNextForDoctor(root, state);
  return state;
}
