/* eslint-disable no-param-reassign */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UR server loader

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = true;

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
/**
 *
 */
URSYS.RegisterHandlers = () => {
  // start logging message
  UNET.Subscribe('NET:SRV_LOG_EVENT', LOGGER.PKT_LogEvent);
  LOGGER.Write(LPR, `registering network services`);

  // basic reflection test
  UNET.Subscribe('NET:SRV_REFLECT', pkt => {
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
  });

  // register remote messages
  UNET.Subscribe('NET:SRV_REG_HANDLERS', pkt => {
    if (DBG) console.log(PR, sprint_message(pkt));
    // now need to store the handlers somehow.
    let data = UNET.RegisterRemoteHandlers(pkt);
    if (DBG)
      console.log(
        PR,
        pkt.SourceAddress(),
        `netreg ${data.registered.length} remote subscribers: ${data.registered.join(', ')}`
      );
    // or return a new data object that will replace pkt.data
    return data;
  });

  // utility function //
  function sprint_message(pkt) {
    return `got '${pkt.Message()}' data=${JSON.stringify(pkt.Data())}`;
  }
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
      out += `MAINAPP - ${SERVER_INFO.main}\n`;
      out += `CLIENTS - ${SERVER_INFO.client}\n`;
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

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = URSYS;
