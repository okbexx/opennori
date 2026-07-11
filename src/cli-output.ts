import pRetry from "p-retry";
import { asOpenNoriError } from "./errors.ts";

type HumanRenderer<T> = (value: T) => string;

const CLI_LOCK_RETRY_OPTIONS = {
  retries: 10,
  factor: 1.5,
  minTimeout: 50,
  maxTimeout: 500,
  maxRetryTime: 5000,
  randomize: true,
  unref: false
} as const;

/** Wait briefly for another OpenNori CLI process without retrying domain failures. */
export function retryStateBusy<T>(action: () => T | Promise<T>): Promise<T> {
  return pRetry(action, {
    ...CLI_LOCK_RETRY_OPTIONS,
    shouldRetry: ({ error }) => asOpenNoriError(error).code === "state_busy"
  });
}

/** Run one CLI action with stable JSON errors and deliberately small human output. */
export async function runCliAction<T>(
  json: boolean | undefined,
  action: () => T | Promise<T>,
  renderHuman: HumanRenderer<T>,
  { retryBusy = true }: { retryBusy?: boolean } = {}
): Promise<void> {
  try {
    const value = retryBusy ? await retryStateBusy(action) : await action();
    process.stdout.write(json ? `${JSON.stringify({ ok: true, data: value }, null, 2)}\n` : `${renderHuman(value).trimEnd()}\n`);
  } catch (error) {
    const failure = asOpenNoriError(error);
    if (json) {
      process.stderr.write(
        `${JSON.stringify(
          {
            ok: false,
            error: {
              code: failure.code,
              message: failure.message,
              recovery: failure.recovery,
              context: failure.context
            }
          },
          null,
          2
        )}\n`
      );
    } else {
      process.stderr.write(`OpenNori: ${failure.message}\n`);
      if (failure.recovery) process.stderr.write(`Next: ${failure.recovery}\n`);
    }
    process.exitCode = 1;
  }
}

export function renderPlan(plan: {
  operation: string;
  actions: Array<{ type: string; path: string; reason: string }>;
  blockers: string[];
  warnings: string[];
}): string {
  const lines = [`OpenNori ${plan.operation} plan`];
  const visibleActions = plan.actions.filter((action) => action.type !== "skip");
  if (visibleActions.length === 0) lines.push("  No managed changes.");
  for (const action of visibleActions) lines.push(`  ${action.type.padEnd(8)} ${action.path}  ${action.reason}`);
  for (const warning of plan.warnings) lines.push(`Warning: ${warning}`);
  for (const blocker of plan.blockers) lines.push(`Blocked: ${blocker}`);
  return lines.join("\n");
}
