import assert from "node:assert/strict";
import { test } from "vitest";
import { ROOT, runArchitectureProfilesCommand, runDoctorCommand } from "./support/command-fixtures.js";

test("citty command modules preserve agent-readable JSON payloads", { tags: ["cli", "unit", "quick"] }, async () => {
  const profiles = await runArchitectureProfilesCommand(["--root", ROOT, "--json"]);
  assert.equal(profiles.ok, true);
  assert.equal(profiles.data.side_effect, "none");
  assert.equal(profiles.data.profiles.some((profile) => profile.id === "typescript-agent-state-cli"), true);

  const doctor = await runDoctorCommand(["--root", ROOT, "--json"]);
  assert.equal(doctor.ok, true);
  assert.equal(doctor.data.name, "opennori");
  assert.equal(doctor.data.side_effect, "none");
  assert.equal(doctor.data.agent_next.schema_version, "opennori/agent-next-v1");
});
