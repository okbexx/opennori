import type { EvidenceSource } from "./evidence.ts";
import type { ProfileComplianceStatus, ProfileItemType, ProfileStrength } from "./profile.ts";

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
