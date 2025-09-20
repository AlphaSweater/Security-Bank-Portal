import fs from "fs";
import https from "https";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import app from "./app.js";
import logger from "./logger.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const certPath = path.resolve(
  process.env.SSL_PATH || path.join(__dirname, "../certs")
);
const options = {
  key: fs.readFileSync(path.join(certPath, "server.key")),
  cert: fs.readFileSync(path.join(certPath, "server.crt")),
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
