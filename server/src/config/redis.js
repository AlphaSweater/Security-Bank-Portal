import Redis from 'ioredis';
import logger from '../logger.js';

const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

if (process.env.NODE_ENV === 'production') {
  redisOptions.tls = {};
}

const redisClient = new Redis(redisOptions);

redisClient.on('connect', () => logger.info('✅ Redis connected'));
redisClient.on('error', (err) => logger.error('❌ Redis error', err));

export default redisClient;
