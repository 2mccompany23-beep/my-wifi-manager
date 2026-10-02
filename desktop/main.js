const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;
let serverPort = 5000;

// Déterminer le port (éviter les conflits)
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// Démarrer le serveur Express intégré
async function startServer() {
  serverPort = await findAvailablePort(5000);
  console.log(`[Desktop] Démarrage du serveur sur le port ${serverPort}...`);

  // Copier le serveur bundle CJS du projet racine si nécessaire
  const rootServerPath = path.join(__dirname, '..', 'server.bundle.cjs');
  const desktopServerPath = path.join(__dirname, 'server.bundle.cjs');

  if (!fs.existsSync(desktopServerPath) && fs.existsSync(rootServerPath)) {
    fs.copyFileSync(rootServerPath, desktopServerPath);
  }

  // Copier le dossier data si nécessaire (seulement si db.json est valide)
  const rootDataPath = path.join(__dirname, '..', 'data');
  const desktopDataPath = path.join(__dirname, 'data');
  if (fs.existsSync(rootDataPath) && !fs.existsSync(desktopDataPath)) {
    fs.mkdirSync(desktopDataPath, { recursive: true });
    const files = fs.readdirSync(rootDataPath);
    for (const file of files) {
      const srcFile = path.join(rootDataPath, file);
      const destFile = path.join(desktopDataPath, file);
      // Pour db.json, vérifier qu'il est valide avant de copier
      if (file === 'db.json') {
        try {
          const content = fs.readFileSync(srcFile, 'utf8');
          const parsed = JSON.parse(content);
          if (!parsed || !parsed.adminAuth) {
            console.log('[Desktop] db.json invalide ignoré, création automatique au premier démarrage');
            continue;
          }
        } catch (err) {
          console.log('[Desktop] db.json vide/invalide ignoré, création automatique au premier démarrage');
          continue;
        }
      }
      fs.copyFileSync(srcFile, destFile);
    }
  }

  // Copier le dossier loc si nécessaire
  const rootLocPath = path.join(__dirname, '..', 'loc');
  const desktopLocPath = path.join(__dirname, 'loc');
  if (fs.existsSync(rootLocPath) && !fs.existsSync(desktopLocPath)) {
    fs.mkdirSync(desktopLocPath, { recursive: true });
    const files = fs.readdirSync(rootLocPath);
    for (const file of files) {
      fs.copyFileSync(path.join(rootLocPath, file), path.join(desktopLocPath, file));
    }
  }

  // Copier le dossier dist (build frontend) si nécessaire
  const rootDistPath = path.join(__dirname, '..', 'dist');
  const desktopDistPath = path.join(__dirname, 'dist');
  if (fs.existsSync(rootDistPath) && !fs.existsSync(desktopDistPath)) {
    fs.mkdirSync(desktopDistPath, { recursive: true });
    const copyDir = (src, dest) => {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    copyDir(rootDistPath, desktopDistPath);
  }

  // Démarrer le serveur en tant que processus enfant
  const serverScript = fs.existsSync(desktopServerPath) ? desktopServerPath : rootServerPath;
  serverProcess = spawn(process.execPath, [serverScript], {
    env: { ...process.env, PORT: String(serverPort) },
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: __dirname
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error] ${data.toString().trim()}`);
  });

  serverProcess.on('exit', (code) => {
    console.log(`[Server] Processus arrêté avec code ${code}`);
  });

  // Attendre que le serveur soit prêt
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log(`[Desktop] Serveur prêt sur http://localhost:${serverPort}`);
}

// Créer la fenêtre principale
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Cloud Mikhmon 2.0 - Gestion Hotspot MikroTik',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: false
  });

  // Menu personnalisé
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Actualiser',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload()
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'Documentation MikroTik',
          click: () => shell.openExternal('https://help.mikrotik.com/')
        },
        {
          label: 'Site 2MC',
          click: () => shell.openExternal('https://mcwifi.net')
        },
        { type: 'separator' },
        {
          label: 'À propos',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'À propos',
              message: 'Cloud Mikhmon 2.0',
              detail: 'Application Bureau pour la gestion du hotspot MikroTik\n© 2026 2MC COMPANY ETS\nVersion 2.0.0'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Charger l'application
  const devUrl = `http://localhost:${serverPort}`;
  const distIndex = path.join(__dirname, 'dist', 'index.html');

  if (fs.existsSync(distIndex)) {
    // En production, charger le serveur local
    mainWindow.loadURL(devUrl);
  } else {
    // En dev, charger le serveur Vite
    mainWindow.loadURL('http://localhost:3000');
  }

  // Ouvrir les liens externes dans le navigateur
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC pour obtenir le port du serveur
ipcMain.handle('get-server-port', () => serverPort);

// Démarrage de l'application
app.whenReady().then(async () => {
  await startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Arrêt propre
app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});