const { app, BrowserWindow, shell } = require('electron');

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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});



