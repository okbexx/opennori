#!/usr/bin/env node

import { buildHostHookContext } from "../dist/src/hook-context.js";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

try {
  const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const platform = process.argv[2] === "claude" ? "claude" : "codex";
  const result = buildHostHookContext(input, platform);
  if (result) {
    process.stdout.write(
      `${JSON.stringify({
        hookSpecificOutput: {
          hookEventName: result.hook_event_name,
          additionalContext: result.context
        }
      })}\n`
    );
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const recovery = error && typeof error === "object" && "recovery" in error && typeof error.recovery === "string" ? error.recovery : null;
  process.stdout.write(
    `${JSON.stringify({
      systemMessage: `OpenNori context could not be loaded: ${message}${recovery ? ` Next: ${recovery}` : ""}`
    })}\n`
  );
}
