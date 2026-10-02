const { contextBridge, ipcRenderer } = require('electron');

// Exposer des API sécurisées au renderer
contextBridge.exposeInMainWorld('desktopAPI', {
  // Obtenir le port du serveur local
  getServerPort: () => ipcRenderer.invoke('get-server-port'),
  
  // Informations sur l'application
  getAppInfo: () => ({
    name: 'Cloud Mikhmon 2.0',
    version: '2.0.0',
    platform: process.platform
  })
});