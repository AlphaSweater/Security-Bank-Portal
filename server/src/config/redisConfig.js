import { createClient } from "redis";
import RedisMock from "ioredis-mock";
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

// Returns a connected Redis client (real or mock)
async function getRedisClient() {
  if (!USE_REDIS_MOCK && hasRedisEnv()) {
    logger.info("⚡ Using real Redis client");
    try {
      const redisClient = createClient({
        socket: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
        },
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
      });
      redisClient.on("connect", () => logger.info("✅ Connected to Redis"));
      redisClient.on("error", (err) =>
        logger.error("❌ Redis error", err.message)
      );
      await redisClient.connect();
      return redisClient;
    } catch (err) {
      logger.error(
        `❌ Failed to connect to Redis: ${err.message}. Falling back to ioredis-mock.`
      );
    }
  }

  // Use mock if env vars missing or USE_REDIS_MOCK is true
  if (USE_REDIS_MOCK) {
    logger.info("⚡ Using ioredis-mock (test mode, USE_REDIS_MOCK=true)");
  } else {
    logger.warn(
      "⚡ Missing Redis environment variables. Using ioredis-mock (test mode)."
    );
  }

  const redisClientMock = new RedisMock();
  return redisClientMock;
}

// Export a promise that resolves to a Redis client
const redisInstancePromise = getRedisClient();
export default redisInstancePromise;
