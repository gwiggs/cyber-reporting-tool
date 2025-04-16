"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('api', {
    // Authentication methods
    auth: {
        login: (credentials) => electron_1.ipcRenderer.invoke('auth:login', credentials),
        register: (userData) => electron_1.ipcRenderer.invoke('auth:register', userData),
        logout: () => electron_1.ipcRenderer.invoke('auth:logout')
    }
});
