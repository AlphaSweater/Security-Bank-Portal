import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

// Centralized error handling middleware
export default function errorHandler(err, req, res, next) {
  logger.error(
    {
      err,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      status: err.status || 500,
    },
    err.message || "Unhandled error"
  );
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
}
