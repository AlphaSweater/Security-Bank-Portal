import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..", "..");
const envPath = path.join(rootDir, ".env");

// Load environment variables
const result = dotenv.config({ path: envPath });

if (result.error) {
  logger.warn(`dotenv failed to load .env at: ${envPath}`);
} else {
  // Count non-empty, non-comment lines with `=`
  let envVarCount = 0;
  try {
    const envFileContent = fs.readFileSync(envPath, "utf-8");
    envVarCount = envFileContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(
        (line) => line && !line.startsWith("#") && line.includes("=")
      ).length;
  } catch (e) {
    logger.warn(`Could not read .env file to count variables: ${e.message}`);
  }

  logger.info(`Loaded .env from: ${envPath}`);
  logger.info(`Found ${envVarCount} environment variable(s) in .env file`);
}
