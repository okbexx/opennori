import type { AcceptanceStatus, ContractLanguage, RiskLevel } from "./common.ts";

export type AcceptanceBasis = {
  status: "draft" | "approved" | (string & {});
  summary?: string;
  approved_at?: string;
  [key: string]: unknown;
};

export type AcceptanceCriterion = {
  id: string;
  layer?: string;
  user_story: string;
  measurement: string;
  threshold: string;
  required?: boolean;
  risk?: RiskLevel;
  status?: AcceptanceStatus | string;
  [key: string]: unknown;
};

export type NoriBrief = {
  goal_id?: string;
  goal: string;
  presentation?: {
    language?: ContractLanguage;
    [key: string]: unknown;
  };
  acceptance_basis?: AcceptanceBasis;
  criteria: AcceptanceCriterion[];
  [key: string]: unknown;
};

export type NoriContract = {
  protocol_version: string;
  goal_id: string;
  goal: string;
  created_at?: string;
  presentation?: {
    language?: ContractLanguage;
    [key: string]: unknown;
  };
  acceptance_basis?: AcceptanceBasis;
  criteria: AcceptanceCriterion[];
  [key: string]: unknown;
};

export type CurrentGap = {
  id: string;
  user_story: string;
  status: AcceptanceStatus;
  reason: string;
};

export type UserIntervention = {
  required: boolean;
  criterion?: string;
  user_story?: string;
  action: string;
};

export type CompletionAnswer = {
  complete: boolean;
  objective_complete: boolean;
  confidence: "confident" | "review-risk" | "not-complete" | (string & {});
  review_risks: string[];
  answer: string;
};
