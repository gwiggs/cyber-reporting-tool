interface PostgresConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  }
  
  interface MongoConfig {
    uri: string;
  }
  
  interface RedisConfig {
    host: string;
    port: number;
  }
  
  interface DatabaseConfig {
    postgres: PostgresConfig;
    mongodb: MongoConfig;
    redis: RedisConfig;
  }
  
  const config: DatabaseConfig = {
    postgres: {
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432'),
      database: process.env.PG_DATABASE || 'task_management',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || 'postgres'
    },
    mongodb: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/task_attachments'
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    }
  };
  
  export default config;