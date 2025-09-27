import pino from "pino";
import path from "path";

const showDebugLogs = process.env.SHOW_DEBUG_LOGS === "true";

const baseLogger = pino({
  level: showDebugLogs ? "debug" : "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "pid,hostname",
    },
  },
});

function getLogger(moduleUrlOrName) {
  let label = "";
  if (typeof moduleUrlOrName === "string") {
    try {
      let filePath = moduleUrlOrName.replace("file://", "");
      label = path.basename(filePath, path.extname(filePath));
    } catch {
      label = moduleUrlOrName;
    }
  } else {
    label = "unknown";
  }

  const COLOR_RESET = "\x1b[0m";
  const logWithLabel = (labelPrefix, level, msg, ...args) => {
    let displayLabel = labelPrefix;

    if (typeof msg === "string") {
      if (level === "info") {
        baseLogger[level](`[${displayLabel}]${COLOR_RESET} ${msg}`, ...args);
      } else {
        baseLogger[level](`[${displayLabel}] ${msg}`, ...args);
      }
    } else {
      baseLogger[level](msg, ...args);
    }
  };

  // Only enable debug methods if showDebugLogs is true
  const debugFn = showDebugLogs
    ? (msg, ...args) => logWithLabel(`${label}: Sync`, "debug", msg, ...args)
    : () => {};
  const debugAsyncFn = showDebugLogs
    ? (msg, ...args) => logWithLabel(`${label}: Async`, "debug", msg, ...args)
    : () => {};

  return {
    info: (msg, ...args) =>
      logWithLabel(`${label}: Sync`, "info", msg, ...args),
    warn: (msg, ...args) =>
      logWithLabel(`${label}: Sync`, "warn", msg, ...args),
    error: (msg, ...args) =>
      logWithLabel(`${label}: Sync`, "error", msg, ...args),
    debug: debugFn,
    fatal: (msg, ...args) =>
      logWithLabel(`${label}: Sync`, "fatal", msg, ...args),
    trace: (msg, ...args) =>
      logWithLabel(`${label}: Sync`, "trace", msg, ...args),
    infoAsync: (msg, ...args) =>
      logWithLabel(`${label}: Async`, "info", msg, ...args),
    warnAsync: (msg, ...args) =>
      logWithLabel(`${label}: Async`, "warn", msg, ...args),
    errorAsync: (msg, ...args) =>
      logWithLabel(`${label}: Async`, "error", msg, ...args),
    debugAsync: debugAsyncFn,
    fatalAsync: (msg, ...args) =>
      logWithLabel(`${label}: Async`, "fatal", msg, ...args),
    traceAsync: (msg, ...args) =>
      logWithLabel(`${label}: Async`, "trace", msg, ...args),
  };
}

// For legacy usage: import logger from ...
export default getLogger("global");
export { getLogger };
