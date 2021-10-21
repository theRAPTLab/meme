/* eslint-disable no-param-reassign */
/*//////////////////////////////////////// NOTES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ELECTRON MAIN PROCESS

  NOTE: This is written for Electron V3, so ipcMain is different
  https://github.com/electron/electron/blob/v3.1.13/docs/api/ipc-main.md

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ////////////////////////////////////////*/

// import appserver
// Import parts of electron to use
const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const url = require('url');
const esq = require('electron-squirrel-startup');
const URSERVER = require('../system/server.js');
const PROMPTS = require('../system/util/prompts');

const AssetPath = asset => path.join(__dirname, 'static', asset);
const RuntimePath = file => path.join(__dirname, '../../runtime');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (esq) {
  // eslint-disable-line global-require
  app.quit();
}

const PR = PROMPTS.Pad('ElectronHost');

// our modules
// const UR = require('../ur');

// log(JSON.stringify(compiler.options));

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Temporary fix broken high-dpi scale factor on Windows (125% scaling)
// info: https://github.com/electron/electron/issues/9691
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('high-dpi-support', 'true');
  app.commandLine.appendSwitch('force-device-scale-factor', '1');
}

function createWindow() {
  // Create the browser window.
  console.log(`${PR} creating mainwindow with console-preload.js`);
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      // nodeIntegration: true,
      contextIsolation: true,
      // sandbox: true,
      preload: path.join(__dirname, 'console-preload.js') // path.join is required
    }
  });

  console.log('created mainwindow');

  // and load the index.html of the app.
  const pathname = path.resolve(__dirname, './console.html');
  const indexPath = url.format({
    protocol: 'file:',
    pathname,
    slashes: true
  });

  console.log(`${PR} loading ${path.basename(pathname)} into mainwindow`);
  mainWindow.loadURL(indexPath);
  console.log('loaded indexPath', indexPath);

  // Don't show until we are ready and loaded
  mainWindow.once('ready-to-show', () => {
    console.log(`${PR} displaying mainwindow`);
    mainWindow.show();
    mainWindow.webContents.openDevTools();
    // set application menu
    const application = {
      label: 'MEME',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    };
    const edit = {
      label: 'Edit',
      submenu: [
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          selector: 'copy:'
        }
      ]
    };
    const template = [application, edit];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));

    /// IPC HANDLERS //////////////////////////////////////////////////////////
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /** drag file to desktop to export
     */
    ipcMain.on('dragtodesktop', ipcEvent => {
      let zipPath = URSERVER.ARCHIVE.MakeDBArchive('meme');
      if (zipPath) {
        console.log('main:dragtodesktop');
        ipcEvent.sender.startDrag({
          file: zipPath,
          icon: AssetPath('mzip-export-64.png')
        });
        ipcEvent.returnValue = true;
        return;
      }
      const msg = 'could not create archive...runtime directory does not exist?';
      ipcEvent.sender.send('mainalert', msg);
      console.log(MessagePort);
      ipcEvent.returnValue = false;
    });
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /** export file
     */
    ipcMain.on('onexport', ipcEvent => {
      let zipPath = URSERVER.ARCHIVE.MakeDBArchive('meme');
      if (zipPath) {
        let zipFile = path.basename(zipPath);
        /* IIFE START */
        (async () => {
          const destPath = await dialog.showSaveDialog({
            defaultPath: `${app.getPath('desktop')}/${zipFile}`,
            filters: [{ name: 'Archives', extensions: ['zip'] }],
            properties: { createDirectory: true }
          });
          if (destPath !== undefined) {
            console.log('writing destination', destPath);
            fs.copyFileSync(zipPath, destPath);
          } else {
            console.log('export cancelled');
          }
        })();
        /* IIFE END */
      } else {
        console.log('could not create archive...runtime directory does not exist?');
      }
    });

    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /** drag file from desktop to import
     */
    ipcMain.on('dragfromdesktop', (ipcEvent, files) => {
      if (!files || files.length !== 1) {
        ipcEvent.returnValue = { error: `unexpected multiple files: ${files.length}` };
        return;
      }
      const file = files[0];
      console.log('check ft', file.type, 'file.name.ends', file.name.endsWith('MEME.ZIP'));
      if (!(file.type === 'application/zip' && file.name.endsWith('.MEME.ZIP'))) {
        const error = `INVALID FILE. Must be zip with extension .MEME.ZIP`;
        ipcEvent.sender.send('mainalert', error);
        ipcEvent.returnValue = { error };
        return;
      }
      // this is a valid zip file as far as we know
      const archivePath = URSERVER.ARCHIVE.ExtractDBArchive(file.path);
      const manifest = URSERVER.ARCHIVE.GetManifest(archivePath);
      if (manifest.error) {
        ipcEvent.returnValue = manifest.error;
        ipcEvent.sender.send('mainalert', manifest.error);
        return;
      }
      // reinitialize the server
      console.log('loaded manifest', manifest);
      const tempdb = {
        zippath: file.path,
        archivepath: archivePath,
        dbfile: manifest.db,
        appmode: 'readonly'
      };
      ipcEvent.returnValue = { ...tempdb, manifest };
      URSERVER.Initialize({ tempdb });
    });
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /** import file
     *  Electron V3: github.com/electron/electron/blob/v3.0.16/docs/api/dialog.md
     */
    ipcMain.on('onimport', ipcEvent => {
      /* IIFE START */
      (async () => {
        const files = await dialog.showOpenDialog({
          filters: [{ name: 'Archives', extensions: ['zip'] }],
          properties: ['dontAddToRecent', 'openFile']
        });
        // (1)
        if (files.length === 1) {
          const zipPath = files[0];
          console.log('file to open', zipPath);
          // this is a valid zip file as far as we know
          const archivePath = URSERVER.ARCHIVE.ExtractDBArchive(zipPath);
          const manifest = URSERVER.ARCHIVE.GetManifest(archivePath);
          if (manifest.error) {
            ipcEvent.sender.send('mainalert', manifest.error);
            ipcEvent.returnValue = { error: manifest.error };
            return;
          }
          // reinitialize the server
          console.log('loaded manifest', manifest);
          const tempdb = { archivepath: archivePath, dbfile: manifest.db, appmode: 'readonly' };
          URSERVER.Initialize({ tempdb });
          ipcEvent.returnValue = { zippath: zipPath, ...tempdb, manifest };
          return;
        }
        // (2)
        if (files.length === 0) {
          console.log('import cancelled');
        }
        // (3)
        console.log('multiple files selected');
        ipcEvent.returnValue = { error: 'multiple files selected' };
      })();
      /* IIFE END */
    });

    /// LAUNCH URSERVER ///////////////////////////////////////////////////////
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    mainWindow.webContents.send('mainstatus', 'initializing...');
    URSERVER.Initialize({ memehost: 'electron' });
    mainWindow.webContents.send('mainstatus', 'starting network...');
    URSERVER.StartNetwork();
    mainWindow.webContents.send('mainstatus', 'starting appserver...');
    URSERVER.StartWebServer(() => {
      mainWindow.webContents.send('mainstatus', 'READY');
    });
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    console.log(`${PR} mainwindow closed\n\n`);
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== 'darwin') { app.quit(); }
  app.quit();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
