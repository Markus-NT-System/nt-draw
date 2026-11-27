'use strict';
/* NT Draw – skrivbordsprogram (Electron) runt NT Ritverktyget.
   Själva verktyget ligger i app/index.html och är samma fil som i Claude. */
const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let win = null;

// Bara ett fönster åt gången: startar man programmet igen hamnar man i det som redan är öppet.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.whenReady().then(() => { createWindow(); setupMenu(); setupUpdates(); });
  app.on('window-all-closed', () => app.quit());
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 640,
    title: 'NT Draw',
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#f4f2ee',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));

  // Länkar till webbsidor öppnas i vanlig webbläsare, inte i programmet.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file:')) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); }
  });

  // Export (PDF, SVG, PNG, JSON, 3D-zip): vanlig "Spara som"-dialog med filtyp.
  win.webContents.session.on('will-download', (event, item) => {
    const name = item.getFilename();
    const ext = path.extname(name).slice(1).toLowerCase();
    const types = { pdf: 'PDF', svg: 'SVG-bild', png: 'PNG-bild', json: 'NT Draw-ritning (JSON)', zip: '3D-utskrift (zip med 3MF + STL)' };
    item.setSaveDialogOptions({
      title: 'Spara',
      defaultPath: path.join(app.getPath('documents'), name),
      filters: types[ext] ? [{ name: types[ext], extensions: [ext] }, { name: 'Alla filer', extensions: ['*'] }] : []
    });
  });
}

function setupMenu() {
  const template = [
    { label: 'Arkiv', submenu: [{ role: 'quit', label: 'Avsluta' }] },
    { label: 'Redigera', submenu: [
      { role: 'cut', label: 'Klipp ut' }, { role: 'copy', label: 'Kopiera' },
      { role: 'paste', label: 'Klistra in' }, { role: 'selectAll', label: 'Markera allt' }
    ] },
    { label: 'Visa', submenu: [
      { role: 'resetZoom', label: 'Normal textstorlek' }, { role: 'zoomIn', label: 'Större text' },
      { role: 'zoomOut', label: 'Mindre text' }, { type: 'separator' },
      { role: 'togglefullscreen', label: 'Helskärm' }, { role: 'reload', label: 'Ladda om' },
      { role: 'toggleDevTools', label: 'Utvecklarverktyg' }
    ] },
    { label: 'Hjälp', submenu: [
      { label: 'Sök efter uppdateringar', click: () => checkForUpdates(true) },
      { label: 'Om NT Draw', click: () => dialog.showMessageBox(win, {
        type: 'info', title: 'Om NT Draw',
        message: 'NT Draw ' + app.getVersion(),
        detail: 'Ritverktyg för träprofiler.\nNorsjö Trä AB'
      }) }
    ] }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* Automatiska uppdateringar från GitHub Releases.
   Programmet kollar vid start. Finns en ny version laddas den ned i bakgrunden,
   och användaren får välja att starta om nu eller låta den installeras vid nästa avslut. */
let manualCheck = false;
function setupUpdates() {
  if (!app.isPackaged) return; // inte vid utveckling (npm start)
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-downloaded', async (info) => {
    const r = await dialog.showMessageBox(win, {
      type: 'info', buttons: ['Starta om nu', 'Senare'], defaultId: 0, cancelId: 1,
      title: 'Uppdatering klar',
      message: 'NT Draw ' + info.version + ' är nedladdad.',
      detail: 'Starta om för att använda den nya versionen. Väljer du Senare installeras den när du stänger programmet.\n\nSpara ditt utkast först om du har osparade ändringar.'
    });
    if (r.response === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.on('update-not-available', () => {
    if (manualCheck) dialog.showMessageBox(win, { type: 'info', title: 'Uppdateringar', message: 'Du har senaste versionen (' + app.getVersion() + ').' });
    manualCheck = false;
  });
  autoUpdater.on('error', (err) => {
    if (manualCheck) dialog.showMessageBox(win, { type: 'warning', title: 'Uppdateringar', message: 'Kunde inte söka efter uppdateringar.', detail: String(err && err.message || err) });
    manualCheck = false;
  });
  checkForUpdates(false);
}
function checkForUpdates(manual) {
  if (!app.isPackaged) {
    if (manual) dialog.showMessageBox(win, { type: 'info', message: 'Uppdateringar fungerar bara i det installerade programmet.' });
    return;
  }
  manualCheck = manual;
  autoUpdater.checkForUpdates().catch(() => {}); // utan internet: fortsätt tyst
}
