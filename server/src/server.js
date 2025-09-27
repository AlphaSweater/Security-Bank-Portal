import https from "https";
import http from "http";
import "#config/loadEnvConfig.js";
import { loadCerts } from "#config/loadCertsConfig.js";
import { connectDB, closeDB } from "#config/mongoDBConfig.js";
import app from "./app.js";
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

const SERVER_MODE = process.env.SERVER_MODE || "development";
const PORT = process.env.PORT;

async function startServer() {
  try {
    // Connect to database first
    logger.infoAsync("🔌 Connecting to MongoDB...");
    try {
      await connectDB();
      logger.infoAsync("🔌 MongoDB connection established successfully!");
    } catch (dbError) {
      logger.errorAsync(`❌ Failed to connect to MongoDB: ${dbError.message}`);
      logger.errorAsync(
        "🛑 Server startup aborted due to database connection failure"
      );
      process.exit(1);
    }

    // Start server
    logger.infoAsync("🚀 Starting server...");

    if (!PORT) {
      logger.errorAsync("❌ PORT environment variable is not set.");
      process.exit(1);
    }

    logger.infoAsync(`Server running in ${SERVER_MODE} mode`);

    if (SERVER_MODE === "production") {
      // Production: HTTP only (Render handles HTTPS)
      const httpServer = http.createServer(app);
      httpServer.listen(PORT, () => {
        logger.infoAsync(`✅ HTTP server running on port ${PORT}`);
      });
      httpServer.on("error", (err) => {
        logger.errorAsync(`HTTP server error: ${err.message}`);
        process.exit(1);
      });
    } else if (SERVER_MODE === "development") {
      // Development: HTTPS + HTTP redirect

      // Load SSL certs
      const options = await loadCerts();

      // Use PORT for HTTPS in development
      const httpsServer = https.createServer(options, app);
      httpsServer.listen(PORT, () => {
        logger.infoAsync(`✅ HTTPS server running on port ${PORT}`);
      });
      httpsServer.on("error", (err) => {
        logger.errorAsync(`HTTPS server error: ${err.message}`);
        process.exit(1);
      });

      // Redirect HTTP to HTTPS on a separate port
      const httpRedirectPort = process.env.REDIRECT_PORT || 8080;
      const httpServer = http.createServer((req, res) => {
        res.writeHead(301, {
          Location: "https://" + req.headers.host + req.url,
        });
        res.end();
      });
      httpServer.listen(httpRedirectPort, () => {
        logger.debugAsync(
          `🌍 HTTP redirect server running on port ${httpRedirectPort}`
        );
      });
      httpServer.on("error", (err) => {
        logger.errorAsync(`HTTP server error: ${err.message}`);
      });
    } else {
      logger.errorAsync(
        `❌ Invalid SERVER_MODE: ${SERVER_MODE}. Must be 'development' or 'production'.`
      );
      process.exit(1);
    }
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
