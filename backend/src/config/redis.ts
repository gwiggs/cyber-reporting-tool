import { createClient } from 'redis';

// Create the Redis client with connection options
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    reconnectStrategy: (retries) => {
      // Reconnect with exponential backoff up to a maximum of 10 seconds
      const delay = Math.min(Math.pow(2, retries) * 100, 10000);
      return delay;
    }
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '0')
});

// Don't connect automatically in test environment
if (process.env.NODE_ENV !== 'test') {
  // Connect to Redis with proper error handling
  redisClient.connect().catch(err => {
    console.error('Redis connection error:', err);
    console.warn('Application will continue without Redis, using in-memory session store');
  });
}

// Setup event handlers
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
  console.warn('Continuing with in-memory session storage');
});

redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('reconnecting', () => console.log('Redis Client Reconnecting...'));
redisClient.on('ready', () => console.log('Redis Client Ready'));

export default redisClient; 