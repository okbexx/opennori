import type { AcceptanceStatus, JsonObject, WorkflowStatus } from "./common.ts";
import type { CompletionAnswer } from "./contract.ts";
import type { EvidenceRecord } from "./evidence.ts";
import type { CapabilityProfile, ProfileCompliance } from "./profile.ts";

export type NoriEventActor = {
  kind: "agent" | "user" | "system" | (string & {});
  name: string;
  skill?: string;
};

export type NoriEventType =
  | "goal.created"
  | "contract.drafted"
  | "contract.approved"
  | "gap.changed"
  | "ac.started"
  | "ac.finished"
  | "activity.started"
  | "activity.heartbeat"
  | "activity.finished"
  | "evidence.added"
  | "decision.changed"
  | "architecture.changed"
  | "profile.changed"
  | "doctor.warning"
  | "report.generated"
  | (string & {});

export type NoriEventInput = {
  type: NoriEventType;
  goal_id?: string;
  gap_id?: string;
  actor?: NoriEventActor;
  summary?: string;
  data?: JsonObject;
  created_at?: string;
};

export type NoriEvent = {
  schema_version: "opennori/event-v1" | (string & {});
  id: string;
  seq: number;
  type: NoriEventType;
  goal_id?: string;
  gap_id?: string;
  actor: NoriEventActor;
  summary: string;
  data: JsonObject;
  created_at: string;
};

export type NoriActivityState = "idle" | "thinking" | "working" | "verifying" | "waiting_user" | "blocked";

export type NoriActivityInput = {
  agent?: string;
  skill?: string;
  state?: NoriActivityState | string;
  goal_id?: string;
  gap_id?: string;
  summary?: string;
  ttl_ms?: number;
};

export type NoriActivity = {
  schema_version: "opennori/activity-v1" | (string & {});
  agent: string;
  skill?: string;
  state: NoriActivityState;
  goal_id?: string;
  gap_id?: string;
  summary: string;
  started_at: string;
  last_seen_at: string;
  expires_at: string;
  expired?: boolean;
};

export type NoriActivityTarget = {
  goal_id: string;
  gap_id: string | null;
  gap_summary?: string;
  inferred: boolean;
};

export type NoriIdleSummary = {
  state: "no_current_goal";
  message: string;
  next: string;
  last_goal?: {
    id: string;
    label: string;
    workflow_status: WorkflowStatus | string;
    location: "completed" | "blocked" | (string & {});
    updated_at?: string;
    dossier_path: string;
    readme_path: string;
    report_path: string;
  };
};

export type NoriOutcomeSummary = {
  decision: {
    state: "complete" | "not_complete" | "review_risk" | "no_active_goal" | (string & {});
    label: string;
    detail: string;
  };
  current_gap: {
    id: string | null;
    label: string;
    detail: string;
  };
  need_user: {
    required: boolean;
    label: string;
    action: string;
  };
  next: {
    label: string;
    action: string;
  };
  profile: {
    scope: "project_only" | "current_goal_compliance";
    state: "clear" | "review" | "blocked" | "idle" | (string & {});
    label: string;
    detail: string;
  };
};

export type NoriSnapshot = {
  schema_version: "opennori/snapshot-v1" | (string & {});
  generated_at: string;
  root: string;
  status: "active" | "no_active_goal" | (string & {});
  idle_summary?: NoriIdleSummary;
  agent: {
    name: string;
    skill?: string;
    state: NoriActivityState;
    summary?: string;
    last_seen_at?: string;
    expires_at?: string;
    expired?: boolean;
  };
  goal: {
    id: string;
    label: string;
    workflow_status: WorkflowStatus;
    dossier?: {
      location: "current" | "drafts" | "completed" | "blocked" | "active" | (string & {});
      path: string;
      readme_path: string;
      contract_path: string;
      ledger_path: string;
      criteria_path: string;
      report_path: string;
    };
  } | null;
  current_gap: {
    id: string;
    label: string;
    status: AcceptanceStatus;
    reason: string;
    latest_evidence?: string;
    dossier?: {
      path: string;
      readme_path: string;
      criterion_path: string;
      status_path: string;
      evidence_path: string;
      artifacts_path: string;
    };
  } | null;
  need_user: boolean;
  user_action?: string;
  decision: "complete" | "not_complete" | "review_risk" | "no_active_goal" | (string & {});
  outcome_summary?: NoriOutcomeSummary;
  completion?: CompletionAnswer;
  acceptance_review?: {
    status: string;
    summary: string;
  };
  evidence_health?: {
    status: string;
    summary: string;
  };
  architecture: {
    decision: string;
    profile: string | null;
    profile_title?: string | null;
    open_challenges?: number;
  };
  capability_profile?: CapabilityProfile;
  capability_compliance?: ProfileCompliance;
  loop: {
    goal: string;
    contract: string;
    gap: string;
    evidence: string;
    decision: string;
  };
  last_event: NoriEvent | null;
  /* 简体中文：只读 criteria 和 events 字段以支撑雷达网和控制台渲染 */
  criteria?: Array<{
    id: string;
    layer?: string;
    user_story: string;
    measurement: string;
    threshold: string;
    required?: boolean;
    status: AcceptanceStatus | string;
    confidence: string;
    evidence: EvidenceRecord[];
    dossier?: {
      path: string;
      readme_path: string;
      criterion_path: string;
      status_path: string;
      evidence_path: string;
      artifacts_path: string;
    };
  }>;
  events?: NoriEvent[];
};
