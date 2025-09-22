import Redis from "ioredis";
import RedisMock from "ioredis-mock";
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

const USE_REDIS_MOCK = true;

let redisClient;
if (USE_REDIS_MOCK) {
  logger.info("⚡Using ioredis-mock for Redis");
  redisClient = new RedisMock();
} else {
  const redisOptions = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  };
  redisClient = new Redis(redisOptions);
  redisClient.on("connect", () => logger.info("✅ Redis connected"));
  redisClient.on("error", (err) => logger.error("❌ Redis error", err));
}

export default redisClient;
