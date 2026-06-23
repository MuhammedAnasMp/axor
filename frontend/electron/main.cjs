const { app, BrowserWindow, ipcMain, protocol, net, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Set application name and isolate userData path to avoid cache/sandbox conflicts
app.name = 'Axon';
app.setPath('userData', path.join(app.getPath('appData'), 'Axon'));

// Disable GPU shader disk cache to prevent "Access is denied" cache errors
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

const https = require('https');
const http = require('http');
const { URL, pathToFileURL } = require('url');
const AdmZip = require('adm-zip');

// Hide application menu bar completely
Menu.setApplicationMenu(null);

// Register custom protocol 'app' as standard, secure, and fetch-capable
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

let mainWindow;
let isQuitting = false;

function getActiveFolder() {
  let baseFolder = path.join(__dirname, '../dist');
  const updateConfigPath = path.join(app.getPath('userData'), 'updates', 'config.json');
  
  if (fs.existsSync(updateConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(updateConfigPath, 'utf8'));
      if (config.activeVersion) {
        const versionFolder = path.join(app.getPath('userData'), 'updates', 'v' + config.activeVersion);
        if (fs.existsSync(path.join(versionFolder, 'index.html'))) {
          baseFolder = versionFolder;
        }
      }
    } catch (e) {
      console.error('Error reading update config:', e);
    }
  }
  return baseFolder;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html';
    case '.js':
    case '.mjs': return 'text/javascript';
    case '.css': return 'text/css';
    case '.json': return 'application/json';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    default: return 'application/octet-stream';
  }
}

function handleAppProtocol() {
  protocol.handle('app', async (request) => {
    const { pathname } = new URL(request.url);
    const cleanPath = decodeURIComponent(pathname);
    const baseFolder = getActiveFolder();
    
    let filePath = path.join(baseFolder, cleanPath);

    // Support client-side React Router SPA routing fallback
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(baseFolder, 'index.html');
    }

    try {
      const data = fs.readFileSync(filePath);
      const mimeType = getMimeType(filePath);
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (err) {
      console.error('Failed to serve file via app:// protocol:', err);
      return new Response('File not found', { status: 404 });
    }
  });
}

function createWindow() {
  // Determine application icon path (dev vs prod)
  let iconPath = path.join(__dirname, '../public/fav_icon.ico');
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, '../dist/fav_icon.ico');
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Support hot reload dev server if app is not packaged (dev mode)
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      mainWindow.loadURL('app://localhost/index.html');
    });
  } else {
    mainWindow.loadURL('app://localhost/index.html');
  }

  // Handle window close event with confirmation dialog
  mainWindow.on('close', (event) => {
    if (isQuitting) {
      return;
    }
    
    event.preventDefault();

    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['Yes', 'No'],
      defaultId: 1,
      title: 'Confirm Exit',
      message: 'Are you sure you want to close Axon?',
      cancelId: 1
    });

    if (choice === 0) {
      isQuitting = true;
      mainWindow.destroy();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Download helper function supporting progress callback and redirects
function downloadFile(urlStr, destPath, progressCallback) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const client = urlObj.protocol === 'https:' ? https : http;

    client.get(urlStr, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Recursively follow redirects
        downloadFile(response.headers.location, destPath, progressCallback)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: Status Code ${response.statusCode}`));
        return;
      }

      const totalBytes = parseInt(response.headers['content-length'], 10) || 0;
      let downloadedBytes = 0;
      const fileStream = fs.createWriteStream(destPath);

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const percent = Math.round((downloadedBytes / totalBytes) * 100);
          progressCallback(percent);
        }
      });

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// IPC Handlers
ipcMain.handle('get-native-version', () => {
  return app.getVersion();
});

ipcMain.handle('download-update', async (event, { url, version }) => {
  const tempZipPath = path.join(app.getPath('temp'), `update_${version}.zip`);
  const updatesDir = path.join(app.getPath('userData'), 'updates');
  const versionDir = path.join(updatesDir, 'v' + version);

  // Ensure directories exist
  if (!fs.existsSync(updatesDir)) {
    fs.mkdirSync(updatesDir, { recursive: true });
  }
  if (fs.existsSync(versionDir)) {
    fs.rmSync(versionDir, { recursive: true, force: true });
  }
  fs.mkdirSync(versionDir, { recursive: true });

  try {
    // 1. Download ZIP
    await downloadFile(url, tempZipPath, (percent) => {
      if (mainWindow) {
        mainWindow.webContents.send('download-progress', percent);
      }
    });

    // 2. Extract ZIP
    const zip = new AdmZip(tempZipPath);
    zip.extractAllTo(versionDir, true);

    // 3. Cleanup temp file
    fs.unlinkSync(tempZipPath);

    return { success: true };
  } catch (error) {
    console.error('Update download/extract failed:', error);
    if (fs.existsSync(versionDir)) {
      fs.rmSync(versionDir, { recursive: true, force: true });
    }
    throw error;
  }
});

ipcMain.handle('apply-update', async (event, version) => {
  const updateConfigPath = path.join(app.getPath('userData'), 'updates', 'config.json');
  const config = { activeVersion: version };
  
  fs.writeFileSync(updateConfigPath, JSON.stringify(config, null, 2), 'utf8');

  // Reload the window to apply updates
  if (mainWindow) {
    const isDev = !app.isPackaged;
    if (isDev) {
      mainWindow.loadURL('http://localhost:3000').catch(() => {
        mainWindow.loadURL('app://localhost/index.html');
      });
    } else {
      mainWindow.loadURL('app://localhost/index.html');
    }
  }
  return { success: true };
});

ipcMain.handle('notify-app-ready', () => {
  console.log('Renderer app reported ready');
  return true;
});

// App Lifecycle
app.on('before-quit', () => {
  isQuitting = true;
});

app.whenReady().then(() => {
  handleAppProtocol();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
