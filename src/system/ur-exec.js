/* eslint-disable no-debugger */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/**
 * @module URExec
 */
/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import { Dirname } from './util/path';
import URNET from './ur-network';
import DataLink from './ur-class-datalink';
import { cssuri } from '../app-web/modules/console-styles';

/// PRIVATE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PHASE_HOOKS = new Map();
const PHASES = [
  'TEST_CONF', // setup tests
  'INITIALIZE', // module data structure init
  'LOADASSETS', // load any external data, make connections
  'CONFIGURE', // configure runtime data structures
  'DOM_READY', // when viewsystem has completely composed
  'RESET', // reset runtime data structures
  'START', // start normal execution run
  'REG_MESSAGE', // last chance to register a network message
  'APP_READY', // app connected to UNISYS network server
  'RUN', // system starts running
  'UPDATE', // system is running (periodic call w/ time)
  'PREPAUSE', // system wants to pause run
  'PAUSE', // system has paused (periodic call w/ time)
  'POSTPAUSE', // system wants to resume running
  'STOP', // system wants to stop current run
  'DISCONNECT', // ursys server has gone offline
  'RECONNECT', // ursys server has reconnected
  'UNLOADASSETS', // system releases any connections
  'SHUTDOWN' // system wants to shut down
];

const DBG = false;
const BAD_PATH = "module_path must be a string derived from the module's module.id";
const UDATA = new DataLink(module);

let EXEC_PHASE; // current execution phase (the name of the phase)
let EXEC_SCOPE; // current execution scope (the path of active view)

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UTILITY: compare the destination scope with the acceptable scope.
    if the scope starts with view, check it. otherwise just run it.
/*/
function m_ExecuteScopedPhase(phase, o) {
  // handle 'view' directory specially
  if (o.scope.indexOf('view') === 0) {
    // if it's the current scope, run it!
    if (o.scope.includes(EXEC_SCOPE, 0)) return o.f();
    // otherwise don't run it
    if (DBG)
      console.info(`EXEC: skipping [${phase}] for ${o.scope} because scope is ${EXEC_SCOPE}`);
    return undefined;
  }
  // if we got this far, then it's something not in the view path
  return o.f();
}

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
/*/ API: register a Phase Handler which is invoked by MOD.Execute()
    phase is a string constant from PHASES array above
    f is a function that does work immediately, or returns a Promise
/*/
const Hook = (phase, f, scope) => {
  try {
    // make sure scope is included
    if (typeof scope !== 'string') {
      console.log('GOT', phase, f, scope);
      if (typeof scope === 'object' && scope.URMOD) scope = scope.URMOD;
      throw Error(`<arg3> scope should be object with UMOD prop`);
    }
    // does this phase exist?
    if (typeof phase !== 'string') throw Error("<arg1> must be PHASENAME (e.g. 'LOADASSETS')");
    if (!PHASES.includes(phase)) throw Error(phase, 'is not a recognized exec phase');
    // did we also get a promise?
    if (!(f instanceof Function))
      throw Error('<arg2> must be a function optionally returning Promise');
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
/*/ API: Execute all Promises associated with a phase, completing when
    all the callback functions complete. If the callback function returns
    a Promise, this is added to a list of Promises to wait for before the
    function returns control to the calling code.
/*/
const Execute = async phase => {
  // require scope to be set
  if (EXEC_SCOPE === false)
    throw Error(`UNISYS.SetScopePath() must be set to RootJSX View's module.id. Aborting.`);

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
  if (DBG) console.group(phase);
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
      if (DBG) console.log(`[${phase} EXECUTE ERROR ${err}`);
      throw Error(`[${phase} EXECUTE ERROR ${err}`);
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
  let hashbits = window.location.hash.split('/');
  const hash = hashbits[0].substring(1);
  const loc = `/${hash}`;
  const matches = routes.filter(route => {
    return route.path === loc;
  });
  if (matches.length) {
    const { component } = matches[0];
    /*/
    to set the scope, we need to have a unique name to set. this scope is probably
    a directory. we can set the UMOD property using the __dirname config for webpack
    /*/
    if (component.URMOD === undefined)
      console.log(`%cWARNING: root view '${loc}' has no UMOD property, so can not set URSYS scope`);
    const viewpath = component.URMOD || 'boot';
    SetScopePath(viewpath);
  } else {
    /*/
    NO MATCHES
    /*/
    console.log(`%cSetScopeFromRoutes() no match for ${loc}`, cssuri);
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: The scope is used to filter EXEC events within a particular
    application path, which are defined under the view directory.
/*/
const SetScopePath = view_path => {
  if (typeof view_path !== 'string') throw Error(BAD_PATH);
  EXEC_SCOPE = view_path;
  if (DBG) console.log(`SetScopePath() EXEC_SCOPE is now '${EXEC_SCOPE}'`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: The scope
/*/
const CurrentScope = () => {
  return EXEC_SCOPE;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const MatchScope = check => {
  return EXEC_SCOPE.includes(check);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application startup
/*/
const EnterApp = () => {
  return new Promise(async (resolve, reject) => {
    try {
      await Execute('TEST_CONF'); // TESTCONFIG hook
      await Execute('INITIALIZE'); // INITIALIZE hook
      await Execute('LOADASSETS'); // LOADASSETS hook
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
/*/ API: call this when the view system's DOM has stabilized and is ready
    for manipulation by other code
/*/
const SetupDOM = () => {
  return new Promise(async (resolve, reject) => {
    try {
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
/*/ API: network startup
/*/
const JoinNet = () => {
  return new Promise((resolve, reject) => {
    try {
      URNET.Connect(UDATA, { success: resolve, failure: reject });
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
/*/ API: configure system before run
/*/
const SetupRun = () => {
  return new Promise(async (resolve, reject) => {
    try {
      await Execute('RESET'); // RESET runtime datastructures
      await Execute('START'); // START running
      await Execute('REG_MESSAGE'); // register messages
      await UDATA.PromiseRegisterMessages(); // send messages
      await Execute('APP_READY'); // app is connected
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
/*/ API: handle periodic updates for a simulation-driven timestep
/*/
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
/*/ API: do the Shutdown EXEC
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/
const BeforePause = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('PREPAUSE');
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown EXEC
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/
const Paused = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('PAUSE');
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown EXEC
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/
const PostPause = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('POSTPAUSE');
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown EXEC
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/
const CleanupRun = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('STOP');
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application offline
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/
const ServerDisconnect = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('DISCONNECT');
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application shutdown
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/
const ExitApp = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('UNLOADASSETS');
    await Execute('SHUTDOWN');
    resolve();
  });
};
/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  Hook,
  Execute,
  SetScopePath,
  CurrentScope,
  MatchScope,
  EnterApp,
  SetupDOM,
  JoinNet,
  SetupRun,
  Run,
  BeforePause,
  Paused,
  PostPause,
  CleanupRun,
  ServerDisconnect,
  ExitApp,
  SetScopeFromRoutes
};
