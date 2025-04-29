// src/server.ts
import 'dotenv/config';
import app from './app';
import { runMigrations } from './db/migrationRunner';
import { pool } from './db/index';

const PORT = process.env.PORT || 5000;

// Initialize database before starting server
const startServer = async () => {
  try {
    // Run migrations and seeds
    await runMigrations();
    
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server and DB connections');
      server.close(async () => {
        await pool.end();
        console.log('HTTP server closed, DB connections closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server and DB connections');
      server.close(async () => {
        await pool.end();
        console.log('HTTP server closed, DB connections closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Server initialization failed:', error);
    await pool.end();
    process.exit(1);
  }
};

startServer();