"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis = __importStar(require("redis"));
const util_1 = require("util");
const database_1 = __importDefault(require("../config/database"));
const client = redis.createClient({
    socket: {
        host: database_1.default.redis.host,
        port: database_1.default.redis.port
    }
});
// Promisify Redis commands
const getAsync = (0, util_1.promisify)(client.get).bind(client);
const setAsync = (0, util_1.promisify)(client.set).bind(client);
const delAsync = (0, util_1.promisify)(client.del).bind(client);
const expireAsync = (0, util_1.promisify)(client.expire).bind(client);
client.on('error', (error) => {
    console.error(`Redis Error: ${error}`);
});
client.on('connect', () => {
    console.log('Connected to Redis server');
});
exports.default = {
    client,
    getAsync,
    setAsync,
    delAsync,
    expireAsync
};
//# sourceMappingURL=redis.js.map