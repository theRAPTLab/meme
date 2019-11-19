/*//////////////////////////////////////// NOTES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ELECTRON MAIN PROCESS

  copied as-is from src/app-console

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ////////////////////////////////////////*/

// import appserver
// Import parts of electron to use
const { app, BrowserWindow, Menu } = require('electron');
const ip = require('ip');
const path = require('path');
const url = require('url');
const URSERVER = require('../system/server.js');
const PROMPTS = require('../system/util/prompts');

const PR = PROMPTS.Pad('ElectronHost');
// this is available through electron remote in console.js
global.serverinfo = {
  main: `http://localhost:3000`,
  client: `http://${ip.address()}:3000`
};

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
      nodeIntegration: false, // 'true' enables nodejs features
      preload: path.join(__dirname, 'console-preload.js') // path.join is required
    }
  });

  // and load the index.html of the app.
  const pathname = path.resolve(__dirname, './console.html');
  const indexPath = url.format({
    protocol: 'file:',
    pathname,
    slashes: true
  });

  console.log(`${PR} loading ${path.basename(pathname)} into mainwindow`);
  mainWindow.loadURL(indexPath);

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

    // launch UR server
    URSERVER.Initialize({ memehost: 'electron' });
    URSERVER.StartNetwork();
    URSERVER.StartWebServer();
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
