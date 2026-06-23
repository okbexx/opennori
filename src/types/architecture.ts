import type { SchemaValidationError } from "../validation.ts";
import type { ValidationIssue } from "./common.ts";

export type ArchitectureSource = {
  label: string;
  lesson?: string;
  [key: string]: unknown;
};

export type ArchitectureCheck = {
  id: string;
  audience: string;
  statement: string;
  review?: string;
  [key: string]: unknown;
};

export type PreferredLibraryPolicy = {
  area: string;
  policy: string;
  [key: string]: unknown;
};

export type BuildVsBuyPolicy = {
  order: string[];
  require_reason_when_self_building?: boolean;
  requires_decision_for?: string[];
  [key: string]: unknown;
};

export type TechnicalArchitectureItem = {
  name: string;
  decision: string;
  reason?: string;
  [key: string]: unknown;
};

export type TechnicalArchitectureFlow = {
  name: string;
  steps: string[];
  [key: string]: unknown;
};

export type TechnicalArchitectureBaseline = {
  runtime_topology: TechnicalArchitectureItem[];
  source_of_truth: TechnicalArchitectureItem[];
  module_boundaries: TechnicalArchitectureItem[];
  contract_surfaces: TechnicalArchitectureItem[];
  data_flows: TechnicalArchitectureFlow[];
  dependency_decisions: TechnicalArchitectureItem[];
  reference_mappings: TechnicalArchitectureItem[];
  verification: string[];
  [key: string]: unknown;
};

export type ArchitectureProfile = {
  id: string;
  title: string;
  origin?: "builtin" | "project" | string;
  applies_to: string[];
  summary: string;
  sources: ArchitectureSource[];
  principles: string[];
  checks: ArchitectureCheck[];
  technical_baseline?: Partial<TechnicalArchitectureBaseline>;
  preferred_libraries: PreferredLibraryPolicy[];
  avoid: string[];
  build_vs_buy_policy: BuildVsBuyPolicy;
  updated_at?: string;
  [key: string]: unknown;
};

export type ArchitectureProfileDescriptor = ArchitectureProfile & {
  origin?: "builtin" | "project" | string;
  path?: string;
  valid: boolean;
  validation_issues: ValidationIssue[];
  review: {
    can_generate_baseline: boolean;
    source_count: number;
    check_count: number;
    avoid_count: number;
    next: string;
  };
};

export type InvalidArchitectureProfileDescriptor = {
  id: string;
  title: string;
  origin: "project" | string;
  path?: string;
  valid: false;
  error: string;
};

export type ArchitectureProfileListItem = ArchitectureProfileDescriptor | InvalidArchitectureProfileDescriptor;

export type ArchitectureBaseline = {
  schema_version: "opennori/architecture-baseline-v1";
  status: "draft" | "active";
  profile: string;
  profile_title: string;
  profile_origin?: string;
  goal_id: string;
  goal: string;
  summary: string;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  sticky: boolean;
  requires_challenge_to_change: boolean;
  applies_to: string[];
  sources: ArchitectureSource[];
  principles: string[];
  checks: ArchitectureCheck[];
  technical_baseline: TechnicalArchitectureBaseline;
  preferred_libraries: PreferredLibraryPolicy[];
  avoid: string[];
  build_vs_buy_policy: BuildVsBuyPolicy;
  challenge_policy: {
    agent_may_challenge: boolean;
    agent_must_not_silently_replace: boolean;
    requires_user_confirmation: boolean;
  };
  agent_surfaces: string[];
  [key: string]: unknown;
};

export type ArchitectureSurfaceState = {
  guide: { path: string; installed: boolean; in_sync: boolean };
  agents: { path: string; installed: boolean; references_baseline: boolean };
  claude: { path: string; installed: boolean; references_baseline: boolean };
};

export type ArchitectureChallengeSummary = {
  id: string;
  status: string;
  summary: string;
  needs_user: boolean;
  path: string;
};

export type BuildVsBuyDecision = {
  id: string;
  schema_version?: "opennori/build-vs-buy-v1" | string;
  area: string;
  need: string;
  recommendation: string;
  status?: string;
  summary?: string;
  current_project?: string;
  standard_library?: string;
  official_sdk?: string;
  open_source?: string;
  self_build_reason?: string;
  superseded_by?: string;
  superseded_reason?: string;
  [key: string]: unknown;
};

export type BuildVsBuyDecisionSummary = Partial<BuildVsBuyDecision> & {
  id: string;
  path: string;
  schema_valid?: boolean;
  schema_errors?: SchemaValidationError[];
  error?: string;
};

export type BuildVsBuyFinding = {
  decision_id: string;
  severity: "needs-action" | "broken" | string;
  issue: string;
  message: string;
  recovery: string;
};

export type BuildVsBuyHealth = {
  status: "clear" | "needs-action" | "broken";
  summary: string;
  decision_count: number;
  total_decision_count: number;
  superseded_decision_count: number;
  findings: BuildVsBuyFinding[];
};

export type ArchitectureRequirementStatus = "unknown" | "required" | "not_required" | "waived";

export type ArchitectureRequirement = {
  schema_version: "opennori/architecture-requirement-v1";
  goal_id?: string;
  status: ArchitectureRequirementStatus;
  reason: string;
  decided_by?: string;
  decided_at?: string;
  source?: string;
  limitations?: string;
  recorded: boolean;
  path?: string;
};

export type ArchitectureState = {
  schema_version: "opennori/architecture-state-v1";
  decision: "missing" | "invalid" | "draft" | "valid" | "challenged";
  required_for_goal: boolean;
  requirement: ArchitectureRequirement;
  baseline: {
    status: ArchitectureBaseline["status"];
    profile: string;
    profile_title: string;
    goal_id: string;
    technical_baseline_summary?: {
      runtime_topology_count: number;
      module_boundary_count: number;
      contract_surface_count: number;
      data_flow_count: number;
      dependency_decision_count: number;
      reference_mapping_count: number;
    };
    sticky: boolean;
    requires_challenge_to_change: boolean;
    accepted_at: string | null;
  } | null;
  issues: ValidationIssue[];
  open_challenges: ArchitectureChallengeSummary[];
  apply_records?: ArchitectureApplySummary[];
  evidence_health: ArchitectureEvidenceHealth;
  build_vs_buy_decisions: BuildVsBuyDecisionSummary[];
  build_vs_buy: BuildVsBuyHealth;
  agent_surface: ArchitectureSurfaceState;
  paths: {
    baseline_json: string;
    baseline_markdown: string;
    agent_guide: string;
  };
};

export type ArchitectureChallenge = {
  id: string;
  status: string;
  needs_user: boolean;
  baseline?: Partial<ArchitectureBaseline>;
  summary?: string;
  evidence?: string;
  recommendation?: string;
  [key: string]: unknown;
};

export type ArchitectureApplyRecord = {
  schema_version: "opennori/architecture-apply-v1";
  id: string;
  goal_id: string;
  criterion_id: string;
  status: "aligned" | "needs-challenge" | "waived" | string;
  baseline: {
    profile: string;
    profile_title?: string;
    accepted_at: string | null;
  };
  summary: string;
  fit: string;
  implementation_focus: string;
  evidence?: string;
  limitations?: string;
  created_at: string;
  next: string;
  [key: string]: unknown;
};

export type ArchitectureApplySummary = {
  id: string;
  goal_id: string;
  criterion_id: string;
  status: string;
  summary: string;
  baseline_profile: string;
  path: string;
  schema_valid?: boolean;
  schema_errors?: SchemaValidationError[];
  error?: string;
};

export type ArchitectureEvidenceFinding = {
  path: string;
  issue: "schema-invalid-apply-record" | "unreadable-apply-record";
  severity: "broken";
  message: string;
  recovery: string;
  schema_errors?: SchemaValidationError[];
  error?: string;
};

export type ArchitectureEvidenceHealth = {
  status: "clear" | "broken";
  summary: string;
  finding_count: number;
  findings: ArchitectureEvidenceFinding[];
};
