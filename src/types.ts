export type PlatformId = "codex" | "claude";

export type ProjectConfig = {
  schema_version: "opennori/project-v1";
  developer: string;
  platforms: PlatformId[];
  packages?: Record<string, { path: string }>;
  default_package?: string;
};

export type OwnershipRecord = {
  asset_id: string;
  platform: "core" | PlatformId;
  path: string;
  scope: "file" | "section";
  policy: "managed" | "seed";
  last_written_hash: string;
};

export type InstallManifest = {
  schema_version: "opennori/install-manifest-v1";
  product_version: string;
  state_schema_version: number;
  platforms: PlatformId[];
  assets: OwnershipRecord[];
  created_at: string;
  updated_at: string;
};

export type TaskStatus = "planning" | "in_progress" | "review" | "completed";
export type TaskPhase = "plan" | "implement" | "verify" | "finish";

export type TaskRecord = {
  schema_version: "opennori/task-v2";
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  implementation_revision: number;
  priority: "P0" | "P1" | "P2" | "P3";
  creator: string;
  delivery_required: boolean;
  package?: string | null;
  blocker?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
};

export type LegacyTaskRecord = Omit<TaskRecord, "schema_version" | "delivery_required"> & {
  schema_version: "opennori/task-v1";
};

export type DeliveryMode = "commit" | "pull_request" | "waived";
export type DeliveryStatus = "planned" | "recorded" | "waived";

export type DeliveryRecord = {
  schema_version: "opennori/delivery-v1";
  task_id: string;
  mode: DeliveryMode;
  status: DeliveryStatus;
  base_branch: string | null;
  base_commit: string | null;
  branch: string | null;
  commit: string | null;
  remote: string | null;
  pull_request_url: string | null;
  implementation_revision: number | null;
  waiver: {
    actor: string;
    host_confirmation_ref: string;
    reason: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export type Outcome = {
  id: string;
  statement: string;
  verification: string;
  required: boolean;
};

export type ContractApproval = {
  approver: string;
  approved_at: string;
  content_hash: string;
  host_confirmation_ref?: string;
  note?: string;
};

export type NoriContract = {
  schema_version: "opennori/contract-v1";
  task_id: string;
  goal: string;
  status: "draft" | "approved";
  outcomes: Outcome[];
  assumptions: string[];
  approval: ContractApproval | null;
  updated_at: string;
};

export type ContractInput = {
  goal: string;
  outcomes: Outcome[];
  assumptions?: string[];
};

export type ContractApprovalInput = {
  approver: string;
  host_confirmation_ref?: string;
  note?: string;
};

export type EvidenceResult = "proven" | "failed" | "blocked" | "waived";

export type EvidenceSource =
  | {
      type: "command";
      command: string;
      exit_code: number;
      stdout: string;
      stderr: string;
      argv?: string[];
      cwd?: string;
    }
  | {
      type: "artifact";
      path: string;
      bytes: number;
      sha256: string;
    }
  | {
      type: "human";
      actor: string;
      host_confirmation_ref: string;
    }
  | {
      type: "url";
      url: string;
      summary: string;
    };

export type EvidenceRecord = {
  schema_version: "opennori/evidence-v1";
  id: string;
  task_id: string;
  outcome_id: string;
  result: EvidenceResult;
  implementation_revision: number;
  summary: string;
  sources: EvidenceSource[];
  recorded_at: string;
};

export type ContextMode = "implement" | "check";

export type ContextEntry = {
  file: string;
  reason: string;
};

export type CoordinationBinding = {
  schema_version: "opennori/coordination-binding-v1";
  task_id: string;
  implementation_revision: number;
  platform: "codex";
  parent_session_ref: string;
  worker_ref: string;
  role: string;
  assignment: string | null;
  outcome_ids: string[];
  paths: string[];
  started_at: string | null;
  last_contact_at: string | null;
  interrupted_at: string | null;
  stopped_at: string | null;
  updated_at: string;
};

export type CoordinationBindingView = CoordinationBinding & {
  current_revision: boolean;
};

export type OutcomeStatus = {
  id: string;
  statement: string;
  required: boolean;
  status: EvidenceResult | "unproven";
  latest_evidence: EvidenceRecord | null;
};

export type TaskView = {
  task: TaskRecord;
  archived: boolean;
  phase: TaskPhase;
  contract: NoriContract | null;
  outcomes: OutcomeStatus[];
  current_gap: OutcomeStatus | null;
  complete: boolean;
  delivery: DeliveryRecord | null;
  delivery_ready: boolean;
  finish_ready: boolean;
};

export type ManagedAsset = {
  assetId: string;
  platform: "core" | PlatformId;
  path: string;
  scope: "file" | "section";
  policy: "managed" | "seed";
  content: string;
  markers?: { start: string; end: string };
};

export type LifecycleAction = {
  id: string;
  type: "create" | "update" | "remove" | "adopt" | "preserve" | "conflict" | "skip";
  asset_id: string;
  path: string;
  reason: string;
  destructive: boolean;
  expected_hash?: string;
  result_hash?: string;
};

export type LifecyclePlan = {
  schema_version: "opennori/lifecycle-plan-v1";
  operation: "init" | "repair" | "update" | "uninstall";
  root: string;
  actions: LifecycleAction[];
  blockers: string[];
  warnings: string[];
  state_migration?: StateMigrationPlan | null;
  state_schema_version?: number;
};

export type StateMigrationPlan = {
  schema_version: "opennori/state-migration-plan-v1";
  from_version: 1;
  to_version: 2;
  manifest_hash: string;
  task_files: string[];
};

export type DoctorCheck = {
  id: string;
  ok: boolean;
  message: string;
  recovery?: string;
};

export type DoctorResult = {
  status: "ready" | "needs_action" | "broken";
  checks: DoctorCheck[];
};
