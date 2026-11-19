import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // unit tests only — e2e specs belong to Playwright
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
