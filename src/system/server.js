/* eslint-disable no-param-reassign */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UR server loader

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ip = require('ip');
const UNET = require('./server-network');
const UDB = require('./server-database');
const LOGGER = require('./server-logger');
const EXPRESS = require('./server-express');

/// CONSTANTS /////////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS = require('./util/prompts');
//
const { TERM_URSYS: CS, CCRIT: CC, CR } = PROMPTS;
const LPR = 'URSYS';
const PR = `${CS}${PROMPTS.Pad(LPR)}${CR}`;
const SERVER_INFO = {
  main: `http://localhost:3000`,
  client: `http://${ip.address()}:3000`
};

/// MODULE VARS ///////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// API CREATE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let URSYS = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Main Entry Point
 */
URSYS.Initialize = (options = {}) => {
  LOGGER.Write(LPR, `initializing network}`);
  if (options.memehost) console.log(PR, `MEMEHOST:${options.memehost}`);
  console.log(PR, `${CS}STARTING UR SOCKET SERVER${CR}`);
  URSYS.RegisterHandlers();
  UDB.InitializeDatabase(options);
  return UNET.InitializeNetwork(options);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Server message handlers. All messages with the prefix 'NET:SRV_' are always
 * handled by the server.
 */
URSYS.RegisterHandlers = () => {
  LOGGER.Write(LPR, `registering network services`);

  // start logging message
  UNET.NetSubscribe('NET:SRV_LOG_EVENT', LOGGER.PKT_LogEvent);

  // register remote messages
  UNET.NetSubscribe('NET:SRV_REG_HANDLERS', UNET.PKT_RegisterRemoteHandlers);

  // register sessions
  UNET.NetSubscribe('NET:SRV_SESSION_LOGIN', UNET.PKT_SessionLogin);
  UNET.NetSubscribe('NET:SRV_SESSION_LOGOUT', UNET.PKT_SessionLogout);
  UNET.NetSubscribe('NET:SRV_SESSION', UNET.PKT_Session);

  // server utilities
  UNET.NetSubscribe('NET:SRV_REFLECT', URSYS.PKT_Reflect);
  UNET.NetSubscribe('NET:SRV_SERVICE_LIST', URSYS.PKT_Services);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
URSYS.StartWebServer = callback => {
  LOGGER.Write(LPR, `starting web server`);
  // returns an optional promise hook
  console.log(PR, `${CS}STARTING UR WEB SERVER${CR}`);
  (async () => {
    try {
      await EXPRESS.Start();
      let out = `\n---\n`;
      out += `${CS}SYSTEM INITIALIZATION COMPLETE${CR}\n`;
      out += `GO TO ONE OF THESE URLS in CHROME WEB BROWSER\n`;
      out += `ADMIN    - ${SERVER_INFO.main}/#/admin\n`;
      out += `STUDENTS - ${SERVER_INFO.client}\n`;
      out += `---\n`;
      if (typeof callback === 'function') callback(out);
      console.log(out);
    } catch (err) {
      console.log(PR, `${CC}${err}${CR}`);
      console.log(PR, `... exiting with errors\n`);
      process.exit(0);
    }
  })();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 */
URSYS.StartNetwork = () => {
  LOGGER.Write(LPR, `starting network`);
  UNET.StartNetwork();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
URSYS.PKT_Reflect = pkt => {
  // get reference to modify
  const data = pkt.Data();
  const props = Object.keys(data);
  data.serverSays = 'REFLECTING';
  data.serverFound = `Found ${props.length} props in pkt.Data()`;
  data.serverError = '';
  if (props.length < 1) data.serverFound += `. Try adding data to see it come back!`;
  if (data.stack === undefined) {
    data.serverError += `Please define 'stack' array prop`;
  }
  if (data.stack) {
    if (!Array.isArray(data.stack))
      data.serverError += `The 'stack' prop should be an array, not a ${typeof data.stack}`;
    else pkt.Data().stack.push('SERVER WAS HERE ^_^');
  }
  if (DBG) console.log(PR, sprint_message(pkt));
  // return the original packet
  return pkt;

  // utility function //
  function sprint_message(pkt) {
    return `got '${pkt.Message()}' data=${JSON.stringify(pkt.Data())}`;
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
URSYS.PKT_Services = pkt => {
  const server = UNET.ServiceList();
  const clients = UNET.ClientList();
  return { server, clients };
};

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = URSYS;
