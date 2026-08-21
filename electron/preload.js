const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  openScreenPicker: () => ipcRenderer.invoke('open-screen-picker'),
  onSourceSelected: (callback) => {
    const handler = (event, sourceId) => callback(sourceId);
    ipcRenderer.on('source-selected', handler);
    return () => ipcRenderer.removeListener('source-selected', handler);
  },
});
