import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..", "..");
const envPath = path.join(rootDir, ".env");

// Detect if running in a hosted environment
const isHosted = process.env.HOSTED_ENV === "true";

if (!isHosted) {
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.warn(
      `[loadEnvConfig] dotenv failed to load .env file: ${result.error.message}`
    );
  } else {
    console.log(
      "[loadEnvConfig] Loaded environment variables from local .env file"
    );
  }
} else {
  console.log(
    "[loadEnvConfig] Using environment variables from host environment"
  );
}
