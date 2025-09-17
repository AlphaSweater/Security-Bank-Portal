import session from 'express-session';
import connectRedis from 'connect-redis';
import redisClient from './redis.js';

const RedisStore = connectRedis(session);

const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  name: 'sid', // cookie name
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 2 // 2 hours
  }
});


