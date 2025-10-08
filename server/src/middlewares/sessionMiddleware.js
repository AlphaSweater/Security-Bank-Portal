import expressSession from "express-session";
import { RedisStore } from "connect-redis";
import redisClientPromise from "#config/redisConfig.js";
import { sessionCookieOptions } from "#config/cookies.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

// Async function to create and return session middleware
export default async function session() {
  const { SESSION_COOKIE_NAME = "sid", SESSION_SECRET = "default_secret" } =
    process.env;

  if (!SESSION_SECRET) {
    logger.warnAsync(
      "SESSION_SECRET is not set. Using default value (insecure for production)."
    );
  }

  // Get the Redis client
  const redisClient = await redisClientPromise;

  // If redisClient exists, use RedisStore for sessions.
  // If redisClient is null/undefined, use the default in-memory MemoryStore.
  const store = redisClient
    ? new RedisStore({ client: redisClient })
    : undefined;
  logger.debugAsync(
    store ? "Session: Using RedisStore" : "Session: Using in-memory MemoryStore"
  );

  return expressSession({
    store,
    name: SESSION_COOKIE_NAME,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: sessionCookieOptions(), // 30 min default,
  });
}
