/** Stable domain error surfaced by both human and JSON CLI output. */
export class OpenNoriError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;
  readonly recovery?: string;

  constructor(code: string, message: string, options: { context?: Record<string, unknown>; recovery?: string } = {}) {
    super(message);
    this.name = "OpenNoriError";
    this.code = code;
    this.context = options.context;
    this.recovery = options.recovery;
  }
}

export function asOpenNoriError(error: unknown): OpenNoriError {
  if (error instanceof OpenNoriError) return error;
  return new OpenNoriError("internal_error", error instanceof Error ? error.message : String(error));
}
