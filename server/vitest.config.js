import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    watch: false,
    passWithNoTests: true,

    // JUnit for CircleCI Tests tab
    reporters: ["default", "junit"],
    outputFile: {
      junit: "test-results/junit.xml",
    },

    // Coverage for artifacts
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
  },
});
