import { Pool, QueryResult, QueryResultRow } from 'pg';
import config from '../config/database';

const pool = new Pool(config.postgres);

// Query helper with TypeScript support
export const query = async <T extends QueryResultRow>(text: string, params: any[]): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params);
};

// Transaction helper
export const transaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default {
  query,
  transaction,
  pool
};