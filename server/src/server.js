import "#config/loadEnv.js";
import https from "https";
import http from "http";
import app from "./app.js";
import { loadCerts } from "#config/loadCerts.js";
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

const HTTPS_PORT = process.env.HTTPS_PORT;
const HTTP_PORT = process.env.HTTP_PORT;

async function startServer() {
  try {
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
