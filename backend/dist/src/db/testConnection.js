"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/db/testConnection.ts
const index_1 = require("./index");
async function testConnection() {
    try {
        const client = await index_1.pool.connect();
        console.log('Successfully connected to PostgreSQL');
        client.release();
        return true;
    }
    catch (error) {
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
            index_1.pool.end();
        }
        process.exit(success ? 0 : 1);
    });
}
exports.default = testConnection;
//# sourceMappingURL=testConnection.js.map