import session from "express-session";
import { RedisStore } from "connect-redis";
import redisClient from "../config/redis.js";

/**
 * Builds a session middleware.
 * @returns {function} Express session middleware
 */
export default function buildSessionMiddleware() {
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
