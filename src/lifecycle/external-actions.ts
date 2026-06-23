export type ExternalActionStatus = "exists" | "will-run" | "unavailable" | "applied" | "failed";

export type ExternalCommandAction<Id extends string = string> = {
  id: Id;
  kind: string;
  action: ExternalActionStatus;
  command?: string[];
  command_display?: string;
  would_write: boolean;
  will_write: boolean;
  destructive: boolean;
  reason: string;
  recovery?: string;
  stdout?: string;
  stderr?: string;
};

export type ExternalActionSummary = {
  total: number;
  would_write: number;
  will_write: number;
  unavailable: number;
  destructive: number;
};

export function commandDisplay(command: string[]): string {
  return command.map((part) => (/^[a-zA-Z0-9_./@:=,-]+$/.test(part) ? part : JSON.stringify(part))).join(" ");
}

export function commandAction<Id extends string>(
  id: Id,
  kind: string,
  command: string[],
  reason: string,
  { exists = false, available = true, confirmed = false, recovery }: { exists?: boolean; available?: boolean; confirmed?: boolean; recovery?: string } = {}
): ExternalCommandAction<Id> {
  if (!available) {
    return {
      id,
      kind,
      action: "unavailable",
      command,
      command_display: commandDisplay(command),
      would_write: false,
      will_write: false,
      destructive: false,
      reason,
      recovery
    };
  }
  if (exists) {
    return {
      id,
      kind,
      action: "exists",
      command,
      command_display: commandDisplay(command),
      would_write: false,
      will_write: false,
      destructive: false,
      reason
    };
  }
  return {
    id,
    kind,
    action: "will-run",
    command,
    command_display: commandDisplay(command),
    would_write: true,
    will_write: confirmed,
    destructive: false,
    reason
  };
}

export function summarizeExternalActions(actions: ExternalCommandAction[]): ExternalActionSummary {
  return {
    total: actions.length,
    would_write: actions.filter((action) => action.would_write).length,
    will_write: actions.filter((action) => action.will_write).length,
    unavailable: actions.filter((action) => action.action === "unavailable").length,
    destructive: actions.filter((action) => action.destructive).length
  };
}
