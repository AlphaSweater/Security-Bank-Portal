import "#config/loadEnv.js";
import https from "https";
import http from "http";
import app from "./app.js";
import { loadCerts } from "#config/loadCerts.js";
import { getLogger } from "#utils/logger.js";
import { connectDB, closeDB } from "#config/db.js";
const logger = getLogger(import.meta.url);

const HTTPS_PORT = process.env.HTTPS_PORT;
const HTTP_PORT = process.env.HTTP_PORT;

async function startServer() {
  try {
    // Connect to database first
    logger.infoAsync("🔌 Connecting to MongoDB...");
    try {
      await connectDB();
      logger.infoAsync("✅ MongoDB connection established successfully!");
    } catch (dbError) {
      logger.errorAsync(`❌ Failed to connect to MongoDB: ${dbError.message}`);
      logger.errorAsync(
        "🛑 Server startup aborted due to database connection failure"
      );
      process.exit(1);
    }

    const options = await loadCerts();

    const httpsServer = https.createServer(options, app);
    httpsServer.listen(HTTPS_PORT, () => {
      logger.infoAsync(`✅ HTTPS server running on port ${HTTPS_PORT}`);
    });
    httpsServer.on("error", (err) => {
      logger.errorAsync(`HTTPS server error: ${err.message}`);
      process.exit(1);
    });

    const httpServer = http.createServer((req, res) => {
      res.writeHead(301, { Location: "https://" + req.headers.host + req.url });
      res.end();
    });
    httpServer.listen(HTTP_PORT, () => {
      logger.infoAsync(`🌍 HTTP redirect server running on port ${HTTP_PORT}`);
    });
    httpServer.on("error", (err) => {
      logger.errorAsync(`HTTP server error: ${err.message}`);
    });
  } catch (e) {
    logger.errorAsync(`Failed to start server: ${e.message}`);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
const shutdown = async () => {
  try {
    logger.infoAsync("Shutting down server...");
    await closeDB();
    logger.infoAsync("Shutdown complete.");
  } catch (e) {
    logger.errorAsync(`Error during shutdown: ${e.message}`);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("beforeExit", async () => {
  await shutdown();
});
