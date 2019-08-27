/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WebSocketServer and Network Management for URSYS

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const WSS = require('ws').Server;
const NetMessage = require('./common-netmessage');
/** @typedef {Object} NetMessage */
const LOGGER = require('./server-logger');
const PROMPTS = require('./util/prompts');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

const { TERM_NET: CLR, TR } = PROMPTS;
const PR = `${CLR}${PROMPTS.Pad('UR_NET')}${TR}`;

const ERR_SS_EXISTS = 'socket server already created';
const DBG_SOCK_BADCLOSE = 'closing socket is not in mu_sockets';
const ERR_INVALID_DEST = "couldn't find socket with provided address";
const ERR_UNKNOWN_PKT = 'unrecognized netmessage packet type';

/// CONSTANTS /////////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DEFAULT_NET_PORT = 2929;
const SERVER_UADDR = NetMessage.DefaultServerUADDR(); // is 'SVR_01'

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// sockets
let mu_wss; // websocket server
let mu_options; // websocket options
let mu_sockets = new Map(); // sockets mapped by socket id
let mu_sid_counter = 0; // for generating  unique socket ids
// storage
let m_server_handlers = new Map(); // message map storing sets of functions
let m_remote_handlers = new Map(); // message map storing other handlers
let m_socket_msgs_list = new Map(); // message map by uaddr
// module object
let UNET = {};

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** InitializeNetwork() sets the default values for the network, which comprises
 * of the websocket server port, the URSYS address (uaddr) of the server. It
 * also makes sure that the websocket server hasn't already been initialized.
 * Also initializes the NetMessage class via its static setup method
 * GlobalSetup(), passing the server UADDR to it. Saves the configuration object
 * in mu_options.
 *
 * Followup this call with StartNetwork().
 *
 * @param {Object} [options] - configuration settings
 * @param {number} [options.port] - default to DEFAULT_NET_PORT 2929
 * @param {string} [options.uaddr] - default to DefaultServerUADDR() 'SVR_01'
 * @returns {Object} complete configuration object
 */
UNET.InitializeNetwork = options => {
  options = options || {};
  options.port = options.port || DEFAULT_NET_PORT;
  options.uaddr = options.uaddr || SERVER_UADDR;
  if (mu_wss !== undefined) throw Error(ERR_SS_EXISTS);
  NetMessage.GlobalSetup({ uaddr: options.uaddr });
  mu_options = options;
  return mu_options;
}; // end InitializeNetwork()

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** StartNetwork() initializes the web socket server using the options set by
 * InitializeNetwork(), and directs connections to utility function
 * m_NewSocketConnected()
 */
UNET.StartNetwork = () => {
  // create listener.
  if (DBG) console.log(PR, `initializing web socket server on port ${mu_options.port}`);
  mu_wss = new WSS(mu_options);
  mu_wss.on('listening', () => {
    if (DBG) console.log(PR, `socket server listening on port ${mu_options.port}`);
    mu_wss.on('connection', socket => {
      if (DBG) console.log(PR, 'socket connected');
      // house keeping
      m_SocketAdd(socket); // assign UADDR to socket
      m_SocketClientAck(socket); // tell client HELLO with new UADDR
      // subscribe socket to handlers
      socket.on('message', json => m_SocketOnMessage(socket, json));
      socket.on('close', () => m_SocketDelete(socket));
    }); // end on 'connection'
  });
}; // end StartNetwork()

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetPublish() is used to register SERVER-side message handlers that are
 * reachable from remote clients. Server-side handlers use their own map.
 * @param {string} mesgName message to register a handler for
 * @param {function} handlerFunc function receiving 'data' object
 */
UNET.NetPublish = (mesgName, handlerFunc) => {
  if (typeof handlerFunc !== 'function') {
    throw Error('arg2 must be a function');
  }
  let handlers = m_server_handlers.get(mesgName);
  if (!handlers) {
    handlers = new Set();
    m_server_handlers.set(mesgName, handlers);
  }
  handlers.add(handlerFunc);
}; // end NetPublish()

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetUnpublish() revokes a handler function from a registered message.
 * The handler function object must be the same one used to register it.
 * @param {string} mesgName message to unregister a handler for
 * @param {function} handlerFunc function originally registered
 */
UNET.NetUnpublish = (mesgName, handlerFunc) => {
  if (mesgName === undefined) {
    m_server_handlers.clear();
  } else if (handlerFunc === undefined) {
    m_server_handlers.delete(mesgName);
  } else {
    const handlers = m_server_handlers.get(mesgName);
    if (handlers) {
      handlers.delete(handlerFunc);
    }
  }
  return this;
}; // end NetUnpublish()

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetCall() is the server-side method for invoking a remote message. It
 * executes asynchronously but uses async/await so it can be used in a
 * synchronous style to retrieve values.
 * @param {string} mesgName message to unregister a handler for
 * @param {function} handlerFunc function originally registered
 * @return {Array<Object>} array of returned data items
 */
UNET.NetCall = async (mesgName, data) => {
  let pkt = new NetMessage(mesgName, data);
  let promises = m_PromiseRemoteHandlers(pkt);
  if (DBG) console.log(PR, `${pkt.Info()} NETCALL ${pkt.Message()} to ${promises.length} remotes`);
  /// MAGICAL ASYNC/AWAIT BLOCK ///////
  const results = await Promise.all(promises);
  /// END MAGICAL ASYNC/AWAIT BLOCK ///
  // const result = Object.assign({}, ...resArray);
  return results; // array of data objects
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetSend() is the server-side method for sending a remote message. It fires
 * the messages but doesn't do anything with the returned promises. Use for
 * notifying remote message handlers.
 * @param {string} mesgName message to unregister a handler for
 * @param {function} handlerFunc function originally registered
 */
UNET.NetSend = (mesgName, data) => {
  let pkt = new NetMessage(mesgName, data);
  let promises = m_PromiseRemoteHandlers(pkt);
  // we don't care about waiting for the promise to complete
  if (DBG) console.log(PR, `${pkt.Info()} NETSEND ${pkt.Message()} to ${promises.length} remotes`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetSignal() is an alias for NetSend(), kept for conceptual symmetry to the
 * client-side URSYS interface. It is not needed because the server never
 * mirrors NetSend to itself for signaling purposes.
 * @param {string} mesgName message to unregister a handler for
 * @param {function} handlerFunc function originally registered
 */
UNET.NetSignal = (mesgName, data) => {
  console.warn(PR, 'NOTE: Use NetSend(), not NetSignal() since the server doesnt care.');
  UNET.NetSend(mesgName, data);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** RegisterRemoteHandlers() is a special initialize method that handles URSYS REGISTRATION PACKETS
 * from connecting clients. It is the first packet sent on successful socket connection.
 * @param {NetMessage} pkt - NetMessage packet instance
 * @return {Object} object with registered property containing array of message
 */
UNET.RegisterRemoteHandlers = pkt => {
  if (pkt.Message() !== 'SRV_REG_HANDLERS') throw Error('not a registration packet');
  let uaddr = pkt.SourceAddress();
  let { messages = [] } = pkt.Data();
  let regd = [];
  // save message list, for later when having to delete
  m_socket_msgs_list.set(uaddr, messages);
  // add uaddr for each message in the list
  // m_remote_handlers[mesg] contains a Set
  messages.forEach(msg => {
    let entry = m_remote_handlers.get(msg);
    if (!entry) {
      entry = new Set();
      m_remote_handlers.set(msg, entry);
    }
    if (DBG) console.log(PR, `${uaddr} registered handler '${msg}'`);
    entry.add(uaddr);
    regd.push(msg);
  });
  return { registered: regd };
};

/// END OF UNET PUBLIC API ////////////////////////////////////////////////////

/// MODULE HELPER FUNCTIONS ///////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** m_SocketAdd() assigns a unique URSYS address (UADDR) to new sockets,
 * storing it as the UADDR property of the socket and adding to mu_sockets
 * map. The connection is logged to the logfile.
 * @param {Object} socket connecting socket
 */
function m_SocketAdd(socket) {
  // save socket by socket_id
  let sid = m_GetNewUADDR();
  // store additional props in socket
  socket.UADDR = sid;
  // save socket
  mu_sockets.set(sid, socket);
  if (DBG) console.log(PR, `socket ADD ${socket.UADDR} to network`);
  LOGGER.Write(socket.UADDR, 'joined network');
  if (DBG) console_ListSockets(`add ${sid}`);
} // end m_SocketAdd()

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** m_GetNewUADDR() is a utility to generate a new UADDR id for connecting
 * clients
 * @param {string} [prefix] - default to UADDR
 */
function m_GetNewUADDR(prefix = 'UADDR') {
  ++mu_sid_counter;
  let cstr = mu_sid_counter.toString(10).padStart(2, '0');
  return `${prefix}_${cstr}`;
}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** m_SocketClientAck() returns a JSON packet to the just-connected client
 * with its assigned URSYS address (UADDR) and the server's UADDR.
 * @param {Object} socket connecting socket
 */
function m_SocketClientAck(socket) {
  let data = {
    HELLO: `Welcome to URSYS, ${socket.UADDR}`,
    UADDR: socket.UADDR,
    SERVER_UADDR
  };
  socket.send(JSON.stringify(data));
} // end m_SocketClientAck()

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** m_SocketOnMessage() is the main entry point for handling 'message' events
 * from a client socket. It converts the incoming JSON to a NetMessage packet
 * and passes processing further on depending on the type.
 * @param {Object} socket messaging socket
 * @param {string} json text-encoded NetMessage
 */
function m_SocketOnMessage(socket, json) {
  let pkt = new NetMessage(json);
  // figure out what to do
  switch (pkt.Type()) {
    case 'msig':
    case 'msend':
    case 'mcall':
      m_HandleMessage(socket, pkt);
      break;
    case 'state':
      m_HandleState(socket, pkt);
      break;
    default:
      throw new Error(`${PR} unknown packet type '${pkt.Type()}'`);
  } // end switch
} // end m_SocketOnMessage()

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** m_SocketDelete() is a utility to handle disconnected sockets. It does
 * the internal housekeeping and logging, and removes any registered messages
 * that the socket may have had.
 */
function m_SocketDelete(socket) {
  let uaddr = socket.UADDR;
  if (!mu_sockets.has(uaddr)) throw Error(DBG_SOCK_BADCLOSE);
  if (DBG) console.log(PR, `socket DEL ${uaddr} from network`);
  LOGGER.Write(socket.UADDR, 'left network');
  mu_sockets.delete(uaddr);
  // delete socket reference from previously registered handlers
  let rmesgs = m_socket_msgs_list.get(uaddr);
  if (Array.isArray(rmesgs)) {
    rmesgs.forEach(msg => {
      let handlers = m_remote_handlers.get(msg);
      if (DBG) console.log(PR, `${uaddr} removed handler '${msg}'`);
      if (handlers) handlers.delete(uaddr);
    });
  }
  if (DBG) console_ListSockets(`del ${socket.UADDR}`);
} // end m_SoecketDelete()

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** m_HandleMessage() performs the actual work of dispatching messages on behalf
 * of a client to other remote clients, gathers up all the data, and returns
 * it.
 * @param {Object} socket messaging socket
 * @param {NetMessage} pkt - NetMessage packet instance
 */
async function m_HandleMessage(socket, pkt) {
  // is this a returning packet that was forwarded?
  if (pkt.IsResponse()) {
    // console.log(PR,`-- ${pkt.Message()} completing transaction ${pkt.seqlog.join(':')}`);
    pkt.CompleteTransaction();
    return;
  }
  // console.log(PR,`packet source incoming ${pkt.SourceAddress()}-${pkt.Message()}`);
  // (1) first check if this is a server handler
  let promises = m_PromiseServerHandlers(pkt);

  // (2) if it wasn't, then see if we have remote handlers defined
  if (promises.length === 0) promises = m_PromiseRemoteHandlers(pkt);

  // (3) FAIL if no promises were returned, because there were no eligible
  // UADDR targets, possibly because the sources are not allowed to call itself
  // except in the case of the SIGNAL type
  if (promises.length === 0) {
    const out = `${pkt.SourceAddress()} cannot resolve call '${pkt.Message()}'`;
    console.log(PR, out);
    // return transaction to resolve callee
    pkt.SetData({
      URserver: `info: ${out}`,
      error: 'message not found'
    });
    if (pkt.IsType('mcall')) pkt.ReturnTransaction(socket);
    return;
  }

  // output the condition BEFORE async block runs
  const DBG_NOSRV = !pkt.Message().startsWith('SRV_');
  if (DBG) console_PktDirection(pkt, 'call', promises);
  if (DBG && DBG_NOSRV) console_PktTransaction(pkt, 'queuing', promises);

  /* MAGICAL ASYNC/AWAIT BLOCK *****************************/
  let pktArray = await Promise.all(promises);
  /* END MAGICAL ASYNC/AWAIT BLOCK *************************/

  // output the condition AFTER async block ran
  if (DBG && DBG_NOSRV) console_PktTransaction(pkt, 'resolved');
  if (DBG) console_PktDirection(pkt, 'rtrn', promises);

  // (4) only the packet type for call needs to collect the return data
  if (!pkt.IsType('mcall')) return;

  // (5A) If got this far, this is a call! collect all output into a new data object
  let data = pktArray.reduce((d, p) => {
    let pdata = p instanceof NetMessage ? p.Data() : p;
    let retval = Object.assign(d, pdata);
    // if (DBG_NOSRV) console.log(PR,`'${pkt.Message()}' reduce`,JSON.stringify(retval));
    return retval;
  }, {});

  // (5B) return the packet with aggregate data
  pkt.SetData(data);
  // if (DBG_NOSRV) console.log(PR,`'${pkt.Message()}' returning transaction data ${JSON.stringify(data)}`);
  pkt.ReturnTransaction(socket);
} // end m_HandleMessage()

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** m_HandleState() is a stub for network-synched state messages, which
 * are not yet implemented in URSYS
 * @param {Object} socket messaging socket
 * @param {NetMessage} pkt a NetMessage object received from socket
 */
function m_HandleState(socket, pkt) {}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** m_PromiseServerHandlers() returns an array of Promises that call the
 * functions associated with a server-based message handler. Handler functions
 * must return a data object. Unlike the remote version of this function, this
 * executes synchronously because there is no network communication required.
 * @param {NetMessage} pkt a NetMessage object to use as message key
 * @returns {Array<Promise>} promises objects to use with await
 */
function m_PromiseServerHandlers(pkt) {
  let mesgName = pkt.Message();
  const handlers = m_server_handlers.get(mesgName);
  /// create promises for all registered handlers
  let promises = [];
  if (handlers)
    for (let handlerFunc of handlers) {
      // handlerFunc signature: (data,dataReturn) => {}
      let p = f_promise_server_resolver(pkt, handlerFunc);
      promises.push(p);
    }
  /// return all queued promises
  return promises;

  /// inline utility function /////////////////////////////////////////////
  function f_promise_server_resolver(srcPkt, handlerFunc) {
    return new Promise((resolve, reject) => {
      let retval = handlerFunc(srcPkt);
      if (retval === undefined)
        throw Error(`'${mesgName}' message handler MUST return object or error string`);
      if (typeof retval !== 'object') reject(retval);
      else resolve(retval);
    });
  }
} // end m_PromiseServerHandlers()

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** m_PromiseRemoteHandlers() forwards a copy of the original NetMessage packet
 * to all the remote handlers via NetMessage.PromiseTransaction(), returning
 * an array of promises that resolve when NetMessage.CompleteTransaction()
 * is invoked on the returned data. Use await Promise.all(promises) to wait.
 * @param {NetMessage} pkt a NetMessage object to use as message key
 * @returns {Array<Promise>} promises objects to use with Promise.all()
 */
function m_PromiseRemoteHandlers(pkt) {
  // debugging values
  let s_uaddr = pkt.SourceAddress();
  // logic values
  let promises = [];
  let mesgName = pkt.Message();
  let type = pkt.Type();

  // generate the list of promises
  // the hard work is done in f_promise_remote_resolver()
  let handlers = m_remote_handlers.get(mesgName);

  // no handlers, return no promises
  if (!handlers) return promises;

  // if there are handlers to handle, create a NetMessage
  // clone of this packet and forward it and save the promise
  handlers.forEach(d_uaddr => {
    switch (type) {
      case 'msig': // signals go to all implementors
        promises.push(f_promise_remote_resolver(pkt, d_uaddr));
        break;
      case 'msend': // send does not mirror
      case 'mcall': // call does not mirror
        if (s_uaddr !== d_uaddr) {
          const transactionPromise = f_promise_remote_resolver(pkt, d_uaddr);
          promises.push(transactionPromise);
        } else {
          // console.log(PR,`${type} '${pkt.Message()}' -NO ECHO- ${d_uaddr}`);
        }
        break;
      default:
        throw Error(`${ERR_UNKNOWN_PKT} ${type}`);
    } // switch
  }); // forEach
  // return all promises made by NetMessage.PromiseTransaction()
  return promises;

  /// inline utility function /////////////////////////////////////////////
  function f_promise_remote_resolver(srcPkt, d_uaddr) {
    // get the address of the destination implementor of MESSAGE
    let d_sock = mu_sockets.get(d_uaddr);
    if (d_sock === undefined) throw Error(`${ERR_INVALID_DEST} ${d_uaddr}`);

    // create a clone packet to forward to a remote
    // this clone will be returned to the remote sender
    let newpkt = new NetMessage(srcPkt); // clone packet data to new packet
    newpkt.MakeNewID(); // make new packet unique
    newpkt.CopySourceAddress(srcPkt); // clone original source address

    // console.log(PR,`++ '${pkt.Message()}' FWD from ${pkt.SourceAddress()} to ${d_uaddr}`);
    // console.log(
    //   'make_resolver_func:',
    //   `PKT: ${srcPkt.Type()} '${srcPkt.Message()}' from ${srcPkt.Info()} to d_uaddr:${d_uaddr} dispatch to d_sock.UADDR:${
    //     d_sock.UADDR
    //   }`
    // );

    // FORWARD THE NEW PACKET TO DESTINATION SOCKET
    // PromiseTransaction() stores a hash key that is used to resume the
    // transaction on return to server by checking NetMessage.IsTransaction(),
    // and NetMessage.ReturnTransaction().
    return newpkt.PromiseTransaction(d_sock);
  }
}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// used by m_SocketAdd(), m_SocketDelete()
function console_ListSockets(change) {
  console.log(PR, `socketlist changed: '${change}'`);
  // let's use iterators! for..of
  let values = mu_sockets.values();
  let count = 1;
  for (let socket of values) {
    console.log(PR, `${count} - ${socket.UADDR}`);
  }
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// used by m_HandleMessage()
function console_PktDirection(pkt, direction, promises) {
  console.log(PR, `${pkt.Info()} ${direction} '${pkt.Message()}' (${promises.length} remotes)`);
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// used by m_HandleMessage()
function console_PktTransaction(pkt, status, promises) {
  const src = pkt.SourceAddress();
  if (promises && promises.length) {
    console.log(PR, `${src} >> '${pkt.Message()}' ${status} ${promises.length} Promises`);
  } else {
    console.log(PR, `${src} << '${pkt.Message()}' ${status}`);
  }
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNET;
