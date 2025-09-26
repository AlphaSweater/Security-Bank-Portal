// loggerTestHelpers.js
// Helper utilities for logger spies in unit tests
import util from "util";
import logger from "#utils/logger.js";
import { vi, expect } from "vitest";

/**
 * Sets up spies for logger.info, logger.error, logger.debug.
 * @returns {{ infoSpy, errorSpy, debugSpy }}
 */
export function setupLoggerSpies() {
  const infoSpy = vi.spyOn(logger, "info").mockImplementation(() => {});
  const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
  const debugSpy = vi.spyOn(logger, "debug").mockImplementation(() => {});
  return { infoSpy, errorSpy, debugSpy };
}

/**
 * Restores all logger spies.
 * @param {{ infoSpy, errorSpy, debugSpy }} spies
 */
export function teardownLoggerSpies(spies) {
  spies.infoSpy.mockRestore();
  spies.errorSpy.mockRestore();
  spies.debugSpy.mockRestore();
}

/**
 * Prints logger calls if the test failed (Vitest only prints if assertion fails).
 * Call in afterEach.
 * @param {{ infoSpy, errorSpy, debugSpy }} spies
 */
export function printLoggerSpiesIfFailed(spies) {
  // Only print if the test failed (Vitest: afterEach runs after assertion errors)
  // This is a best-effort: you may want to always print in debug mode
  const state = expect.getState && expect.getState();
  if (
    state &&
    state.currentTestName &&
    state.testPath &&
    state.assertions &&
    state.assertions.some((a) => a.status === "failed")
  ) {
    for (const [name, spy] of Object.entries(spies)) {
      if (spy.mock.calls.length > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[logger.${name} calls]`,
          util.inspect(spy.mock.calls, { depth: null, colors: true })
        );
      }
    }
  }
}
