import type { AcceptanceQualityAudit } from "./acceptance.ts";
import type { AgentNext, NextRecommendation } from "./agent.ts";
import type { ArchitectureState } from "./architecture.ts";
import type { ContractLanguage, JsonObject, WorkflowStatus } from "./common.ts";
import type { AcceptanceBasis, CompletionAnswer, CurrentGap, UserIntervention } from "./contract.ts";
import type { CriterionStatusRow, EvidenceHealth, EvidenceSource } from "./evidence.ts";
import type { CapabilityProfile, ProfileCompliance, ProfileComplianceStatus, ProfileItemType, ProfileStrength } from "./profile.ts";

export type NoriArtifact = {
  kind: string;
  path?: string;
  [key: string]: unknown;
};

export type NoriWarning = {
  type?: string;
  message?: string;
  [key: string]: unknown;
};

export type NoriOk<T extends object = JsonObject> = {
  ok: true;
  data: T;
  artifacts: NoriArtifact[];
  warnings: NoriWarning[];
  next_actions: string[];
};

export type NoriFailure = {
  ok: false;
  error: {
    type: string;
    message: string;
    fix?: string;
  };
};

export type NoriResult<T extends object = JsonObject> = NoriOk<T> | NoriFailure;

export type PathPair = {
  jsonPath: string;
  markdownPath: string;
};

export type ManagedAction = {
  path: string;
  action: string;
  kind: string;
  managed: boolean;
  reason?: string;
  recursive?: boolean;
  manifest?: Manifest;
  write?: () => unknown;
  from_version?: string;
  to_version?: string;
  [key: string]: unknown;
};

export type LifecyclePlanAction = {
  path: string;
  kind: string;
  action: string;
  managed: boolean;
  would_write: boolean;
  will_write: boolean;
  destructive: boolean;
  recursive?: boolean;
  from_version?: string;
  to_version?: string;
  reason: string;
};

export type LifecyclePlanSummary = {
  total: number;
  by_action: Record<string, number>;
  would_write: number;
  will_write: number;
  destructive: number;
  managed: number;
  preserved?: number;
};

export type InstallPlan = {
  schema_version: "opennori/install-plan-v1";
  root: string;
  dry_run: boolean;
  force: boolean;
  merge_agent_route: boolean;
  summary: LifecyclePlanSummary;
  actions: LifecyclePlanAction[];
};

export type UninstallPlan = {
  schema_version: "opennori/uninstall-plan-v1";
  root: string;
  dry_run: boolean;
  include_state: boolean;
  summary: LifecyclePlanSummary;
  actions: LifecyclePlanAction[];
};

export type UpgradePlan = {
  schema_version: "opennori/upgrade-plan-v1";
  root: string;
  dry_run: boolean;
  merge_agent_route: boolean;
  summary: LifecyclePlanSummary;
  actions: LifecyclePlanAction[];
};

export type PluginSkillState = {
  name: string;
  description: string;
  path: string;
  source: "package";
};

export type PluginState = {
  schema_version: "opennori/plugin-v1";
  name: string;
  version: string;
  manifest_path: string;
  marketplace_path: string;
  marketplace_name: string;
  marketplace_plugin_path: string;
  skills_path: string;
  packaged: boolean;
  marketplace_packaged: boolean;
  skill_count: number;
  skills: PluginSkillState[];
};

export type ManifestManagedFile = {
  path: string;
  kind: string;
  required: boolean;
  exists: boolean;
};

export type ActiveGoalSummary = {
  goal_id: string;
  location?: "current" | "drafts" | "completed" | "blocked" | "active" | string;
  status: WorkflowStatus | "unknown" | "unreadable" | string;
  current_gap: CurrentGap | null;
  acceptance_path: string;
  evidence_path: string;
  recoverable: boolean;
  schema_valid?: boolean;
  error?: string;
};

export type Manifest = {
  schema_version: string;
  protocol_version: string;
  opennori_version: string;
  created_at: string;
  updated_at: string;
  capabilities: string[];
  managed_files: ManifestManagedFile[];
  active_goals: ActiveGoalSummary[];
  current_goal?: ActiveGoalSummary | null;
  draft_goals?: ActiveGoalSummary[];
  history_goals?: ActiveGoalSummary[];
  legacy_active_goals?: ActiveGoalSummary[];
  plugin: PluginState;
  architecture: ArchitectureState;
  [key: string]: unknown;
};

export type ManifestWriteAction = ManagedAction & {
  manifest: Manifest;
};

export type DoctorIssue = {
  goal_id: string;
  message: string;
  path?: string;
};

export type DoctorCheck = {
  name: string;
  ok: boolean;
  summary: string;
  recovery?: string;
  severity?: string;
};

export type DoctorRecoveryAction = {
  check: string;
  severity: string;
  action: string;
  goal_id?: string;
  path?: string;
};

export type DoctorState = {
  status: "ready" | "needs-action" | "broken";
  checks: DoctorCheck[];
  recovery_actions: DoctorRecoveryAction[];
  active_goals: ActiveGoalSummary[];
  current_goal?: ActiveGoalSummary | null;
  draft_goals?: ActiveGoalSummary[];
  legacy_active_goals?: ActiveGoalSummary[];
  active_goal_issues: DoctorIssue[];
  manifest_path: string;
  plugin: PluginState;
  architecture: ArchitectureState;
  agent_next?: AgentNext;
};

export type BootstrapData = {
  root: string;
  status: "ready" | "needs_confirm" | "installed";
  confirmed: boolean;
  side_effect?: "none" | string;
  existing_state?: boolean;
  install_plan?: InstallPlan;
  actions?: LifecyclePlanAction[];
  doctor: DoctorState;
  next: string;
  agent_next?: AgentNext;
};

export type AutoProfileCheck = {
  item_id: string;
  type: ProfileItemType;
  name: string;
  strength: ProfileStrength;
  result: ProfileComplianceStatus;
  basis: string;
  summary: string;
  sources: EvidenceSource[];
  can_auto_record: boolean;
};

export type ContextExport = {
  schema_version: "opennori/context-export-v1";
  exported_at: string;
  root: string;
  goal_id: string;
  goal: string;
  presentation?: {
    language?: ContractLanguage;
    [key: string]: unknown;
  };
  acceptance_basis: AcceptanceBasis;
  workflow_status: WorkflowStatus;
  current_gap: CurrentGap | null;
  completion: CompletionAnswer;
  intervention: UserIntervention;
  acceptance_review: AcceptanceQualityAudit;
  evidence_health: EvidenceHealth;
  next_recommendation: NextRecommendation;
  agent_next: AgentNext;
  criteria: CriterionStatusRow[];
  capability_profile: CapabilityProfile;
  capability_compliance: ProfileCompliance;
  architecture: ArchitectureState;
  paths: {
    acceptance: string;
    evidence: string;
    report: string;
    report_exists: boolean;
    manifest: string;
  };
  manifest: Manifest | null;
};
