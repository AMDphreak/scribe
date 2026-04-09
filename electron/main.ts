import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null;

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Scribe',
      submenu: [
        { label: 'About Scribe', role: 'about' },
        { type: 'separator' },
        { label: 'Settings...', accelerator: 'CmdOrCtrl+,', click: () => mainWindow?.webContents.send('menu:open-settings') },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        { label: 'Open Repository...', accelerator: 'CmdOrCtrl+O', click: () => mainWindow?.webContents.send('menu:open-repo') },
        { label: 'Open Sample Repo', click: () => mainWindow?.webContents.send('menu:open-sample') },
        { type: 'separator' },
        { label: 'Publish Changes', accelerator: 'CmdOrCtrl+P', click: () => mainWindow?.webContents.send('menu:publish') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+B', click: () => mainWindow?.webContents.send('menu:toggle-sidebar') },
        { label: 'Toggle Preview', accelerator: 'CmdOrCtrl+Shift+P', click: () => mainWindow?.webContents.send('menu:toggle-preview') }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Scribe — Write. Publish. Done.",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    titleBarStyle: 'hiddenInset'
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  createMenu();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

import { listProfiles } from './lib/profiles';
import { parseRepoUrl, cloneRepo, hasUncommittedChanges, commitAndPush, checkAuth, logout, getRepoMeta } from './lib/git';
import { detectSsg, getFileTree, writeSsgConfig } from './lib/ssg';
import { startDevServer, stopDevServer } from './lib/devserver';
import { checkTools, installTool, getToolPath, createSampleRepo } from './lib/setup';

ipcMain.handle('repo:list-profiles', async (_event) => listProfiles(path.join(app.getAppPath(), 'profiles')));
ipcMain.handle('repo:parse', async (_event, url) => parseRepoUrl(url));
ipcMain.handle('repo:clone', async (_event, repo, dir) => cloneRepo(repo, dir));
ipcMain.handle('repo:status', async (_event, dir) => hasUncommittedChanges(dir));
ipcMain.handle('repo:publish', async (_event, dir, msg) => commitAndPush(dir, msg));
ipcMain.handle('repo:check-auth', async (_event, providerId) => checkAuth(providerId));
ipcMain.handle('repo:logout', async (_event, providerId) => logout(providerId));
ipcMain.handle('repo:get-meta', async (_event, repo) => getRepoMeta(repo));

ipcMain.handle('ssg:detect', async (_event, dir) => detectSsg(dir));
ipcMain.handle('ssg:write-config', async (_event, dir, type, nav) => writeSsgConfig(dir, type, nav));
ipcMain.handle('fs:tree', async (_event, dir, roots) => getFileTree(dir, roots));

ipcMain.handle('dev:start', async (_event, dir, type) => startDevServer(dir, type));
ipcMain.handle('dev:stop', async (_event) => stopDevServer());

ipcMain.handle('setup:check-tools', async (_event) => checkTools());
ipcMain.handle('setup:install-tool', async (_event, id) => installTool(id));
ipcMain.handle('setup:get-tool-path', async (_event, cmd) => getToolPath(cmd));
ipcMain.handle('setup:sample-repo', async (_event) => createSampleRepo(app.getPath('userData')));
ipcMain.handle('setup:auth-login', async (_event, providerId) => {
    if (providerId === 'github') {
        const { exec } = require('child_process');
        exec('gh auth login --web --git-protocol https');
        return true;
    }
    if (providerId === 'gitlab') {
        const { exec } = require('child_process');
        exec('glab auth login');
        return true;
    }
    return false;
});

