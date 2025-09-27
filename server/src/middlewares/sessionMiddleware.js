import expressSession from "express-session";
import { RedisStore } from "connect-redis";
import redisClientPromise from "#config/redisConfig.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

// Async function to create and return session middleware
export default async function session() {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
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
    name: "sid",
    secret: sessionSecret || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Only sent over HTTP(S), not accessible via JS
      secure: true, // Only sent over HTTPS
      sameSite: "strict", // Prevents CSRF
      maxAge: 1000 * 60 * 30, // 30 min session timeout
    },
  });
}
