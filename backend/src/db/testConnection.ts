// src/db/testConnection.ts
import { pool } from './index';

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL');
    client.release();
    return true;
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    return false;
  }
}

// Run if this script is executed directly
if (require.main === module) {
  testConnection()
    .then(success => {
      // Note: We don't end the pool here if the function is imported elsewhere
      if (require.main === module) {
        pool.end();
      }
      process.exit(success ? 0 : 1);
    });
}

export default testConnection;