import { Pool } from 'pg';
import config from '../config/database';

// Create a connection pool
export const pool = new Pool(config.postgres);

// Helper for running SQL queries
export const query = async (text: string, params: any[] = []) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  
  return res;
};

// Helper for transactions
export const transaction = async (callback: (client: any) => Promise<any>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

// Export as a default object as well
export default {
  pool,
  query,
  transaction
};