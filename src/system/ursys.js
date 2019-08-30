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

/// PRIVATE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true; // module-wide debug flag
const PR = 'URSYS';
const ULINK = NewConnection(PR);

/// RUNTIME FLAGS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
/// provide convenience links to the URSYS main ULINK
const { Publish, Subscribe, Unsubscribe } = ULINK;
const { Call, Signal } = ULINK;

const { NetPublish, NetSubscribe } = ULINK;
const { NetCall, NetSignal } = ULINK;

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
  console.log(`${PR}: ReactPreFlight Passed!`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RoutePreflight(routes) {
  const err = EXEC.SetScopeFromRoutes(routes);
  if (err) console.error(err);
  console.log(`${PR}: RoutePreflight Passed!`);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
upcoming changes: introduce CHANNELS formally with reserved name NET
because uppercase names are reserved by the system. user channel names
will be lowercase.
SetState('channel:STATE',value); // defaults to local without channel
SynchState('channel:STATE',func); // defaults to local without channel
NetCall('message') will become Call('NET:MESSAGE');
/*/
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
  NetCall, // ULINK
  NetSignal, // ULINK
  NetMessage, // ULINK
  Define, // CENTRAL
  GetVal, // CENTRAL
  SetVal, // CENTRAL
  ReloadOnViewChange, // UTIL
  PeerCount,
  ReactPreflight,
  RoutePreflight
};
export default UR;
