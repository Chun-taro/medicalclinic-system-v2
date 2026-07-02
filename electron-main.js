const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, isDev ? 'frontend/public' : 'frontend/dist', 'clinic-logo.png')
  });

  // Remove the default menu bar
  win.setMenuBarVisibility(false);

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, 'frontend', 'dist', 'index.html')}`;
  
  win.loadURL(startUrl);

  if (isDev) {
    // Optional: Open DevTools in development
    // win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  // Secret shortcuts for Inspecting
  const { globalShortcut } = require('electron');
  
  // Standard DevTools shortcuts
  globalShortcut.register('F12', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.webContents.toggleDevTools();
  });

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.webContents.toggleDevTools();
  });

  // Secret "Inspect" shortcut
  globalShortcut.register('CommandOrControl+Alt+D', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.webContents.toggleDevTools();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  const { globalShortcut } = require('electron');
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
