const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFolder: () => ipcRenderer.invoke('dialog:open-folder'),
  openFiles:  () => ipcRenderer.invoke('dialog:open-files'),
  readDir:    (folderPath)          => ipcRenderer.invoke('fs:read-dir',   folderPath),
  getTree:    (folderPath)          => ipcRenderer.invoke('fs:get-tree',   folderPath),
  readFile:   (filePath)            => ipcRenderer.invoke('fs:read-file',  filePath),
  writeFile:  (filePath, content)   => ipcRenderer.invoke('fs:write-file', filePath, content),
  renameFile: (oldPath, newPath)    => ipcRenderer.invoke('fs:rename',     oldPath, newPath),
  deleteFile: (filePath)            => ipcRenderer.invoke('fs:delete',     filePath),
  saveNewFile:() => ipcRenderer.invoke('dialog:save-new-file'),
  watchFile:  (filePath) => ipcRenderer.invoke('fs:watch-file', filePath),
  unwatchFile:(filePath) => ipcRenderer.invoke('fs:unwatch-file', filePath),
  watchFolder:(folderPath) => ipcRenderer.invoke('fs:watch-folder', folderPath),
  unwatchFolder:(folderPath) => ipcRenderer.invoke('fs:unwatch-folder', folderPath),
  onFileChanged: (callback) => ipcRenderer.on('file-changed', callback),
  onTreeChanged: (callback) => ipcRenderer.on('tree-changed', callback),
  getFilePath: (file) => webUtils.getPathForFile(file),
  pathJoin: (...args) => ipcRenderer.invoke('path:join', ...args),
  pathDirname: (p) => ipcRenderer.invoke('path:dirname', p),
  pathBasename: (p) => ipcRenderer.invoke('path:basename', p),
});
