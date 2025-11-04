import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    watch: false,
    passWithNoTests: true,

    // Reporters: show JUnit in CI, default locally
    reporters: process.env.CI ? ["junit"] : ["default", "junit"],
    outputFile: {
      junit: "test-results/junit.xml",
    },

    // Coverage reports
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"], // lcov = required for SonarQube
      reportsDirectory: "coverage", // CircleCI + Sonar expects ./coverage/lcov.info
      all: true,
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/*.config.*",
        "**/vitest.config.*",
      ],
    },
  },
});
