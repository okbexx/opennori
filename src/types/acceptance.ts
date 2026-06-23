import type { ContractLanguage } from "./common.ts";

export type AcceptanceDiscoveryGap = {
  id: string;
  patterns?: string[];
  question: string;
  why: string;
  priority?: "must-answer" | "can-default" | string;
};

export type AcceptanceDiscovery = {
  protocol_version: "opennori/discovery-v1";
  id: string;
  goal: string;
  presentation?: {
    language?: ContractLanguage;
    [key: string]: unknown;
  };
  status: "needs-user-answers" | "ready-for-draft";
  is_acceptance_contract: false;
  gaps: AcceptanceDiscoveryGap[];
  next: string;
};

export type AcceptanceDiscoveryAnswers = {
  goal?: string;
  answers?: Record<string, string>;
  [gapId: string]: unknown;
};

export type AcceptanceQualityFinding = {
  criterion_id: string;
  path: string;
  gap_id: string;
  question: string;
  why: string;
  message?: string;
  agent_guidance?: string;
  source?: "heuristic" | string;
  severity: "needs-user-review" | string;
};

export type AcceptanceQualityAudit = {
  status: "needs-user-review" | "clear";
  summary: string;
  findings: AcceptanceQualityFinding[];
};

export type BrainstormCandidate = {
  id: string;
  title: string;
  user_value: string;
  suggested_goal_template: string;
  acceptance_directions: string[];
  risks: string[];
};

export type Brainstorm = {
  protocol_version: "opennori/brainstorm-v1";
  id: string;
  idea: string;
  presentation?: {
    language?: ContractLanguage;
    [key: string]: unknown;
  };
  status: "draft-source";
  candidates: BrainstormCandidate[];
  rule: string;
};
