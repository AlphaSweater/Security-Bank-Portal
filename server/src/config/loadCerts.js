import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const certsDir = path.resolve(__dirname, "..", "..", "certs");

export async function loadCerts() {
  const certKeyFile = process.env.CERT_KEY || "server.key";
  const certCrtFile = process.env.CERT_CRT || "server.crt";
  logger.infoAsync(`Looking for certs in: ${certsDir}`);
  logger.infoAsync(`Using key file: ${certKeyFile}, cert file: ${certCrtFile}`);
  try {
    logger.infoAsync("Loading SSL certificate and key...");
    const [key, cert] = await Promise.all([
      fs.readFile(path.join(certsDir, certKeyFile)),
      fs.readFile(path.join(certsDir, certCrtFile)),
    ]);
    logger.infoAsync("SSL certificate and key loaded successfully.");
    return { key, cert };
  } catch (e) {
    logger.errorAsync(
      `Failed to load SSL certs from ${certsDir} (key: ${certKeyFile}, cert: ${certCrtFile}): ${e.message}`
    );
    throw e;
  }
}
