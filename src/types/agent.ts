export type AgentSkill =
  | "nori"
  | "nori-autogoal"
  | "nori-acceptance"
  | "nori-architecture-apply"
  | "nori-architecture-brainstorm"
  | "nori-architecture-challenge"
  | "nori-build-vs-buy"
  | "nori-capability-profile"
  | "nori-evidence"
  | "nori-project-health"
  | "nori-reporting";

export type NextRecommendation = {
  status:
    | "user-intervention-required"
    | "acceptance-approval-required"
    | "architecture-requirement-required"
    | "architecture-review-required"
    | "work-on-current-gap"
    | "evidence-review-required"
    | "completion-review-required"
    | "ready-for-next-loop"
    | "reconcile-workflow-state"
    | (string & {});
  focus: string | null;
  summary: string;
  actions: string[];
  recommended_skill?: AgentSkill;
};

export type AgentNext = {
  schema_version: "opennori/agent-next-v1";
  state:
    | "setup_preview_needs_confirmation"
    | "initialized_no_active_contract"
    | "ready_with_current_goal"
    | "health_needs_recovery"
    | "work_on_current_gap"
    | "acceptance_needs_user"
    | "architecture_requirement_needs_decision"
    | "architecture_needs_review"
    | "evidence_ready_for_recording"
    | "evidence_needs_review"
    | "completion_needs_review"
    | "ready_for_next_loop"
    | "state_needs_reconcile"
    | "unknown";
  recommended_skill: AgentSkill | null;
  summary: string;
  instruction: string;
  user_visible_next: string;
  goal_id?: string;
  current_gap_id?: string | null;
  needs_user?: boolean;
  safe_next_command?: string;
  commands?: string[];
  dashboard_activity?: {
    recommended: boolean;
    target: {
      goal_id?: string;
      gap_id?: string | null;
    };
    start_command?: string;
    heartbeat_command?: string;
    finish_command?: string;
    note: string;
  };
};
