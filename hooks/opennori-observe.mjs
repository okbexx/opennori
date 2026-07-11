#!/usr/bin/env node

import { retryStateBusy } from "../dist/src/cli-output.js";
import { recordCodexCoordinationHook } from "../dist/src/coordination.js";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

try {
  const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  await retryStateBusy(() => recordCodexCoordinationHook(input));
  process.stdout.write("{}\n");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const recovery = error && typeof error === "object" && "recovery" in error && typeof error.recovery === "string" ? error.recovery : null;
  process.stdout.write(
    `${JSON.stringify({
      systemMessage: `OpenNori coordination observation was not recorded: ${message}${recovery ? ` Next: ${recovery}` : ""}`
    })}\n`
  );
}
