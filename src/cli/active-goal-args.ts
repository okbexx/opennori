export type ActiveGoalArgs = {
  root?: unknown;
  goal?: unknown;
  dossier?: unknown;
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
  dossier: {
    type: "string",
    description: "Explicit Nori Contract dossier directory. Reads contract.json and ledger.json; Markdown is not parsed as state."
  },
  acceptance: {
    type: "string",
    description: "Legacy generated goal README path used only to locate the dossier. Markdown is not parsed as state."
  },
  evidence: {
    type: "string",
    description: "Legacy goal ledger JSON path, required with --acceptance."
  },
  fromDraft: {
    type: "boolean",
    description: "Read from draft contracts instead of the current contract.",
    default: false
  }
} as const;
