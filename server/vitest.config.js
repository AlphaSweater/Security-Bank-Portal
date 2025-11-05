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
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage", // -> server/coverage/lcov.info
      all: true,
      include: ["src/services/**", "src/models/**", "src/middlewares/**"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/*.config.*",
        "**/vitest.config.*",
        "**/test/**",
      ],
    },

    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: process.env.CI
      ? { junit: "test-results/junit.xml" }
      : undefined,
  },
});
