import * as redis from 'redis';
import { promisify } from 'util';
import config from '../config/database';

const client = redis.createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port
  }
});

// Promisify Redis commands
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);
const expireAsync = promisify(client.expire).bind(client);

client.on('error', (error) => {
  console.error(`Redis Error: ${error}`);
});

client.on('connect', () => {
  console.log('Connected to Redis server');
});

export default {
  client,
  getAsync,
  setAsync,
  delAsync,
  expireAsync
};