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

  try {
    const [key, cert] = await Promise.all([
      fs.readFile(path.join(certsDir, certKeyFile)),
      fs.readFile(path.join(certsDir, certCrtFile)),
    ]);

    return { key, cert };
  } catch (e) {
    logger.errorAsync(
      `Failed to load SSL certs from ${certsDir} (key: ${certKeyFile}, cert: ${certCrtFile}): ${e.message}`
    );
    throw e;
  }
}
