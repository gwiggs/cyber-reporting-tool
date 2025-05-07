"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transaction = exports.query = void 0;
const pg_1 = require("pg");
const database_1 = __importDefault(require("../config/database"));
const pool = new pg_1.Pool(database_1.default.postgres);
// Query helper with TypeScript support
const query = async (text, params) => {
    return pool.query(text, params);
};
exports.query = query;
// Transaction helper
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.transaction = transaction;
exports.default = {
    query: exports.query,
    transaction: exports.transaction,
    pool
};
//# sourceMappingURL=postgres.js.map