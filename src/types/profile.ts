export type ProfileItemType = "skill" | "stack" | "constraint";

export type ProfileStrength = "must" | "prefer" | "avoid";

export type ProfileEvidenceResult = "satisfied" | "violated" | "waived";

export type ProfileComplianceStatus = "unknown" | ProfileEvidenceResult;

export type CapabilityProfileEvidence = {
  item_id: string;
  result: ProfileEvidenceResult;
  summary?: string;
  path?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type CapabilityProfileItem = {
  id: string;
  type: ProfileItemType;
  name: string;
  strength: ProfileStrength;
  purpose?: string;
  scope?: string;
  install_policy?: string;
  evidence?: CapabilityProfileEvidence[];
  [key: string]: unknown;
};

export type CapabilityProfile = {
  schema_version?: "opennori/project-profile-v1" | (string & {});
  updated_at?: string;
  items: CapabilityProfileItem[];
};

export type ProfileItemInput = {
  id?: string;
  type?: ProfileItemType;
  name: string;
  strength?: ProfileStrength;
  purpose?: string;
  scope?: string;
  install_policy?: string;
  [key: string]: unknown;
};

export type ProfileEvidenceInput = {
  result: ProfileEvidenceResult;
  summary?: string;
  path?: string;
  [key: string]: unknown;
};

export type ProfileStatusRow = {
  id: string;
  type: ProfileItemType;
  name: string;
  strength: ProfileStrength;
  purpose?: string;
  status: ProfileComplianceStatus;
  summary: string;
};

export type ProfileCompliance = {
  required: boolean;
  complete: boolean;
  blocking: ProfileStatusRow[];
  review: ProfileStatusRow[];
  statuses: ProfileStatusRow[];
};
