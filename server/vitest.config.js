import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    watch: false,
    passWithNoTests: true,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"], // lcov required for SonarQube
      reportsDirectory: "./coverage",
      all: true, // include untested files in report
      include: ["src/services/**", "src/models/**"], // only measure key backend code
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/*.config.*",
        "**/vitest.config.*",
        "**/test/**", // don't include test files in coverage
      ],
    },

    // (Optional) JUnit results for CI if you ever want them
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: process.env.CI
      ? { junit: "test-results/junit.xml" }
      : undefined,
  },
});
