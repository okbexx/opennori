import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["test/**/*.test.{js,ts}"],
    tags: [
      { name: "acceptance" },
      { name: "architecture" },
      { name: "cli" },
      { name: "core" },
      { name: "dashboard" },
      { name: "docs" },
      { name: "evidence" },
      { name: "lifecycle" },
      { name: "package" },
      { name: "profile" },
      { name: "quick" },
      { name: "reporting" },
      { name: "schema" },
      { name: "unit" }
    ],
    testTimeout: 30_000
  }
});
