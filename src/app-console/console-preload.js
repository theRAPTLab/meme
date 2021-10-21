/*//////////////////////////////////////// NOTES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is loaded by the electron mainprocess when creating its main BrowserWindow.
  By assigning properties to 'global', can selectively introduce nodeJS stuff to
  all BrowserWindow without enabling full node integration.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ////////////////////////////////////////*/

const path = require('path');
const ip = require('ip');
const { contextBridge, ipcRenderer } = require('electron');

// context bridge is for exposing elements to the renderer processes
contextBridge.exposeInMainWorld('UR', {
  GetWorkingDirectory: subpath => path.resolve(__dirname, subpath),
  GetAppName: () => '[UR]',
  Basename: bn => path.basename(bn)
});
contextBridge.exposeInMainWorld('SERVERINFO', {
  main: `http://localhost:3000`,
  client: `http://${ip.address()}:3000`
});
contextBridge.exposeInMainWorld('ui', {
  dragToDesktop: () => ipcRenderer.sendSync('dragtodesktop'),
  exportFile: () => ipcRenderer.send('onexport'),
  dragFromDesktop: files => ipcRenderer.sendSync('dragfromdesktop', files),
  importFile: () => ipcRenderer.sendSync('onimport'),
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});
