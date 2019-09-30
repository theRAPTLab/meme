/* eslint-disable no-param-reassign */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

DATABASE SERVER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const Loki = require('lokijs');
const PATH = require('path');
const FS = require('fs-extra');

const DATAMAP = require('./common-datamap');
const LOGGER = require('./server-logger');
const PROMPTS = require('../system/util/prompts');
const UNET = require('./server-network');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const { TERM_DB: CLR, TR, CCRIT } = PROMPTS;
const PR = `${CLR}${PROMPTS.Pad('UR_DB')}${TR}`;
const RUNTIMEPATH = PATH.join(__dirname, '../../runtime');
const DATASETPATH = PATH.join(__dirname, '/datasets/meme');

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let m_options; // saved initialization options
let m_db; // loki database
const { DBKEYS, DBCMDS } = DATAMAP; // key lookup for incoming data packets
let send_queue = []; // queue outgoing data
let recv_queue = []; // queue incoming requests

/// API METHODS ///////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const DB_CONFIG = {
  dataset: 'meme' // eventually this will be provided from somewhere
}; //
const DB = {};

/// INITIALIZE DATABASE ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Initialize database, creating blank DB file if necessary.
 */
DB.InitializeDatabase = (options = {}) => {
  let dataset = DB_CONFIG.dataset || 'test';
  let db_file = m_GetValidDBFilePath(dataset);
  FS.ensureDirSync(PATH.dirname(db_file));
  if (!FS.existsSync(db_file)) {
    console.log(PR, `CREATING NEW DATABASE FILE '${db_file}'`);
  }

  // initialize database with given options
  console.log(PR, `loading database ${db_file}`);
  let ropt = {
    autoload: true,
    autoloadCallback: f_DatabaseInitialize,
    autosave: true,
    autosaveCallback: f_AutosaveStatus,
    autosaveInterval: 3000 // save every four seconds
  };
  m_options = Object.assign(ropt, options);
  m_db = new Loki(db_file, m_options);
  m_options.db_file = db_file; // store for use by DB.WriteJSON

  // register handlers
  UNET.NetSubscribe('NET:SRV_DBGET', DB.PKT_GetDatabase);
  UNET.NetSubscribe('NET:SRV_DBADD', DB.PKT_Add);
  UNET.NetSubscribe('NET:SRV_DBUPDATE', DB.PKT_Update);
  UNET.NetSubscribe('NET:SRV_DBREMOVE', DB.PKT_Remove);
  UNET.NetSubscribe('NET:SRV_DBQUERY', DB.PKT_Query);
  // also we publish 'NET:SYSTEM_DBSYNC' { collection key arrays of change }

  // end of initialization code...following are local functions

  /* Local Utility Functions *************************************************/
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // callback on load
  function f_DatabaseInitialize() {
    // on the first load of (non-existent database), we will have no
    // collections so we can detect the absence of our collections and
    // add (and configure) them now.
    if (options.memehost === 'devserver') {
      const fname = `'datasets/${DB_CONFIG.dataset}'`;
      console.log(PR, `${CCRIT}DEV OVERRIDE${TR}...reloading database from ${fname}`);
    }
    DBKEYS.forEach(name => f_LoadCollection(name));
    console.log(PR, `database ready`);
    console.log(PR, fout_CountCollections());
    m_db.saveDatabase();

    // Call complete callback
    if (typeof m_options.onLoadComplete === 'function') {
      m_options.onLoadComplete();
    }
  } // end f_DatabaseInitialize
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function f_AutosaveStatus() {
    const status = fout_CountCollections();
    console.log(PR, `AUTOSAVING! ${status}`);
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function f_EnsureCollection(col) {
    if (m_db.getCollection(col) === null) {
      m_db.addCollection(col, {
        asyncListeners: false,
        autoupdate: true,
        cloneObjects: true // IMPORTANT
      });
    }
    return m_db.getCollection(col);
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function f_LoadCollection(col) {
    const collection = f_EnsureCollection(col);
    // autoincrement enable
    collection.on('insert', u_CopyLokiId);
    // if not running devserver, don't overwrite database
    if (options.memehost !== 'devserver') {
      console.log(PR, `loaded '${col}' w/ ${collection.count()} elements`);
      return;
    }
    // otherwise...reset the dataset from template .db.js files
    const dpath = `${DATASETPATH}/${col}.db`;
    console.log(PR, `resetting dataset '${col}.db'`);
    collection.clear();
    collection.insert(require(dpath));
    // save collection reference
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function fout_CountCollections() {
    let out = '';
    DBKEYS.forEach(colname => {
      out += count(colname);
    });
    //
    function count(col) {
      return `${col}: ${m_db.getCollection(col).count()} `;
    }
    //
    return out;
  }
}; // Initialize Database

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// returns the contents of a collection as an array of objects
// stored in the collection, suitable for delivering as JSON
function f_GetCollectionData(col) {
  collection = m_db.getCollection(col);
  if (!collection) throw Error(`Collection '${col}' doesn't exist`);
  return collection.chain().data({ removeMeta: true });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Internal Helper:
 * Utility that sends database synch changes to all subscribing clients.
 * It is called whenever a change is written to the database.
 */
function m_DatabaseChangeEvent(dbEvent, data) {
  if (!DBCMDS.includes(dbEvent)) throw Error(`unknown change event '{dbEvent}'`);
  data.cmd = dbEvent;
  // send data changes to all clients
  UNET.NetPublish('NET:SYSTEM_DBSYNC', data);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 * Return the entire admin database structure. Used when initializing client
 * app.
 */
DB.PKT_GetDatabase = pkt => {
  LOGGER.Write(pkt.Info(), `getdatabase`);
  const adm_db = {};

  DBKEYS.forEach(colname => {
    adm_db[`a_${colname}`] = f_GetCollectionData(colname);
  });
  // return object for transaction; URSYS will automatically return
  // to the netdevice that called this
  return adm_db;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 * Add an element or elements to the specificed collection.
 * All properties that match an existing DBKEY are considered inputs.
 * The property values must be objects WITHOUT an id property, or an
 * array of such objects. Returns the input with ids added to each object.
 * If the call fails, the error property will be set as well.
 * @param {NetMessage} pkt - packet with data object as described above
 * @returns {Object} - data to return to caller
 */
DB.PKT_Add = pkt => {
  const session = UNET.PKT_Session(pkt);
  if (session.error) return { error: session.error };
  //
  const data = pkt.Data();
  const results = {};
  const collections = DATAMAP.ExtractCollections(data);
  collections.forEach(entry => {
    let [colName, colObjs] = entry;
    const dbc = m_db.getCollection(colName);
    // INSERT entries
    let inserted = dbc.insert(colObjs);
    if (!Array.isArray(inserted)) inserted = [inserted];
    // RETURN ids
    const insertedIds = inserted.map(item => item.id);
    // grab filtered values
    const updated = dbc
      .chain()
      .find({ id: { $in: insertedIds } })
      .data({ removeMeta: true });
    results[colName] = updated;
    console.log(PR, `ADDED: ${JSON.stringify(updated)}`);
  });
  // send update to network
  m_DatabaseChangeEvent('add', results, pkt);
  // return
  return results;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 * Update a collection.
 * All properties that match an existing DBKEY are considered inputs.
 * The property values must be objects WITH an id property.
 * If the call fails, the error property will be set as well.
 * @param {NetMessage} pkt - packet with data object as described above
 * @returns {Object} - data to return (including error if any)
 */
DB.PKT_Update = pkt => {
  const session = UNET.PKT_Session(pkt);
  if (session.error) return { error: session.error };
  //
  const data = pkt.Data();
  const results = {};
  let error = '';
  const collections = DATAMAP.ExtractCollections(data);
  collections.forEach(entry => {
    let [colName, colObjs] = entry;
    const dbc = m_db.getCollection(colName);
    let updatedIds = [];
    // 1. colObjs is the objects of the collection
    // 2. grab ids from each colObj
    // 3. find each object, then update it
    colObjs.forEach((ditem, index) => {
      const { id } = ditem;
      if (!id) {
        error += `item[${index}] has no id`;
        return { error };
      }
      if (DBG) console.log('looking for id', id);
      dbc
        .chain()
        .find({ id: { $eq: id } })
        .update(item => {
          if (DBG) {
            console.log(PR, `updating ${JSON.stringify(item)}`);
            console.log(PR, `with ${JSON.stringify(ditem)}`);
          }
          Object.assign(item, ditem);
        });
      updatedIds.push(id);
    }); // colObjs
    // return updated objects
    const updated = dbc
      .chain()
      .find({ id: { $in: updatedIds } })
      .data({ removeMeta: true });
    results[colName] = updated;
    console.log(PR, `UPDATE: ${JSON.stringify(updated)}`);
  }); // collections forEach
  // was there an error?
  if (error) return { error };
  // otherwise send update to network
  m_DatabaseChangeEvent('update', results, pkt);
  // return
  return results;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 * Delete elements from a collection.
 * All properties that match an existing DBKEY are considered inputs.
 * The property values must be an id or array of ids
 * If the call fails, the error property will be set as well.
 * @param {NetMessage} pkt - packet with data object as described above
 * @param {NetMessage} pkt.data - data containing parameters
 * @returns {Object} - data to return (including error if any)
 */
DB.PKT_Remove = pkt => {
  const session = UNET.PKT_Session(pkt);
  if (session.error) return { error: session.error };
  //
  const data = pkt.Data();
  const results = {};
  let error = '';
  const collections = DATAMAP.ExtractCollections(data);
  collections.forEach(entry => {
    let [colName, idsToDelete] = entry;
    const dbc = m_db.getCollection(colName);
    // return deleted objects
    const removed = dbc.chain().find({ id: { $in: idsToDelete } });
    const matching = removed.branch().data({ removeMeta: true });
    results[colName] = matching;
    removed.remove();
    console.log(PR, `REMOVED: ${JSON.stringify(matching)}`);
  }); // collections forEach
  // was there an error?
  if (error) return { error };
  // otherwise send update to network
  m_DatabaseChangeEvent('remove', results, pkt);
  // return
  return results;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 * Query elements.
 * All properties that match an existing DBKEY are considered inputs.
 * The property values must be an LokiJS condition or array of such
 * conditions that are applied successively. The properties are
 * replaced with the found results.
 * If the call fails, the error property will be set as well.
 * @param {NetMessage} pkt - packet with data object as described above
 * @returns {Object} - data to return (including error if any)
 */
DB.PKT_Query = pkt => {
  const session = UNET.PKT_Session(pkt);
  if (session.error) return { error: session.error };
  //
  return { error: 'query is unimplemented' };
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a root word, create a full pathname to .loki file in the runtime path.
 * Makes sure that the passed pathname allows only alphanumeric characters with
 * some special characters
 */
function m_GetValidDBFilePath(dataset) {
  // validate dataset name
  let regex = /^([A-z0-9-_+./])*$/; // Allow _ - + . /, so nested pathways are allowed
  if (!regex.test(dataset)) {
    console.error(PR, `Trying to initialize database with bad dataset name: ${dataset}`);
  }

  return `${RUNTIMEPATH}/${dataset}.loki`;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function u_CopyLokiId(input) {
  if (!Array.isArray(input)) {
    if (input.id && typeof input.id !== 'number')
      console.log(PR, `WARNING: replacing bogus string id '${input.id}' with ${input.$loki}`);
    input.id = input.$loki;
    // console.log(PR, '*** array output.id', input.id);
    return;
  }
  input.forEach(item => {
    if (item.id && typeof item.id !== 'number')
      console.log(PR, `WARNING: replacing bogus string id '${item.id}' with ${item.$loki}`);
    item.id = item.$loki;
    // console.log(PR, '*** non-array output.id', item.id);
  });
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
module.exports = DB;
