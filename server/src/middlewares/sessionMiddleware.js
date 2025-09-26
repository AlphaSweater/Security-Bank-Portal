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

  // This function returns the actual middleware that Express will use
  // When a request comes in, this middleware will:
  //   1. Check for a session cookie (named 'sid' here) in the request
  //   2. If present, load the session data from Redis
  //   3. Attach the session object to req.session
  //   4. If not present, create a new session and set a cookie in the response
  return expressSession({
    // Store session data in Redis for persistence and scalability
    store: new RedisStore({ client: redisClient }),
    // The name of the cookie that will store the session ID
    name: "sid",
    // Secret for signing the session ID cookie
    secret: process.env.SESSION_SECRET,
    // Don't save session if nothing was modified
    resave: false,
    // Don't create session until something is stored
    saveUninitialized: false,
    cookie: {
      // Prevent client-side JS from accessing the cookie
      httpOnly: true,
      // Only send cookie over HTTPS in production
      secure: process.env.NODE_ENV === "production",
      // Controls when cookies are sent (lax is a good default for most apps)
      sameSite: "lax",
      // How long the session cookie is valid (2 hours here)
      maxAge: 1000 * 60 * 60 * 2,
    },
  });
}
