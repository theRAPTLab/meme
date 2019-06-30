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
import { HashRouter, Route, Link, withRouter } from 'react-router-dom';
import debounce from 'debounce';
import SystemShell from './SystemShell';
import SystemRoutes from './SystemRoutes';
import UR from '../../system/ursys';
import { cssblue, cssinfo, cssreset, cssur, cssuri } from '../modules/console-styles';

/// DEBUG CONTROL /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// SYSTEM-WIDE LANGUAGE EXTENSIONS ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// These are loaded in init to make sure they are available globally!
/// You do not need to copy these extensions to your own module files
require('babel-polyfill'); // enables regenerators for async/await

/// LIFECYCLE HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// set scope for URSYS execution
function SetLifecycleScope() {
  // check #, and remove any trailing parameters in slashes
  // we want the first one
  const hashbits = window.location.hash.split('/');
  const hash = hashbits[0];
  const loc = `/${hash}`;
  const matches = SystemRoutes.filter(route => {
    // console.log(`route ${route.path} loc ${loc}`);
    return route.path === loc;
  });
  if (matches.length) {
    if (DBG) console.log(`%cLifecycle Module Scope is ${hash}`, cssuri);
    const { component } = matches[0];
    if (component.UMOD === undefined)
      console.log(
        `%cWARNING: root view '${loc}' has no UMOD property, so can not set URSYS scope`,
        cssuri
      );
    // SYSLOOP ccheckes the scope value when executing phases
    // const modscope = component.UMOD || '<undefined>/init.jsx';
    // URSYS.SetScope(modscope);
  } else {
    console.log(`%cSetLifecycleScope() no match for ${loc}`, cssuri);
  }
}

/// URSYS STARTUP /////////////////////////////////////////////////////////////
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
    SetLifecycleScope();
    // asynchronous code startup
    (async () => {
      // await URSYS.JoinNet(); // URSYS socket connection (that is all)
      // await URSYS.EnterApp(); // TEST_CONF, INITIALIZE, LOADASSETS, CONFIGURE
      // await RenderApp(); // compose React view
      // ReactDOM.render(
      //   <HashRouter hashType="slash">
      //     <SystemShell />
      //   </HashRouter>,
      //   () => {
      //     document.querySelector('#app-container'),
      //       console.log('%cINIT %cReactDOM.render() complete', 'color:blue', 'color:auto');
      //   }
      // );
      // await URSYS.SetupDOM(); // DOM_READY
      // await URSYS.SetupRun(); // RESET, START, APP_READY, RUN

      // since await block isn't implemented yet, just draw ReactDOM now
      ReactDOM.render(
        <HashRouter hashType="slash">
          <SystemShell />
        </HashRouter>,
        document.getElementById('app-container'),
        () => {
          console.log('%cURSYS: START', cssur);
          console.log('%cURSYS: Firing WINDOW:SIZE', cssuri);
          UR.Publish('WINDOW:SIZE');
        }
      );
      // everything is done, system is running
      if (DBG)
        console.log('%cINIT %cURSYS Lifecycle Initialization Complete', 'color:blue', 'color:auto');
      if (DBG) console.groupEnd();
    })();
  });
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default { Init };
