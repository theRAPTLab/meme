/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SystemInit - Start Lifecycle of Application

  SystemInit is executed from web-index.js, which itself is loaded by
  web-index.html

  It starts the URSYS lifecycle system, then spawns React SystemShell
  with a ReactRouter <HashRouter> that loades <SystemShell>

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import debounce from 'debounce';
import SystemRoutes from './SystemRoutes';
import SystemShell from './SystemShell';
import UR from '../../system/ursys';
import EXEC from '../../system/ur-exec';
import { cssreset, cssur, cssuri } from '../modules/console-styles';

/// DEBUG CONTROL /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// SYSTEM-WIDE LANGUAGE EXTENSIONS ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// These are loaded in init to make sure they are available globally!
/// You do not need to copy these extensions to your own module files
require('babel-polyfill'); // enables regenerators for async/await
require('webrtc-adapter'); // shim webrtc

/// URSYS STARTUP /////////////////////////////////////////////////////////////
/*/
/*/
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Init() {
  console.log('%cURSYS: INITIALIZE', cssur);
  // handle window resize events through URSYS
  window.addEventListener(
    'resize',
    debounce(() => {
      UR.Publish('WINDOW:SIZE');
      // console.clear();
    }, 500)
  );
  // initialize app when DOM is completely resolved
  document.addEventListener('DOMContentLoaded', () => {
    if (DBG) console.log('%cINIT %cDOMContentLoaded. Starting URSYS Lifecycle!', cssur, cssreset);
    // determine current scope of running app based on path
    // so URSYS will not execute lifecycle phases in any module
    // that exists outside those key directories
    UR.RoutePreflight(SystemRoutes);
    // asynchronous code startup
    (async () => {
      await EXEC.JoinNet(); // URSYS socket connection (that is all)
      await EXEC.EnterApp(); // TEST_CONF, INITIALIZE, LOAD_ASSETS, CONFIGURE
      await m_PromiseRenderApp(); // compose React view
      await m_BrokenPromiseWindowResize();
      await EXEC.SetupDOM(); // DOM_READY
      await EXEC.SetupRun(); // RESET, START, REG_MESSAGE, APP_READY, RUN
      /* everything is done, system is running */
      if (DBG)
        console.log('%cINIT %cURSYS Lifecycle Initialization Complete', 'color:blue', 'color:auto');
      if (DBG) console.groupEnd();
    })();
  });
}
/// STARTUP HELPER FUNCTIONS
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/
function m_PromiseRenderApp() {
  if (DBG) console.log('%cINIT %cReactDOM.render() begin', 'color:blue', 'color:auto');
  return new Promise((resolve, reject) => {
    try {
      ReactDOM.render(
        <HashRouter hashType="slash">
          <SystemShell />
        </HashRouter>,
        document.getElementById('app-container'),
        () => {
          console.log('%cURSYS: START', cssur);
          resolve();
        }
      );
    } catch (e) {
      const err = `System Initialization Error in React URSYS`;
      console.error(err);
    }
  }); // promise
}

function m_BrokenPromiseWindowResize() {
  return new Promise((resolve, reject) => {
    console.log('%cURSYS: Firing WINDOW:SIZE', cssuri);
    UR.Publish('WINDOW:SIZE');
    resolve();
  });
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default { Init };
