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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const express_1 = __importDefault(require("express"));
const auth_1 = require("./auth/auth");
const database_1 = require("./database/database");
// Keep a global reference of the window object to avoid garbage collection
let mainWindow = null;
function createWindow() {
    return __awaiter(this, void 0, void 0, function* () {
        // Initialize database
        yield (0, database_1.setupDatabase)();
        // Create the browser window
        mainWindow = new electron_1.BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
            },
        });
        // Load the app
        if (process.env.NODE_ENV === 'development') {
            // Development mode - load from webpack dev server
            yield mainWindow.loadURL('http://localhost:3000');
            mainWindow.webContents.openDevTools();
        }
        else {
            // Production mode - load from built files
            yield mainWindow.loadFile(path.join(__dirname, '../index.html'));
        }
        // Set up API server
        setupExpressServer();
        mainWindow.on('closed', () => {
            mainWindow = null;
        });
    });
}
// Set up Express server for API endpoints
function setupExpressServer() {
    const apiServer = (0, express_1.default)();
    const PORT = 3001;
    // Middleware
    apiServer.use(express_1.default.json());
    // Set up authentication routes
    (0, auth_1.setupAuth)(apiServer);
    // Start server
    apiServer.listen(PORT, () => {
        console.log(`API server running on port ${PORT}`);
    });
}
// This method will be called when Electron has finished initialization
electron_1.app.whenReady().then(createWindow);
// Quit when all windows are closed
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
// IPC handlers for communication with renderer process
electron_1.ipcMain.handle('auth:login', (_, credentials) => __awaiter(void 0, void 0, void 0, function* () {
    // Auth logic will be implemented in auth module
    // This is just the communication layer
    console.log('Login request received', credentials);
    return { success: true };
}));
electron_1.ipcMain.handle('auth:register', (_, userData) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Register request received', userData);
    return { success: true };
}));
electron_1.ipcMain.handle('auth:logout', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Logout request received');
    return { success: true };
}));
