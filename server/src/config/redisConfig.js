import { createClient } from "redis";
import RedisMock from "ioredis-mock";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

const USE_REDIS_MOCK = process.env.USE_REDIS_MOCK === "true";

let redisClient;

if (USE_REDIS_MOCK) {
  redisClient = new RedisMock(); // behaves like redis but in-memory
  logger.info("⚡ Using ioredis-mock (test mode)");
} else {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
    },
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  });

  redisClient.on("connect", () => logger.info("✅ Connected to Redis"));
  redisClient.on("error", (err) => logger.error("❌ Redis error", err.message));

  // Only connect when not in mock mode
  await redisClient.connect();
}

export default redisClient;
