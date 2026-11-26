const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const WitnessRecorder = require('./src/engine/recorder');
const ParallelExecutor = require('./src/engine/executor');
const EncryptedStorage = require('./src/storage/db');

let mainWindow = null;
let witnessRecorder = null;
let parallelExecutor = null;
let encryptedStorage = null;

const DB_FILE_PATH = path.join(__dirname, 'data', 'vault.sqlite');
const KEY_FILE_PATH = path.join(__dirname, 'data', '.vault_key');

function ensureDataDir() {
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 890,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#F5F4F0',
    title: 'Atomate - Workflow Multi-Onglets & Parallélisme Selenium',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (witnessRecorder) {
      witnessRecorder.stopWitness();
    }
    if (parallelExecutor) {
      parallelExecutor.abortAll();
    }
    if (encryptedStorage) {
      encryptedStorage.close();
    }
  });
}

app.whenReady().then(() => {
  ensureDataDir();

  // Initialize SQLite Encrypted Storage
  encryptedStorage = new EncryptedStorage(DB_FILE_PATH, KEY_FILE_PATH);

  // Initialize engine instances
  witnessRecorder = new WitnessRecorder({
    port: 9876,
    onStatus: (statusText) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('witness-status', statusText);
      }
    },
    onAction: (workflow) => {
      if (encryptedStorage) {
        try {
          encryptedStorage.saveField('script_scenario', JSON.stringify(workflow));
        } catch (e) {}
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('witness-workflow-update', workflow);
      }
    }
  });

  parallelExecutor = new ParallelExecutor({
    onWorkerUpdate: (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('worker-update', data);
      }
    },
    onLog: (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('worker-log', data);
      }
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// SQLite Encrypted Storage
ipcMain.handle('save-field', async (event, { key, value }) => {
  try {
    encryptedStorage.saveField(key, value);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('load-all-fields', async () => {
  try {
    const fields = encryptedStorage.loadAllFields();
    return { success: true, fields };
  } catch (err) {
    return { success: false, error: err.message, fields: {} };
  }
});

// Dual-Tab Witness Browser for Learning
ipcMain.handle('start-witness', async (event, { url1, url2 }) => {
  try {
    const targetUrl1 = (url1 && url1.trim()) ? url1.trim() : 'https://google.com';
    const targetUrl2 = (url2 && url2.trim()) ? url2.trim() : null;
    await witnessRecorder.openWitness(targetUrl1, targetUrl2);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('stop-witness', async () => {
  try {
    await witnessRecorder.stopWitness();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Unified Workflow persistence (encrypted in SQLite)
ipcMain.handle('save-workflow', async (event, workflow) => {
  try {
    const safeList = Array.isArray(workflow) ? workflow : [];
    encryptedStorage.saveField('script_scenario', JSON.stringify(safeList));
    if (witnessRecorder) {
      witnessRecorder.setWorkflow(safeList);
    }
    return { success: true, count: safeList.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('load-workflow', async () => {
  try {
    const rawScen = encryptedStorage.loadField('script_scenario');
    let workflow = [];

    if (rawScen !== null) {
      workflow = JSON.parse(rawScen);
    } else {
      // Auto-migrate legacy split scripts if present
      const raw1 = encryptedStorage.loadField('script_link1');
      const raw2 = encryptedStorage.loadField('script_link2');
      const s1 = raw1 ? JSON.parse(raw1) : [];
      const s2 = raw2 ? JSON.parse(raw2) : [];
      if (s1.length > 0) {
        workflow.push({ type: 'switch_tab', tab: 1, tabIndex: 1, description: 'Basculer vers Onglet 1 (Lien 1)' });
        workflow.push(...s1);
      }
      if (s2.length > 0) {
        workflow.push({ type: 'switch_tab', tab: 2, tabIndex: 2, description: 'Basculer vers Onglet 2 (Lien 2)' });
        workflow.push(...s2);
      }
    }

    if (witnessRecorder) {
      witnessRecorder.setWorkflow(workflow);
    }
    return { success: true, workflow };
  } catch (err) {
    return { success: false, error: err.message, workflow: [] };
  }
});

ipcMain.handle('clear-workflow', async () => {
  if (witnessRecorder) {
    witnessRecorder.clearWorkflow();
  }
  encryptedStorage.saveField('script_scenario', JSON.stringify([]));
  return { success: true };
});

// "Go!" Parallel Selenium Execution
ipcMain.handle('start-go', async (event, config) => {
  try {
    parallelExecutor.runParallel(config).then((results) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('go-finished', results);
      }
    }).catch((err) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('go-finished', { error: err.message });
      }
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Abort All Running Selenium Instances
ipcMain.handle('abort-go', async () => {
  try {
    await parallelExecutor.abortAll();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
