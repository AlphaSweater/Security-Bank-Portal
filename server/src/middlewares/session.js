import session from "express-session";
import { RedisStore } from "connect-redis";
import redisClient from "#config/redis.js";
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

/**
 * Builds a session middleware.
 * @returns {function} Express session middleware
 */
export default function buildSessionMiddleware() {
  logger.info("Setting up session middleware");

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    logger.warn(
      "SESSION_SECRET is not set in environment variables. Using a default value is insecure for production."
    );
  }

  return session({
    store: new RedisStore({ client: redisClient }),
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 2,
    },
  });
}
