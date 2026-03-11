const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFolder: () => ipcRenderer.invoke('dialog:open-folder'), // kept if needed elsewhere, but user wants to remove "openFolder" behaviour.
  openFiles:  () => ipcRenderer.invoke('dialog:open-files'),
  readDir:    (folderPath)          => ipcRenderer.invoke('fs:read-dir',   folderPath),
  readFile:   (filePath)            => ipcRenderer.invoke('fs:read-file',  filePath),
  writeFile:  (filePath, content)   => ipcRenderer.invoke('fs:write-file', filePath, content),
  saveNewFile:() => ipcRenderer.invoke('dialog:save-new-file'),
});
