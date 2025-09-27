import https from "https";
import http from "http";
import "#config/loadEnvConfig.js";
import { loadCerts } from "#config/loadCertsConfig.js";
import { connectDB, closeDB } from "#config/mongoDBConfig.js";
import app from "./app.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);
const isProduction = process.env.SERVER_MODE === "production";
const isHosted = process.env.IS_HOSTED_ENV === "true";
const PORT = process.env.PORT;
const REDIRECT_PORT = process.env.REDIRECT_PORT || 8080;

// Start the server (hosted: HTTP, local: HTTPS + HTTP redirect)
async function startServer() {
  logger.infoAsync("🔌 Connecting to MongoDB...");
  try {
    await connectDB();
    logger.infoAsync("🔌 MongoDB connection established successfully!");
  } catch (err) {
    logger.errorAsync(`❌ Failed to connect to MongoDB: ${err.message}`);
    logger.errorAsync(
      "🛑 Server startup aborted due to database connection failure"
    );
    process.exit(1);
  }

  if (!PORT) {
    logger.errorAsync("❌ PORT environment variable is not set.");
    process.exit(1);
  }

  logger.infoAsync(
    `🌍 Server setup for ${isHosted ? "hosted" : "local"} environment with ${
      isProduction ? "production" : "development"
    } settings`
  );

  logger.infoAsync("🚀 Starting server...");

  if (isHosted) {
    // Hosted: HTTP only (Render handles HTTPS)
    const httpServer = http.createServer(app);
    httpServer.listen(PORT, () => {
      logger.infoAsync(`✅ HTTP server running on port ${PORT}`);
    });
    httpServer.on("error", (err) => {
      logger.errorAsync(`HTTP server error: ${err.message}`);
      process.exit(1);
    });
    return;
  }

  // Local: HTTPS + HTTP redirect
  let sslOptions;
  try {
    sslOptions = await loadCerts();
  } catch (err) {
    logger.errorAsync(`❌ Failed to load SSL certificates: ${err.message}`);
    process.exit(1);
  }

  const httpsServer = https.createServer(sslOptions, app);
  httpsServer.listen(PORT, () => {
    logger.infoAsync(`✅ HTTPS server running on port ${PORT}`);
  });
  httpsServer.on("error", (err) => {
    logger.errorAsync(`HTTPS server error: ${err.message}`);
    process.exit(1);
  });

  // HTTP redirect to HTTPS
  const httpRedirectServer = http.createServer((req, res) => {
    const host = req.headers.host || `localhost:${PORT}`;
    res.writeHead(301, { Location: `https://${host}${req.url}` });
    res.end();
  });
  httpRedirectServer.listen(REDIRECT_PORT, () => {
    logger.debugAsync(
      `🌍 HTTP redirect server running on port ${REDIRECT_PORT}`
    );
  });
  httpRedirectServer.on("error", (err) => {
    logger.errorAsync(`HTTP redirect server error: ${err.message}`);
  });
}

startServer();

// Graceful shutdown
async function shutdown() {
  try {
    logger.infoAsync("Shutting down server...");
    await closeDB();
    logger.infoAsync("Shutdown complete.");
  } catch (err) {
    logger.errorAsync(`Error during shutdown: ${err.message}`);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("beforeExit", shutdown);
