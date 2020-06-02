/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/*///////////////////////////////////// NOTES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

console.js - main webpack entrypoint for Electron-based console/server

This file is loaded into the Electron MainWindow by console.html.
It is executing in an Electron (Chrome) Render Process.

The source files are in src/app-console and are transformed by webpack into
the built/console directory. See config/webpack.console.config.js invoked from
package.json scripts

NOTE: The MainWindow runs without Node integration turned on for security.
NodeJS features (like access to the filesystem) must be made through 'console-preload.js'
and accessed through the 'window' object.

NOTE: all code from this point on are using WEBPACK's require, not NodeJS. Remember this
is client-side javascript code, with Electron/Node enhancements!

NOTE: This is written for Electron V3, so ipcRenderer is different
https://github.com/electron/electron/blob/v3.1.13/docs/api/ipc-renderer.md

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ///////////////////////////////////////////*/

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import { ipcRenderer } from 'electron';
import path from 'path';

const remote = require('electron').remote;

const AssetPath = asset => path.join(__static, asset);

const styles = theme => ({
  // theme will have properties for dynamic style definition
  menuButton: {
    marginLeft: -12,
    marginRight: 20
  },
  exportZone: {
    float: 'left',
    width: 200,
    height: 200,
    backgroundColor: '#b9efb8',
    border: '2px dashed #b9efb8',
    padding: '10px',
    textAlign: 'center'
  },
  importZone: {
    float: 'left',
    width: 200,
    height: 200,
    backgroundColor: '#d6bfe8',
    border: '2px dashed #d6bfe8',
    padding: '10px',
    textAlign: 'center'
  },
  dropHilight: {
    border: '2px dashed rgba(255,0,0,1)'
  },
  disableZone: {
    display: 'none'
  }
});

const App = withStyles(styles)(props => {
  const { classes } = props;
  const { main, client } = remote.getGlobal('serverinfo');
  const [dragExport, setDragExport] = useState(false);
  const [imported, setImported] = useState(false);
  const [loadStatus, setLoadStatus] = useState('initializing server');

  /** avoid creating listeners on every render **/
  useEffect(() => {
    ipcRenderer.on('mainalert', (event, msg) => {
      console.log('alert:', msg);
      alert(msg);
    });

    ipcRenderer.on('mainstatus', (event, msg) => {
      setLoadStatus(msg);
    });
  }, []);

  const doDragToDesktop = event => {
    event.preventDefault();
    setDragExport(true);
    ipcRenderer.sendSync('dragtodesktop');
    setDragExport(false);
  };
  //
  const doExportFile = event => {
    event.preventDefault();
    ipcRenderer.send('onexport');
  };
  //
  const doDragFromDesktop = event => {
    event.preventDefault();
    // Use DataTransfer interface to access the file(s)
    const files = [];
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      const file = event.dataTransfer.files[i];
      files.push({
        name: file.name,
        path: file.path,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
    }
    const retval = ipcRenderer.sendSync('dragfromdesktop', files);
    const { error, zippath } = retval;
    if (error) console.log('ERROR', error);
    if (zippath) setLoadStatus(`REVIEWING ARCHIVE: ${path.basename(zippath)}`);
    setImported(true);
  };
  //
  const doImportFile = event => {
    event.preventDefault();
    const retval = ipcRenderer.sendSync('onimport');
    const { error, zippath } = retval;
    if (error) console.log('ERROR', error);
    if (zippath) setLoadStatus(`REVIEWING ARCHIVE: ${path.basename(zippath)}`);
    setImported(true);
  };

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar variant="dense">
          <Typography variant="h4" color="inherit">
            {PACKAGE_TITLE} {PACKAGE_VERSION}
          </Typography>
        </Toolbar>
      </AppBar>
      <Paper style={{ padding: '0.5em 24px', borderRadius: 0 }}>
        <Typography>{PACKAGE_DESCRIPTION}</Typography>
      </Paper>
      <Typography variant="caption" style={{ padding: '1.5em 0 1em 24px' }}>
        {loadStatus}
      </Typography>
      <Typography variant="h6" style={{ padding: '1.5em 0 0 24px' }}>
        Connection Instructions:
      </Typography>
      <Typography style={{ padding: '1em 0 2em 24px' }}>
        Admin: open <b>{main}/#/admin</b>
        <br />
        Students: open <b>{client}</b>
      </Typography>
      <div>
        <div className={classes.importZone}>
          <img
            src={AssetPath('mzip-import.png')}
            width="128px"
            onClick={doImportFile}
            onDrop={event => {
              if (dragExport) return;
              event.currentTarget.classList.remove(classes.dropHilight);
              doDragFromDesktop(event);
              event.preventDefault();
            }}
            onDragStart={event => {
              event.preventDefault();
            }}
            onDragOver={event => {
              if (!dragExport) event.currentTarget.classList.add(classes.dropHilight);
              event.preventDefault();
            }}
            onDragLeave={event => {
              event.currentTarget.classList.remove(classes.dropHilight);
              event.preventDefault();
            }}
          />
          <br />
          LOAD MZIP ARCHIVE
          <br />
          click or drag file over
        </div>
        <div className={classes.exportZone} hidden={imported}>
          <img
            src={AssetPath('mzip-export.png')}
            width="128px"
            onClick={doExportFile}
            onDragStart={doDragToDesktop}
            draggable
          />
          <div>
            MAKE MZIP ARCHIVE
            <br />
            click or drag to desktop
          </div>
        </div>
        <div
          className={classes.exportZone}
          style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}
          hidden={!imported}
        >
          <strong>DATABASE ARCHIVE REVIEW MODE</strong>
          <br />
          The original database has not been changed. You can import another archive.
          <br />
          Quit and restart app to restore active database.
        </div>
      </div>
    </div>
  );
});

// console.warn(
//   '\nMEME DEVS:\nYou can ignore the Security Warning below, as it is to scare you into reading about Electron security\n'
// );
ReactDOM.render(<App />, document.querySelector('#app-console'), () => {
  console.log('Loaded Electron MainWindow Entry Point @ console.js');
  console.log('Starting console-app modules');
});
