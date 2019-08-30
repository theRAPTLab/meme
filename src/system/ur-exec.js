/* eslint-disable no-debugger */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UR Lifecycle Phases
  to use:
  EXEC.Hook('PHASE',(

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/**
 * @module URExec
 */
/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import URNET from './ur-network';
import URLink from './common-urlink';
import { cssuri, cssalert, cssinfo, cssblue, cssreset } from '../app-web/modules/console-styles';

/// PRIVATE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PHASE_HOOKS = new Map();
const PHASES = [
  'TEST_CONF', // setup tests
  'INITIALIZE', // module data structure init
  'LOAD_ASSETS', // load any external data, make connections
  'CONFIGURE', // configure runtime data structures
  'DOM_READY', // when viewsystem has completely composed
  'RESET', // reset runtime data structures
  'START', // start normal execution run
  'REG_MESSAGE', // last chance to register a network message
  'APP_READY', // app connected to URSYS network server
  'RUN', // system starts running
  'UPDATE', // system is running (periodic call w/ time)
  'PREPAUSE', // system wants to pause run
  'PAUSE', // system has paused (periodic call w/ time)
  'POSTPAUSE', // system wants to resume running
  'STOP', // system wants to stop current run
  'DISCONNECT', // ursys server has gone offline
  'RECONNECT', // ursys server has reconnected
  'UNLOAD_ASSETS', // system releases any connections
  'SHUTDOWN' // system wants to shut down
];

/// COMPUTED DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let REACT_PHASES = [];

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const BAD_PATH = "module_path must be a string derived from the module's __dirname";
const ULINK = new URLink('UREXEC');

/// STATE /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let EXEC_PHASE; // current execution phase (the name of the phase)
let EXEC_SCOPE; // current execution scope (the path of active view)

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UTILITY: compare the destination scope with the acceptable scope.
    if the scope starts with view, check it. otherwise just run it.
/*/
function m_ExecuteScopedPhase(phase, o) {
  // reject hooks that dont' match the current 'views' path that might
  // be initializing in other React root views outside the class
  if (o.scope.indexOf('views') === 0) {
    // if it's the current scope, run it!
    // console.log(`${phase} DOES '${EXEC_SCOPE}' contain '${o.scope}'?`);
    if (o.scope.includes(EXEC_SCOPE, 0)) return o.f();
    // otherwise don't run it
    if (DBG) console.info(`skipped '${o.scope}'`);
    return undefined;
  }
  // if we got this far, then it's something not in the view path
  // f() can return a Promise to force asynchronous waiting!
  return o.f();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UTILITY: compute the list of allowable REACT PHASES
    that will be updated
/*/
function m_SetValidReactPhases(phase) {
  let retval;
  if (phase === undefined) {
    retval = REACT_PHASES.shift();
  } else {
    const dr_index = PHASES.findIndex(el => {
      return el === phase;
    });
    if (dr_index > 0) REACT_PHASES = PHASES.slice(dr_index);
    retval = REACT_PHASES[0];
  }
  // if (DBG) console.log('REACT_PHASES:', REACT_PHASES.join(', '));
  return retval;
}
// initialize
m_SetValidReactPhases('DOM_READY');

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UTILITY: maintain current phase status (not used for anything currently)
/*/
function m_UpdateCurrentPhase(phase) {
  EXEC_PHASE = phase;
  if (DBG) console.log(`PHASE UPDATED ${EXEC_PHASE}`);
}

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXEC METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: register a Phase Handler which is invoked by MOD.Execute() phase is a
    string constant from PHASES array above f is a function that does work
    immediately, or returns a Promise
*/
const Hook = (scope, phase, f) => {
  try {
    // make sure scope is included
    if (typeof scope !== 'string') throw Error(`<arg1> scope should be included`);

    // does this phase exist?
    if (typeof phase !== 'string') throw Error("<arg2> must be PHASENAME (e.g. 'LOAD_ASSETS')");
    if (!PHASES.includes(phase)) throw Error(`${phase} is not a recognized phase`);
    // did we also get a promise?
    if (!(f instanceof Function))
      throw Error('<arg3> must be a function optionally returning Promise');
    // get the list of promises associated with this phase
    // and add the new promise
    if (!PHASE_HOOKS.has(phase)) PHASE_HOOKS.set(phase, []);
    PHASE_HOOKS.get(phase).push({ f, scope });
    if (DBG) console.log(`[${phase}] added handler`);
  } catch (e) {
    console.error(e);
    debugger;
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * API: Return TRUE if the passed string is a valid URSYS phase that
 * a React component can tap
 * @param {string} phase
 */
const IsReactPhase = phase => {
  return (
    REACT_PHASES.findIndex(el => {
      return phase === el;
    }) > 0
  );
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Execute all Promises associated with a phase, completing when
    all the callback functions complete. If the callback function returns
    a Promise, this is added to a list of Promises to wait for before the
    function returns control to the calling code.
*/
const Execute = async phase => {
  // require scope to be set
  if (EXEC_SCOPE === undefined)
    throw Error(`UR EXEC scope is not set. Did you attach MOD_ID to your main React view?`);

  // note: contents of PHASE_HOOKs are promise-generating functions
  if (!PHASES.includes(phase)) throw Error(`${phase} is not a recognized EXEC phase`);
  let hooks = PHASE_HOOKS.get(phase);
  if (hooks === undefined) {
    if (DBG) console.log(`[${phase}] no subscribers`);
    return;
  }

  // phase housekeeping
  m_UpdateCurrentPhase(`${phase}_PENDING`);

  // now execute handlers and promises
  let icount = 0;
  if (DBG) console.group(`${phase} - ${EXEC_SCOPE}`);
  // get an array of promises
  // o contains f, scope pushed in Hook() above
  let promises = hooks.map(o => {
    let retval = m_ExecuteScopedPhase(phase, o);
    if (retval instanceof Promise) {
      icount++;
      return retval;
    }
    // return undefined to signal no special handling
    return undefined;
  });
  promises = promises.filter(e => {
    return e !== undefined;
  });
  if (DBG && hooks.length) console.log(`[${phase}] HANDLERS PROCESSED : ${hooks.length}`);
  if (DBG && icount) console.log(`[${phase}] PROMISES QUEUED    : ${icount}`);

  // wait for all promises to execute
  await Promise.all(promises)
    .then(values => {
      if (DBG && values.length)
        console.log(`[${phase}] PROMISES RETURNED  : ${values.length}`, values);
      if (DBG) console.groupEnd();
      return values;
    })
    .catch(err => {
      if (DBG) console.log(`[${phase}]: ${err}`);
      throw Error(`[${phase}]: ${err}`);
    });

  // phase housekeeping
  m_UpdateCurrentPhase(phase);
};

/**
 * Called during SystemInit to determine what the dynamic path is
 * by matching
 * @memberof URExec
 * @param {Object[]} routes list of route objects
 * @param {String} routes[].path the /path to match
 * @param {Object} routes[].component the loaded view
 * @returns true if scope was set successfully, false otherwise
 */
const SetScopeFromRoutes = routes => {
  // get current hash, without trailing parameters and # char
  const hashbits = window.location.hash.substring(1).split('/');
  const loc = `/${hashbits[1] || ''}`;
  console.log(`%cHASH_XLATE%c '${window.location.hash}' --> '${loc}'`, cssinfo, cssreset);
  const matches = routes.filter(route => {
    return route.path === loc;
  });
  if (matches.length) {
    const { component } = matches[0];
    /*/
    to set the scope, we need to have a unique name to set. this scope is probably
    a directory. we can set the UMOD property using the __dirname config for webpack
    /*/
    if (component.MOD_ID === undefined)
      console.error(`WARNING: component for route '${loc}' has no MOD_ID property`);
    else {
      const viewpath = component.MOD_ID || 'boot';
      SetScopePath(viewpath);
    }
    return;
  }
  /* NO MATCHES */
  console.log(`%cSetScopeFromRoutes() no match for ${loc}`, cssuri);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: The scope is used to filter EXEC events within a particular
    application path, which are defined under the view directory.
*/
const SetScopePath = view_path => {
  if (typeof view_path !== 'string') throw Error(BAD_PATH);
  EXEC_SCOPE = view_path;
  console.info(`%cEXEC_SCOPE%c '${EXEC_SCOPE}'`, cssinfo, cssreset);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: The scope
 */
const CurrentScope = () => {
  return EXEC_SCOPE;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const MatchScope = check => {
  return EXEC_SCOPE.includes(check);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: application startup
 */
const EnterApp = () => {
  return new Promise(async (resolve, reject) => {
    try {
      m_SetValidReactPhases('DOM_READY');
      await Execute('TEST_CONF'); // TESTCONFIG hook
      await Execute('INITIALIZE'); // INITIALIZE hook
      await Execute('LOAD_ASSETS'); // LOAD_ASSETS hook
      await Execute('CONFIGURE'); // CONFIGURE support modules
      resolve();
    } catch (e) {
      console.error(
        'EnterApp() Execution Error. Check phase execution order effect on data validity.\n',
        e
      );
      debugger;
    }
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: call this when the view system's DOM has stabilized and is ready
    for manipulation by other code
*/
const SetupDOM = () => {
  return new Promise(async (resolve, reject) => {
    try {
      m_SetValidReactPhases(); // remove leftmost phase
      await Execute('DOM_READY'); // GUI layout has finished composing
      resolve();
    } catch (e) {
      console.error(
        'SetupDOM() Execution Error. Check phase execution order effect on data validity.\n',
        e
      );
      debugger;
    }
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: network startup
 */
const JoinNet = () => {
  return new Promise((resolve, reject) => {
    try {
      URNET.Connect(ULINK, { success: resolve, failure: reject });
    } catch (e) {
      console.error(
        'JoinNet() Execution Error. Check phase execution order effect on data validity.\n',
        e
      );
      debugger;
    }
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: configure system before run
 */
const SetupRun = () => {
  return new Promise(async (resolve, reject) => {
    try {
      m_SetValidReactPhases(); // remove leftmost phase
      await Execute('RESET'); // RESET runtime datastructures
      m_SetValidReactPhases(); // remove leftmost phase
      await Execute('START'); // START running
      m_SetValidReactPhases(); // remove leftmost phase
      await Execute('REG_MESSAGE'); // register messages
      await ULINK.PromiseRegisterSubscribers(); // send messages
      m_SetValidReactPhases(); // remove leftmost phase
      await Execute('APP_READY'); // app is connected
      m_SetValidReactPhases(); // remove leftmost phase
      await Execute('RUN'); // tell network APP_READY
      resolve();
    } catch (e) {
      console.error(
        'SetupRun() Execution Error. Check phase execution order effect on data validity.\n',
        e
      );
      debugger;
    }
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: handle periodic updates for a simulation-driven timestep
 */
const Run = () => {
  return new Promise(async (resolve, reject) => {
    try {
      await Execute('UPDATE');
      resolve();
    } catch (e) {
      console.error(e);
    }
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: do the Shutdown EXEC
    NOTE ASYNC ARROW FUNCTION (necessary?)
*/
const Pause = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('PREPAUSE');
    await Execute('PAUSE');
    await Execute('POSTPAUSE');
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: do the Shutdown EXEC
    NOTE ASYNC ARROW FUNCTION (necessary?)
*/
const CleanupRun = () => {
  return new Promise(async (resolve, reject) => {
    m_SetValidReactPhases('DISCONNECT'); // remove leftmost phase
    await Execute('STOP');
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: application offline
    NOTE ASYNC ARROW FUNCTION (necessary?)
*/
const ServerDisconnect = () => {
  return new Promise(async (resolve, reject) => {
    m_SetValidReactPhases(); // remove leftmost phase
    await Execute('DISCONNECT');
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: application shutdown
    NOTE ASYNC ARROW FUNCTION (necessary?)
*/
const ExitApp = () => {
  return new Promise(async (resolve, reject) => {
    m_SetValidReactPhases(); // remove leftmost phase
    await Execute('UNLOAD_ASSETS');
    m_SetValidReactPhases(); // remove leftmost phase
    await Execute('SHUTDOWN');
    resolve();
  });
};

const ModulePreflight = (comp, mod) => {
  if (!comp) return 'arg1 must be React component root view';
  if (!mod) return `arg2 must be 'module' keyword`;
  if (!mod.id) return `arg2 is not a 'module' keyword`;
  if (!comp.MOD_ID)
    return `Component.MOD_ID static property must be set = __dirname (e.g. ViewMain.MOD_ID=__dirname)`;
};
/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  Hook,
  Execute,
  SetScopePath,
  ModulePreflight,
  CurrentScope,
  MatchScope,
  EnterApp,
  SetupDOM,
  JoinNet,
  SetupRun,
  Run,
  Pause,
  CleanupRun,
  ServerDisconnect,
  ExitApp,
  SetScopeFromRoutes,
  IsReactPhase
};
