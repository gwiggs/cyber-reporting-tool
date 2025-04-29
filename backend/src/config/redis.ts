import { createClient } from 'redis';

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '0')
});

// Don't connect automatically in test environment
if (process.env.NODE_ENV !== 'test') {
  redisClient.connect().catch(err => {
    console.error('Redis connection error:', err);
  });
}

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

export default redisClient; 