"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/db/cleanup.ts
const index_1 = require("./index");
async function dropAllTables() {
    try {
        console.log('Dropping all tables...');
        // Drop tables in reverse order of creation to avoid foreign key issues
        await (0, index_1.query)(`
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS user_roles CASCADE;
      DROP TABLE IF EXISTS user_credentials CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS role_permissions CASCADE;
      DROP TABLE IF EXISTS permissions CASCADE;
      DROP TABLE IF EXISTS roles CASCADE;
      DROP TABLE IF EXISTS departments CASCADE;
      DROP TABLE IF EXISTS organisations CASCADE;
    `);
        console.log('All tables dropped successfully');
    }
    catch (error) {
        console.error('Error dropping tables:', error);
        throw error;
    }
    finally {
        await index_1.pool.end();
    }
}
// Run if this script is executed directly
if (require.main === module) {
    dropAllTables()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
exports.default = dropAllTables;
//# sourceMappingURL=cleanup.js.map