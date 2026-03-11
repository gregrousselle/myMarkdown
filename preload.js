const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFolder: () => ipcRenderer.invoke('dialog:open-folder'),
  openFile:   () => ipcRenderer.invoke('dialog:open-file'),
  readDir:    (folderPath)          => ipcRenderer.invoke('fs:read-dir',   folderPath),
  readFile:   (filePath)            => ipcRenderer.invoke('fs:read-file',  filePath),
  writeFile:  (filePath, content)   => ipcRenderer.invoke('fs:write-file', filePath, content),
  newFile:    (folderPath)          => ipcRenderer.invoke('fs:new-file',   folderPath),
});
