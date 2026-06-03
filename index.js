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

function getFileTree(folderPath) {
  try {
    const name = path.basename(folderPath);
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    const children = [];

    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);
      if (entry.isDirectory()) {
        const childTree = getFileTree(fullPath);
        if (childTree && (childTree.children.length > 0)) {
          children.push(childTree);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        children.push({
          name: entry.name,
          path: fullPath,
          type: 'file'
        });
      }
    }

    return {
      name,
      path: folderPath,
      type: 'directory',
      children: children.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      })
    };
  } catch (err) {
    return null;
  }
}

ipcMain.handle('fs:get-tree', (_event, folderPath) => {
  return getFileTree(folderPath);
});

ipcMain.handle('fs:read-file', async (_event, filePath) => {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
});

ipcMain.handle('fs:write-file', async (_event, filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:rename', async (_event, oldPath, newPath) => {
  try {
    await fs.promises.rename(oldPath, newPath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:delete', async (_event, filePath) => {
  try {
    const { shell } = require('electron');
    await shell.trashItem(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

const watchers = new Map();
const treeWatchers = new Map();

ipcMain.handle('fs:watch-folder', (event, folderPath) => {
  if (treeWatchers.has(folderPath)) return;
  try {
    let timeout;
    const watcher = fs.watch(folderPath, { recursive: true }, (eventType, filename) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        event.sender.send('tree-changed', folderPath);
      }, 200);
    });
    treeWatchers.set(folderPath, watcher);
  } catch (err) {
    console.error('Cannot watch folder', folderPath, err);
  }
});

ipcMain.handle('fs:unwatch-folder', (event, folderPath) => {
  const watcher = treeWatchers.get(folderPath);
  if (watcher) {
    watcher.close();
    treeWatchers.delete(folderPath);
  }
});

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

ipcMain.handle('path:join', (_event, ...args) => path.join(...args));
ipcMain.handle('path:dirname', (_event, p) => path.dirname(p));
ipcMain.handle('path:basename', (_event, p) => path.basename(p));

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
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
