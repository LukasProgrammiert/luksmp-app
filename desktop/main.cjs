```javascript
const { app, BrowserWindow, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

const APP_URL = 'https://luksmp--app.lukas-wuelfing.workers.dev/';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    title: 'LukSMP',
    autoHideMenuBar: true,
    backgroundColor: '#101018',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith('https://discord.gg/') ||
      url.startsWith('https://luksmp-website.pages.dev/')
    ) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.loadURL(APP_URL);
}

function setupAutoUpdates() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'LukSMP-Update',
      message: 'Ein Update wird heruntergeladen.',
      buttons: ['OK']
    });
  });

  autoUpdater.on('update-downloaded', async () => {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'LukSMP-Update bereit',
      message: 'Das Update ist bereit. Möchtest du LukSMP jetzt neu starten?',
      buttons: ['Jetzt neu starten', 'Später'],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on('error', (error) => {
    console.error('LukSMP-Updatefehler:', error);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch((error) => {
      console.error('Update-Prüfung fehlgeschlagen:', error);
    });
  }, 4000);
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

