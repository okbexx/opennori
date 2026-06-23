export type ActiveGoalArgs = {
  root?: unknown;
  goal?: unknown;
  acceptance?: unknown;
  evidence?: unknown;
  fromDraft?: unknown;
};

export const activeGoalArgs = {
  root: {
    type: "string",
    description: "Project root.",
    default: process.cwd()
  },
  goal: {
    type: "string",
    description: "Active goal id."
  },
  acceptance: {
    type: "string",
    description: "Explicit goal README path."
  },
  evidence: {
    type: "string",
    description: "Explicit goal ledger JSON path."
  },
  fromDraft: {
    type: "boolean",
    description: "Read from draft contracts instead of the current contract.",
    default: false
  }
} as const;
