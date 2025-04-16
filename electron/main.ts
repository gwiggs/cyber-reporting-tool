import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import express from 'express';
import { setupAuth } from './auth/auth';
import { setupDatabase } from './database/database';

// Keep a global reference of the window object to avoid garbage collection
let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  // Initialize database
  await setupDatabase();

  // Create the browser window
  mainWindow = new BrowserWindow({
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
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - load from built files
    await mainWindow.loadFile(path.join(__dirname, '../index.html'));
  }

  // Set up API server
  setupExpressServer();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Set up Express server for API endpoints
function setupExpressServer() {
  const apiServer = express();
  const PORT = 3001;

  // Middleware
  apiServer.use(express.json());

  // Set up authentication routes
  setupAuth(apiServer);

  // Start server
  apiServer.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for communication with renderer process
ipcMain.handle('auth:login', async (_, credentials) => {
  // Auth logic will be implemented in auth module
  // This is just the communication layer
  console.log('Login request received', credentials);
  return { success: true };
});

ipcMain.handle('auth:register', async (_, userData) => {
  console.log('Register request received', userData);
  return { success: true };
});

ipcMain.handle('auth:logout', async () => {
  console.log('Logout request received');
  return { success: true };
});
