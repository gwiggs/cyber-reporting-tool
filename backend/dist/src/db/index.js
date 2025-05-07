"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transaction = exports.query = exports.pool = void 0;
const pg_1 = require("pg");
const database_1 = __importDefault(require("../config/database"));
// Create a connection pool
exports.pool = new pg_1.Pool(database_1.default.postgres);
// Helper for running SQL queries
const query = async (text, params = []) => {
    const start = Date.now();
    const res = await exports.pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
        console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
};
exports.query = query;
// Helper for transactions
const transaction = async (callback) => {
    const client = await exports.pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
    finally {
        client.release();
    }
};
exports.transaction = transaction;
// Export as a default object as well
exports.default = {
    pool: exports.pool,
    query: exports.query,
    transaction: exports.transaction
};
//# sourceMappingURL=index.js.map