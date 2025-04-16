import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Authentication methods
    auth: {
      login: (credentials: { email: string; password: string }) => 
        ipcRenderer.invoke('auth:login', credentials),
      
      register: (userData: { 
        email: string; 
        password: string; 
        firstName: string; 
        lastName: string; 
        role: string 
      }) => ipcRenderer.invoke('auth:register', userData),
      
      logout: () => ipcRenderer.invoke('auth:logout')
    }
  }
);
