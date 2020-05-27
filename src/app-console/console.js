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

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ///////////////////////////////////////////*/

import React from 'react';
import ReactDOM from 'react-dom';
import AppBar from '@material-ui/core/AppBar';
import Menu from '@material-ui/core/Menu';
import CssBaseline from '@material-ui/core/CssBaseline';
import Card from '@material-ui/core/Card';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import { ipcRenderer } from 'electron';

const remote = require('electron').remote;

const styles = theme => ({
  // theme will have properties for dynamic style definition
  menuButton: {
    marginLeft: -12,
    marginRight: 20
  },
  dragOut: {
    minWidth: 200,
    minHeight: 50,
    backgroundColor: '#ddf'
  },
  dragIn: {
    minWidth: 200,
    minHeight: 50,
    backgroundColor: '#dfd'
  }
});

const sendItem = event => {
  event.preventDefault();
  console.log('is this sending???');
  console.log(event);
  ipcRenderer.send('ondragstart', '/path/to.item');
};

const droppedItem = ev => {
  console.log('is this dropping???');
  ev.preventDefault();
  // // this is for text only
  // const data = event.dataTransfer.getData('text');
  // event.target.textContent = data;

  // Use DataTransfer interface to access the file(s)
  for (var i = 0; i < ev.dataTransfer.files.length; i++) {
    var file = ev.dataTransfer.files[i];
    console.log('... file[' + i + '].name = ' + file.name);
    console.log(file);
  }
  // file props: name, path, size, type, lastModified, lastModifiedDate
};

const App = withStyles(styles)(props => {
  const { classes } = props;
  const { main, client } = remote.getGlobal('serverinfo');

  /** TODO (1): Write some kind of DRAG AND DROP handler that will
   *  grab the filename and pass it to console-main.js
   *  see github.com/electron/electron/blob/v3.1.13/docs/tutorial/native-file-drag-drop.md
   */

  /** TODO (5): Add an EXPORT button that sends a message to console-main.js
   *  telling it to save a file, and also be informed when the operation
   *  completes.
   */
  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar variant="dense">
          <IconButton className={classes.menuButton} color="inherit" aria-label="Menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" color="inherit">
            MEME SERVER
          </Typography>
        </Toolbar>
      </AppBar>
      <Typography style={{ padding: '1em' }}>
        Admin: open <b>{main}/#/admin</b>
        <br />
        Students: open <b>{client}</b>
      </Typography>
      <div className={classes.dragOut}>
        <a href="#" onDragStart={sendItem}>
          DRAG OUT
        </a>
      </div>
      <div
        className={classes.dragIn}
        onDrop={droppedItem}
        onDragOver={event => {
          event.preventDefault();
        }}
        onDragLeave={() => false}
        onDragEnd={() => false}
      >
        DRAG IN
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
