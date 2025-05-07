"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const migrationRunner_1 = require("./db/migrationRunner");
const index_1 = require("./db/index");
const PORT = process.env.PORT || 5000;
// Initialize database before starting server
const startServer = async () => {
    try {
        // Run migrations and seeds
        await (0, migrationRunner_1.runMigrations)();
        // Start Express server
        const server = app_1.default.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
        // Handle graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM signal received: closing HTTP server and DB connections');
            server.close(async () => {
                await index_1.pool.end();
                console.log('HTTP server closed, DB connections closed');
                process.exit(0);
            });
        });
        process.on('SIGINT', () => {
            console.log('SIGINT signal received: closing HTTP server and DB connections');
            server.close(async () => {
                await index_1.pool.end();
                console.log('HTTP server closed, DB connections closed');
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.error('Server initialization failed:', error);
        await index_1.pool.end();
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map