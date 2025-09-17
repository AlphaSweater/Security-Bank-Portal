import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  env: process.env.NODE_ENV || "development",
  httpsPort: process.env.HTTPS_PORT || 3443,
  httpPort: process.env.HTTP_PORT || 3080,
  certPath: process.env.CERT_PATH || path.join(__dirname, "../certs"),
  certKey: process.env.CERT_KEY || "server.key",
  certCrt: process.env.CERT_CRT || "server.crt",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
