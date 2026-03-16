const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

// --- IPC Handlers ---

ipcMain.handle('dialog:open-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('dialog:open-files', async () => {
  const result = await dialog.showOpenDialog({
    filters: [{ name: 'Markdown', extensions: ['md'] }],
    properties: ['openFile', 'multiSelections'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths;
  }
  return [];
});

ipcMain.handle('fs:read-dir', (_event, folderPath) => {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => ({ name: e.name, path: path.join(folderPath, e.name) }));
  } catch {
    return [];
  }
});

ipcMain.handle('fs:read-file', (_event, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
});

ipcMain.handle('fs:write-file', (_event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

const watchers = new Map();

ipcMain.handle('fs:watch-file', (event, filePath) => {
  if (watchers.has(filePath)) return;
  try {
    let timeout;
    const watcher = fs.watch(filePath, (eventType) => {
      if (eventType === 'change') {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            event.sender.send('file-changed', filePath, content);
          } catch (err) {
            // Ignore read errors
          }
        }, 100);
      }
    });
    watchers.set(filePath, watcher);
  } catch (err) {
    console.error('Cannot watch file', filePath);
  }
});

ipcMain.handle('fs:unwatch-file', (event, filePath) => {
  const watcher = watchers.get(filePath);
  if (watcher) {
    watcher.close();
    watchers.delete(filePath);
  }
});

ipcMain.handle('dialog:save-new-file', async () => {
  const result = await dialog.showSaveDialog({
    filters: [{ name: 'Markdown', extensions: ['md'] }],
    defaultPath: 'Nouveau fichier.md'
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, '# Nouveau fichier\n\n', 'utf-8');
    return result.filePath;
  }
  return null;
});

// --- App lifecycle ---

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
