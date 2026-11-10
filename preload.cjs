// preload.cjs - Script cô lập ngữ cảnh an toàn cho Electron
const { contextBridge } = require('electron');
const path = require('path');

// Expose API giới hạn và an toàn vào renderer thông qua contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getModelsPath: () => {
    try {
      return path.join(__dirname, 'dist', 'models').replace(/\\/g, '/');
    } catch {
      return null;
    }
  }
});
