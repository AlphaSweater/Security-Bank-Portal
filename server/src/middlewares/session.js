import session from 'express-session';
import connectRedis from 'connect-redis';
import redisClient from '../config/redis.js';

const RedisStore = connectRedis(session);

/**
 * Builds a session middleware with optional overrides.
 * @param {object} [options] - Optional session options to override defaults.
 * @returns {function} Express session middleware
 */
export default function buildSessionMiddleware(options = {}) {
  return session({
    store: new RedisStore({ client: redisClient }),
    name: 'sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 2,
      ...(options.cookie || {})
    },
    ...options
  });
}
