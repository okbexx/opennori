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

export type CompletionAnswer = {
  complete: boolean;
  objective_complete: boolean;
  confidence: "confident" | "review-risk" | "not-complete" | (string & {});
  review_risks: string[];
  answer: string;
};

export type NoriSnapshot = {
  schema_version: string;
  generated_at: string;
  root: string;
  status: "active" | "no_active_goal" | (string & {});
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
  } | null;
  current_gap: {
    id: string;
    label: string;
    status: string;
    reason: string;
    latest_evidence?: string;
  } | null;
  need_user: boolean;
  user_action?: string;
  decision: "complete" | "not_complete" | "review_risk" | "no_active_goal" | (string & {});
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
  loop: {
    goal: string;
    contract: string;
    gap: string;
    evidence: string;
    decision: string;
  };
  last_event: NoriEvent | null;
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
