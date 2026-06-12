import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["test/**/*.test.{js,ts}"],
    testTimeout: 30_000
  }
});
