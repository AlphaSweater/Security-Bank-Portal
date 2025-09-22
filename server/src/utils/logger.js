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
          translateTime: "SYS:standard",
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

  // Return a logger with methods that prefix messages with [label]
  const wrap =
    (level) =>
    (msg, ...args) => {
      if (typeof msg === "string") {
        baseLogger[level](`[${label}] ${msg}`, ...args);
      } else {
        // If first arg is an object, pass as is
        baseLogger[level](msg, ...args);
      }
    };

  return {
    info: wrap("info"),
    warn: wrap("warn"),
    error: wrap("error"),
    debug: wrap("debug"),
    fatal: wrap("fatal"),
    trace: wrap("trace"),
  };
}

// For legacy usage: import logger from ...
export default getLogger("global");
export { getLogger };
