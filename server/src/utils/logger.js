import pino from "pino";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";

const baseLogger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          // Show only time in 24h format with seconds in dev, full date+time in prod
          translateTime: "HH:MM:ss", // 24h:minutes:seconds
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

function getLogger(moduleUrlOrName) {
  let label = "";
  if (typeof moduleUrlOrName === "string") {
    // If it's a file URL (import.meta.url), extract the filename
    try {
      // Remove file:// if present
      let filePath = moduleUrlOrName.replace("file://", "");
      label = path.basename(filePath, path.extname(filePath));
    } catch {
      label = moduleUrlOrName;
    }
  } else {
    label = "unknown";
  }

  // ANSI color codes
  const COLOR_YELLOW = "\x1b[33m";
  const COLOR_BLUE = "\x1b[34m";
  const COLOR_RESET = "\x1b[0m";

  // Helper to format log prefix: [label] or [Async-label] message, with colored Async/Sync in dev
  const logWithLabel = (labelPrefix, level, msg, ...args) => {
    let displayLabel = labelPrefix;
    if (isDev) {
      if (labelPrefix.endsWith(": Async")) {
        displayLabel = labelPrefix.replace(
          /: Async$/,
          `: ${COLOR_YELLOW}Async${COLOR_RESET}`
        );
      } else if (labelPrefix.endsWith(": Sync")) {
        displayLabel = labelPrefix.replace(
          /: Sync$/,
          `: ${COLOR_BLUE}Sync${COLOR_RESET}`
        );
      }
    }
    if (typeof msg === "string") {
      baseLogger[level](`[${displayLabel}] ${msg}`, ...args);
    } else {
      baseLogger[level](msg, ...args);
    }
  };

  return {
    // Sync logs
    info: (msg, ...args) =>
      logWithLabel(`${label}: Sync`, "info", msg, ...args),
    warn: (msg, ...args) =>
      logWithLabel(`${label}: Sync`, "warn", msg, ...args),
    error: (msg, ...args) =>
      logWithLabel(`${label}: Sync`, "error", msg, ...args),
    debug: (msg, ...args) =>
      logWithLabel(`${label}: Sync`, "debug", msg, ...args),
    fatal: (msg, ...args) =>
      logWithLabel(`${label}: Sync`, "fatal", msg, ...args),
    trace: (msg, ...args) =>
      logWithLabel(`${label}: Sync`, "trace", msg, ...args),
    // Async logs
    infoAsync: (msg, ...args) =>
      logWithLabel(`${label}: Async`, "info", msg, ...args),
    warnAsync: (msg, ...args) =>
      logWithLabel(`${label}: Async`, "warn", msg, ...args),
    errorAsync: (msg, ...args) =>
      logWithLabel(`${label}: Async`, "error", msg, ...args),
    debugAsync: (msg, ...args) =>
      logWithLabel(`${label}: Async`, "debug", msg, ...args),
    fatalAsync: (msg, ...args) =>
      logWithLabel(`${label}: Async`, "fatal", msg, ...args),
    traceAsync: (msg, ...args) =>
      logWithLabel(`${label}: Async`, "trace", msg, ...args),
  };
}

// For legacy usage: import logger from ...
export default getLogger("global");
export { getLogger };
