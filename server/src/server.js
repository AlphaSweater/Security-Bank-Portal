import "#config/loadEnv.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";
import app from "./app.js";
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const certsDir = path.join(rootDir, "certs");

const options = {
  key: fs.readFileSync(path.join(certsDir, "server.key")),
  cert: fs.readFileSync(path.join(certsDir, "server.crt")),
};

const HTTPS_PORT = process.env.HTTPS_PORT || 5000;
const HTTP_PORT = process.env.HTTP_PORT || 8080;

https.createServer(options, app).listen(HTTPS_PORT, () => {
  logger.info(`✅ HTTPS server running on port ${HTTPS_PORT}`);
});

http
  .createServer((req, res) => {
    res.writeHead(301, { Location: "https://" + req.headers.host + req.url });
    res.end();
  })
  .listen(HTTP_PORT, () => {
    logger.info(`🌍 HTTP redirect server running on port ${HTTP_PORT}`);
  });
