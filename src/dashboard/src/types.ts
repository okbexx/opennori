export type ActivityState = "idle" | "thinking" | "working" | "verifying" | "waiting_user" | "blocked" | (string & {});

export type NoriEvent = {
  schema_version: string;
  id: string;
  seq: number;
  type: string;
  goal_id?: string;
  gap_id?: string;
  actor: {
    kind: string;
    name: string;
    skill?: string;
  };
  summary: string;
  data?: Record<string, unknown>;
  created_at: string;
};

export type RadarNode = {
  id: string;
  type: "goal" | "ac" | "evidence" | "profile";
  label: string;
  subLabel?: string;
  x: number;
  y: number;
  status: string;
  rawData: unknown;
  radius?: number;
};

export type EvidenceRecord = {
  kind?: string;
  basis?: string;
  summary?: string;
  result?: string;
  confidence?: string;
  path?: string;
  sources?: Array<Record<string, unknown>>;
  reviewability?: string;
  limitations?: string;
  [key: string]: unknown;
};

export type CompletionAnswer = {
  complete: boolean;
  objective_complete: boolean;
  confidence: "confident" | "review-risk" | "not-complete" | (string & {});
  review_risks: string[];
  answer: string;
};

export type ProfileEvidenceRecord = {
  item_id: string;
  result: "satisfied" | "violated" | "waived" | (string & {});
  summary?: string;
  path?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type ProfileItem = {
  id: string;
  type: "skill" | "stack" | "constraint" | (string & {});
  name: string;
  strength: "must" | "prefer" | "avoid" | (string & {});
  purpose?: string;
  scope?: string;
  install_policy?: string;
  evidence?: ProfileEvidenceRecord[];
  [key: string]: unknown;
};

export type CapabilityProfile = {
  schema_version?: string;
  updated_at?: string;
  items: ProfileItem[];
};

export type ProfileStatusRow = {
  id: string;
  type: "skill" | "stack" | "constraint" | (string & {});
  name: string;
  strength: "must" | "prefer" | "avoid" | (string & {});
  purpose?: string;
  status: "unknown" | "satisfied" | "violated" | "waived" | (string & {});
  summary: string;
};

export type ProfileCompliance = {
  required: boolean;
  complete: boolean;
  blocking: ProfileStatusRow[];
  review: ProfileStatusRow[];
  statuses: ProfileStatusRow[];
};

export type NoriSnapshot = {
  schema_version: string;
  generated_at: string;
  root: string;
  status: "active" | "no_active_goal" | (string & {});
  idle_summary?: {
    state: "no_current_goal";
    message: string;
    next: string;
    last_goal?: {
      id: string;
      label: string;
      workflow_status: string;
      location: string;
      updated_at?: string;
      dossier_path: string;
      readme_path: string;
      report_path: string;
    };
  };
  agent: {
    name: string;
    skill?: string;
    state: ActivityState;
    summary?: string;
    last_seen_at?: string;
    expires_at?: string;
    expired?: boolean;
  };
  goal: {
    id: string;
    label: string;
    workflow_status: string;
    dossier?: {
      location: string;
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
    status: string;
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
  outcome_summary?: {
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
      scope: "project_only" | "current_goal_compliance" | (string & {});
      state: "clear" | "review" | "blocked" | "idle" | (string & {});
      label: string;
      detail: string;
    };
  };
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
  /* 简体中文：前端 snapshot 新增只读 criteria 状态及 events 历史字段 */
  criteria?: Array<{
    id: string;
    layer?: string;
    user_story: string;
    measurement: string;
    threshold: string;
    required?: boolean;
    status: string;
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

export type SnapshotResponse =
  | {
      ok: true;
      data: NoriSnapshot;
    }
  | {
      ok: false;
      error?: {
        type?: string;
        message?: string;
      };
    };
