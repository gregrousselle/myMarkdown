const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFolder: () => ipcRenderer.invoke('dialog:open-folder'),
  openFiles:  () => ipcRenderer.invoke('dialog:open-files'),
  readDir:    (folderPath)          => ipcRenderer.invoke('fs:read-dir',   folderPath),
  getTree:    (folderPath)          => ipcRenderer.invoke('fs:get-tree',   folderPath),
  readFile:   (filePath)            => ipcRenderer.invoke('fs:read-file',  filePath),
  writeFile:  (filePath, content)   => ipcRenderer.invoke('fs:write-file', filePath, content),
  saveNewFile:() => ipcRenderer.invoke('dialog:save-new-file'),
  watchFile:  (filePath) => ipcRenderer.invoke('fs:watch-file', filePath),
  unwatchFile:(filePath) => ipcRenderer.invoke('fs:unwatch-file', filePath),
  onFileChanged: (callback) => ipcRenderer.on('file-changed', callback),
  getFilePath: (file) => webUtils.getPathForFile(file),
});
