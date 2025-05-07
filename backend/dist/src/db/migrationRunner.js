"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
exports.rollbackMigrations = rollbackMigrations;
// src/db/migrationRunner.ts
const testConnection_1 = __importDefault(require("./testConnection"));
const index_1 = require("./index");
const _001_create_tables_1 = require("./migrations/001_create_tables");
const _001_organisations_1 = require("./seeds/001_organisations");
const _002_departments_1 = require("./seeds/002_departments");
const _003_roles_1 = require("./seeds/003_roles");
const _004_users_1 = require("./seeds/004_users");
// Function to run all migrations and seeds
async function runMigrations() {
    try {
        console.log('Testing database connection...');
        const connectionSuccessful = await (0, testConnection_1.default)();
        if (!connectionSuccessful) {
            throw new Error('Database connection failed, aborting migrations');
        }
        console.log('Starting database migrations and seeding...');
        // Run migrations
        console.log('Running migrations...');
        await (0, _001_create_tables_1.up)();
        // Run seeds
        console.log('Running seeds...');
        await (0, _001_organisations_1.seed)();
        await (0, _002_departments_1.seed)();
        await (0, _003_roles_1.seed)();
        await (0, _004_users_1.seed)();
        console.log('Database setup completed successfully!');
    }
    catch (error) {
        console.error('Error setting up database:', error);
        throw error;
    }
}
// Export a function to rollback migrations if needed
async function rollbackMigrations() {
    try {
        console.log('Rolling back migrations...');
        await (0, _001_create_tables_1.down)();
        console.log('Rollback completed successfully!');
    }
    catch (error) {
        console.error('Error rolling back migrations:', error);
        throw error;
    }
}
// If this script is run directly (not imported)
if (require.main === module) {
    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    // Execute appropriate command
    if (command === 'rollback') {
        rollbackMigrations()
            .then(() => {
            index_1.pool.end();
            process.exit(0);
        })
            .catch(() => {
            index_1.pool.end();
            process.exit(1);
        });
    }
    else {
        runMigrations()
            .then(() => {
            index_1.pool.end();
            process.exit(0);
        })
            .catch(() => {
            index_1.pool.end();
            process.exit(1);
        });
    }
}
//# sourceMappingURL=migrationRunner.js.map