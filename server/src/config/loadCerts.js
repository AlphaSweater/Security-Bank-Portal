import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const certsDir = path.resolve(__dirname, "..", "..", "certs");

export async function loadCerts() {
  logger.infoAsync(`Looking for certs in: ${certsDir}`);
  try {
    logger.infoAsync("Loading SSL certificate and key...");
    const [key, cert] = await Promise.all([
      fs.readFile(path.join(certsDir, "server.key")),
      fs.readFile(path.join(certsDir, "server.crt")),
    ]);
    logger.infoAsync("SSL certificate and key loaded successfully.");
    return { key, cert };
  } catch (e) {
    logger.errorAsync(
      `Failed to load SSL certs from ${certsDir}: ${e.message}`
    );
    throw e;
  }
}
