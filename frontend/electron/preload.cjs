const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getNativeVersion: () => ipcRenderer.invoke('get-native-version'),
  downloadUpdate: (url, version) => ipcRenderer.invoke('download-update', { url, version }),
  applyUpdate: (version) => ipcRenderer.invoke('apply-update', version),
  onDownloadProgress: (callback) => {
    const listener = (event, percent) => callback(percent);
    ipcRenderer.on('download-progress', listener);
    return () => ipcRenderer.removeListener('download-progress', listener);
  },
  notifyAppReady: () => ipcRenderer.invoke('notify-app-ready'),
  isElectron: true
});
