/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A class for managing hash-mapped data and detecting differences
  in a dataset. Keys must be unique.

  (1) manages differences - an array of just keys of your object is
      passed in, and DataMap returns what's the same or different.
  (2) stores related data by key into a Map()

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// list of collection names stored in database
const DBKEYS = [
  `teachers`,
  `classrooms`,
  `groups`,
  `models`,
  `criteria`,
  `sentenceStarters`,
  `ratingsDefinitions`,
  `classroomResources`,
  `resources`
];

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * An object containing the differences detected between an array NOW vs
 * an array the LAST TIME
 * @typedef {Object} ArrayChangeObject
 * @property {Array} added -
 * @property {Array} removed -
 * @property {Array} updated -
 */
/// CLASS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class DataMap {
  constructor() {
    this.ids = []; // array of string ids
    this.idsUpdated = [];
    this.idsAdded = [];
    this.idsRemoved = [];
    this.map = new Map();
    this.selection = new Set();
  }

  /**
   * Given an array of elements, return the differences since the last
   * call. Useful for managing data protocols that send the entire list
   * of entities in an array.
   * @param {Array<string>} arr - array of elements. The elements should be usable
   * as keys in a Map.
   * @returns {ArrayChangeObject} - { added, updated, removed }
   */
  GetChanges(arr) {
    const added = [];
    const updated = [];
    const removed = [];

    // find what matches and what is new
    arr.forEach(id => {
      if (this.map.has(id)) updated.push();
      else added.push(id);
    });
    this.map.forEach((val, id) => {
      if (!updated.includes(id)) removed.push(id);
    });
    // save results
    this.idsAdded = added;
    this.idsRemoved = removed;
    this.idsUpdated = updated;
    // return results
    return { added, removed, updated };
  }

  /**
   * @param {*} id - array value to compare
   * @returns {boolean} - true if id exists in the map
   */
  Has(id) {
    return this.map.has(id);
  }

  /**
   * Retrieve
   * @param {string} id - key
   * @returns {string} - the object associated with the key
   */
  Get(id) {
    return this.map.get(id);
  }

  /**
   * @param {string} id - key
   * @param {string} element - element
   */
  Set(id, element) {
    this.map.set(id, element);
  }
}

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DataMap.DBKEYS = DBKEYS;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * validate that keyName is a valid DBKEY
 * @param
 */
DataMap.ValidateKey = keyName => DBKEYS.includes(keyName);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** used to parse a data object (such as returned from pkt.Data() for collections
 * to modify or update.
 * @param {Object} data - object with properties matching DBKEY contain array of values
 * @returns {Array} - an array of [collection,items] for each matching DBKEY
 */
DataMap.ExtractCollections = data => {
  let collections = [];
  // always push an array
  DBKEYS.forEach(key => {
    const values = data[key];
    if (!values) return;
    if (Array.isArray(values)) collections.push([key, values]);
    else collections.push([key, [values]]);
  });
  // returned undefined if no collections
  return collections;
};

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = DataMap;
