/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ursys is the browser-side of the UR library.

  Hook()
  Define(), GetVal(), SetVal()
  Publish(), Subscribe()
  Call()

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import CENTRAL from './ur-central';
import EXEC from './ur-exec';
import ReloadOnViewChange from './util/reload';
import NetMessage from './common-netmessage';
import URLink from './common-urlink';
import REFLECT from './util/reflect';
import SESSION from './common-session';

/// PRIVATE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true; // module-wide debug flag
const PR = 'URSYS';
const ULINK = NewConnection(PR);

/// RUNTIME FLAGS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// ur_legacy_publish is used to make DATALINK.Publish() work like Broadcast, so
// messages will mirror back to itself
CENTRAL.Define('ur_legacy_publish', true);

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 * Return a new instance of a URSYS connection, which handles all the important
 * id meta-data for communicating over the network
 * @param {string} name - An optional name
 */
function NewConnection(name) {
  let uname = name || 'ANON';
  return new URLink(uname);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 * Utility method to Hook using a passed module id without loading UREXEC
 * explicitly
 */
const { Hook } = EXEC;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 * Utility method to Hook using a passed module id without loading UREXEC
 * explicitly
 */
function ReactHook(scope, phase, func) {
  if (!EXEC.IsReactPhase(phase)) throw Error(`Phase ${phase} has already passed; can't hook it!`);
  Hook(scope, phase, f);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// provide convenience links to the URSYS main ULINK
const { Publish, Subscribe, Unsubscribe } = ULINK;
const { Call, Signal } = ULINK;

const { NetPublish, NetSubscribe, NetUnsubscribe } = ULINK;
const { NetCall, NetSignal } = ULINK;

function WriteDB(cmd, data) {
  if (!data.key) {
    const { SESSION_Key } = CENTRAL.GetVal('ur_session');
    console.log('setting access key', SESSION_Key);
    data.key = SESSION_Key;
  }
  return ULINK._WriteDB(cmd, data);
}

const { Define, GetVal, SetVal } = CENTRAL;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// TEMP: return the number of peers on the network
function PeerCount() {
  return NetMessage.PEERS.count;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ReactPreflight(comp, mod) {
  ReloadOnViewChange();
  const err = EXEC.ModulePreflight(comp, mod);
  if (err) console.error(err);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RoutePreflight(routes) {
  const err = EXEC.SetScopeFromRoutes(routes);
  if (err) console.error(err);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UR = {
  Hook, // EXEC
  NewConnection, // ULINK
  Publish, // ULINK
  Subscribe, // ULINK
  Unsubscribe, // ULINK
  Call, // ULINK
  Signal, // ULINK
  NetPublish, // ULINK
  NetSubscribe, // ULINK
  NetUnsubscribe, // ULINK
  NetCall, // ULINK
  NetSignal, // ULINK
  WriteDB, // ULINK
  Define, // CENTRAL
  GetVal, // CENTRAL
  SetVal, // CENTRAL
  ReloadOnViewChange, // UTIL
  PeerCount,
  ReactPreflight,
  RoutePreflight,
  ReactHook
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (!window.ur) window.ur = {};
window.ur.SESSION = SESSION;
window.ur.LINK = ULINK;
window.ur.WriteDB = WriteDB;
window.ur.tnc = (msg, data) => {
  NetCall(msg, data).then(rdata => {
    console.log(`netcall '${msg}' returned`, rdata);
  });
  return `testing netcall '${msg}'`;
};
window.ur.serverinfo = () => {
  window.ur.tnc('NET:SRV_SERVICE_LIST');
};
window.ur.clientinfo = () => {
  console.log(window.URSESSION);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default UR;
