import expressSession from "express-session";
import { RedisStore } from "connect-redis";
import redisClient from "#config/redisConfig.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

export default function session() {
  // The secret is used to sign the session ID cookie, making it tamper-proof
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    logger.warn(
      "SESSION_SECRET is not set in environment variables. Using a default value is insecure for production."
    );
  }

  return expressSession({
    store: new RedisStore({ client: redisClient }),
    name: "sid",
    secret: sessionSecret || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Ensures the cookie is sent only over HTTP(S), not client JS
      secure: true, // Ensures the browser only sends the cookie over HTTPS
      sameSite: "strict", // Helps prevent CSRF attacks
      maxAge: 1000 * 60 * 30, // Session expires after 30 minutes of inactivity
    },
  });
}
