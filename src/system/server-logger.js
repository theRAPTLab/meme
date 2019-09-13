/* eslint-disable no-param-reassign */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  LOGGER - WIP
  porting PLAE logger for now to get it minimally working

  SUPER UGLY PORT WILL CLEAN UP LATER AVERT YOUR EYES OMG

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const PATH = require('path');
const FSE = require('fs-extra');
const Tracer = require('tracer');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const PROMPTS = require('./util/prompts');

const PR = PROMPTS.Pad('LOGGER');

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

const LOG_DIR = '../../runtime/logs';

const LOG_DELIMITER = '\t';
const LOG_CONFIG = {
  format: '{{line}}  {{message}}',
  dateformat: 'HH:MM:ss.L',
  preprocess(data) {
    data.line = `C ${Number(data.line).zeroPad(4)}`;
  }
};
const LOGGER = Tracer.colorConsole(LOG_CONFIG);
let fs_log = null;
// enums for outputing dates
const e_weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function StartLogging() {
  // initialize event logger
  let dir = PATH.resolve(PATH.join(__dirname, LOG_DIR));
  try {
    console.log(PR, `logging to ${dir}`);
    FSE.ensureDirSync(dir);
    let logname = `${str_TimeDatedFilename('log')}.txt`;
    let pathname = `${dir}/${logname}`;
    fs_log = FSE.createWriteStream(pathname);
    LogLine(`MEME APPSERVER SESSION LOG for ${str_DateStamp()} ${str_TimeStamp()}`);
    LogLine('---');
  } catch (err) {
    if (err) throw new Error(`could not make ${dir} directory`);
  }
}

/**	LOGGING FUNCTIONS ******************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Log a standard system log message
/*/
function LogLine(...args) {
  if (!fs_log) StartLogging();

  let out = `${str_TimeStamp()} `;
  let c = args.length;
  // arguments are delimited
  if (c) {
    for (let i = 0; i < c; i++) {
      if (i > 0) out += LOG_DELIMITER;
      out += args[i];
    }
  }
  out += '\n';
  fs_log.write(out);
}

/////////////////////////////////////////////////////////////////////////////
/**	UTILITY FUNCTIONS ******************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function str_TimeStamp() {
  let date = new Date();
  let hh = `0${date.getHours()}`.slice(-2);
  let mm = `0${date.getMinutes()}`.slice(-2);
  let ss = `0${date.getSeconds()}`.slice(-2);
  return `${hh}:${mm}:${ss}`;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function str_DateStamp() {
  let date = new Date();
  let mm = `0${date.getMonth() + 1}`.slice(-2);
  let dd = `0${date.getDate()}`.slice(-2);
  let day = e_weekday[date.getDay()];
  let yyyy = date.getFullYear();
  return `${yyyy}/${mm}/${dd} ${day}`;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function str_TimeDatedFilename(...args) {
  // construct filename
  let date = new Date();
  let dd = `0${date.getDate()}`.slice(-2);
  let mm = `0${date.getMonth() + 1}`.slice(-2);
  let hms = `0${date.getHours()}`.slice(-2);
  hms += `0${date.getMinutes()}`.slice(-2);
  hms += `0${date.getSeconds()}`.slice(-2);
  let filename;
  filename = date.getFullYear().toString();
  filename += `-${mm}${dd}`;
  let c = arguments.length;
  if (c) filename += filename.concat('-', ...args);
  filename += `-${hms}`;
  return filename;
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let LOG = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Handle incoming log events
/*/
LOG.PKT_LogEvent = pkt => {
  let { event, items } = pkt.Data();
  if (DBG) console.log(PR, pkt.Info(), event, ...items);
  LogLine(pkt.Info(), event || '-', ...items);
  return { OK: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Write to log as delimited arguments
/*/
LOG.Write = LogLine;

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
module.exports = LOG;
