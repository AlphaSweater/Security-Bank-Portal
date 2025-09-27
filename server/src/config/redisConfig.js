import { createClient } from "redis";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);
const USE_REDIS_MOCK = process.env.USE_REDIS_MOCK === "true";

// Checks if all required Redis environment variables are set
function hasRedisEnv() {
  return (
    process.env.REDIS_HOST &&
    process.env.REDIS_PORT &&
    process.env.REDIS_USERNAME &&
    process.env.REDIS_PASSWORD
  );
}

// Returns a connected Redis client (real), or undefined for failover
async function getRedisClient() {
  if (USE_REDIS_MOCK) {
    logger.infoAsync("Using in-memory express-session for testing");
    return undefined;
  }

  if (!hasRedisEnv()) {
    logger.warnAsync(
      "Missing Redis environment variables. Falling back to in-memory express-session."
    );
    return undefined;
  }

  logger.infoAsync("⚡ Using real Redis client");
  try {
    const redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
    });
    redisClient.on("connect", () => logger.infoAsync("✅ Connected to Redis"));
    redisClient.on("error", (err) =>
      logger.errorAsync("❌ Redis error", err.message)
    );
    await redisClient.connect();
    return redisClient;
  } catch (err) {
    logger.errorAsync(
      `❌ Failed to connect to Redis: ${err.message}. Falling back to in-memory express-session.`
    );
    return undefined;
  }
}

// Export a promise that resolves to a Redis client (or undefined)
const redisInstancePromise = getRedisClient();
export default redisInstancePromise;
