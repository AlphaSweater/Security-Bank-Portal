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

// Starts the server (hosted: HTTP, local: HTTPS + HTTP redirect)
async function startServer() {
  try {
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

    logger.infoAsync("🚀 Starting server...");
    if (!PORT) {
      logger.errorAsync("❌ PORT environment variable is not set.");
      process.exit(1);
    }

    logger.infoAsync(
      `🌍 Server running in ${isHosted ? "hosted" : "local"} environment with ${
        isProduction ? "production" : "development"
      } settings`
    );

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
    } else {
      // Local: HTTPS + HTTP redirect
      let options;
      try {
        options = await loadCerts();
      } catch (certError) {
        logger.errorAsync(
          `❌ Failed to load SSL certificates: ${certError.message}`
        );
        process.exit(1);
      }

      const httpsServer = https.createServer(options, app);
      httpsServer.listen(PORT, () => {
        logger.infoAsync(`✅ HTTPS server running on port ${PORT}`);
      });
      httpsServer.on("error", (err) => {
        logger.errorAsync(`HTTPS server error: ${err.message}`);
        process.exit(1);
      });

      // HTTP redirect to HTTPS
      const httpRedirectPort = process.env.REDIRECT_PORT || 8080;
      const httpServer = http.createServer((req, res) => {
        // Safely handle missing host header
        const host = req.headers.host || `localhost:${PORT}`;
        res.writeHead(301, {
          Location: `https://${host}${req.url}`,
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
