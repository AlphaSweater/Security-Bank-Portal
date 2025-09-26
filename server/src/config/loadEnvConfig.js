import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..", "..");
const envPath = path.join(rootDir, ".env");

const result = dotenv.config({ path: envPath });

if (result.error) {
  logger.warn(`dotenv failed to load .env file: ${result.error.message}`);
}
