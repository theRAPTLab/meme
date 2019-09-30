/* eslint-disable no-param-reassign */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Session Utilities
  collection of session-related data structures

  For student logins, we just need to encode the groupId, which will give
  us the classroomId. We also need the name, which is not encoded, but
  can be checked against the groups database.

  <NAME>-HASHED_DATA
  where HASHED_DATA encodes groupId, classroomId

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const HashIds = require('hashids').default;
const UUIDv5 = require('uuid/v5');
const PROMPTS = require('../system/util/prompts');

/// DEBUGGING /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = PROMPTS.Pad('SESSUTIL');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// HASH_* are used as parameters for hashids (login tokens)
const HASH_ABET = 'ABCDEFGHIJKLMNPQRSTVWXYZ23456789';
const HASH_MINLEN = 3;
const HASH_SALT = 'MEMESALT/2019';
/// UUID_NAMESPACE was arbitrarily generated with 'npx uuid v4' (access keys)
const UUID_NAMESPACE = '1abc839d-b04f-481e-87fe-5d69bd1907b2';

/// MODULE DECLARATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_current_name = undefined; // global decoded name (only for browsers)
let m_current_idsobj = {}; // global decoded props (only for browsers)

/// SESSION ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let SESSION = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Given a token of form NAME-HASHED_DATA, return an object
    containing as many decoded values as possible. Check isValid for
    complete decode succes. groupId is also set if successful
/*/
SESSION.DecodeToken = token => {
  let tokenBits = token.split('-');
  let studentName, hashedData; // token
  let groupId, classroomId; // decoded data
  let isValid = false;
  if (!token) return { isValid };
  // check for missing dash
  if (token.substr(-1) === '-') return { isValid, token, error: 'missing - in token' };
  // token is of form NAME-HASHEDID
  // (1) check student name
  if (tokenBits[0]) studentName = tokenBits[0].toUpperCase();
  if (studentName.length < 3)
    return { isValid, token, error: 'student name must have 3 or more letters' };

  // (2) check hashed data
  if (tokenBits[1]) hashedData = tokenBits[1].toUpperCase();
  // initialize hashid structure
  let hashids = new HashIds(HASH_SALT + studentName, HASH_MINLEN, HASH_ABET);
  // try to decode the groupId
  const dataIds = hashids.decode(hashedData);
  // invalidate if couldn't decode
  if (dataIds.length === 0) return { isValid, token, error: 'invalid token' };

  // at this point groupId is valid (begins with ID, all numeric)
  // check for valid subgroupId
  [groupId, classroomId] = dataIds;
  isValid = true;
  return { isValid, studentName, token, groupId, classroomId };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return TRUE if the token decodes into an expected range of values
/*/
SESSION.IsValidToken = token => {
  let decoded = SESSION.DecodeToken(token);
  return decoded && Number.isInteger(decoded.groupId) && typeof decoded.studentName === 'string';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns a token string of form NAME-HASHED_DATA
 * @param {String} studentName
 * @param {Object} dataIds
 * @param {Number} dataIds.groupId
 * @param {Number} dataIds.classroomId
 */
SESSION.MakeToken = (studentName, dataIds = {}) => {
  // type checking
  if (typeof studentName !== 'string') throw Error(`classId arg1 '${studentName}' must be string`);
  let err;
  if ((err = f_checkIdValue(dataIds))) {
    console.warn(`Could not make token. ${err}`);
    return undefined;
  }

  // initialize hashid structure
  studentName = studentName.toUpperCase();
  const { groupId, classroomId } = dataIds;
  let hashids = new HashIds(HASH_SALT + studentName, HASH_MINLEN, HASH_ABET);
  let hashedId = hashids.encode(groupId, classroomId);
  return `${studentName}-${hashedId}`;

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// support function
  function f_checkIdValue(idsObj) {
    const ids = Object.keys(idsObj);
    let error = '';
    ids.forEach(key => {
      const val = idsObj[key];
      if (!Number.isInteger(val)) {
        error += `'${key}' is not an integer. `;
        return;
      }
      if (val < 0) {
        error += `'${key}' must be non-negative integer. `;
        return;
      }
      if (val > Number.MAX_SAFE_INTEGER) {
        error += `'${key}' exceeds MAX_SAFE_INTEGER. `;
        return;
      }
    });
    return error;
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Makes a 'access key' that is not very secure, but unique enough to serve
 * as an authentication key based on a login token
 * @param {...*} var_args - string arguments
 */
SESSION.MakeAccessKey = (/* args */) => {
  const name = [...arguments].join(':');
  const key = UUIDv5(name, UUID_NAMESPACE);
  return key;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Set the global GROUPID, which is included in all NetMessage packets that are
 * sent to server. Do not use from server-based code.
 */
SESSION.DecodeAndSet = token => {
  const decoded = SESSION.DecodeToken(token);
  const { isValid, studentName, groupId, classroomId } = decoded;
  if (isValid) {
    m_current_name = studentName;
    m_current_idsobj = {
      groupId,
      classroomId
    };
  }
  return isValid;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Return the global StudentName that was set using DecodeAndSet(). Don't use
 * this from server-based code.
 */
SESSION.StudentName = () => {
  return m_current_name;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Return the global idsObject containing groupId, classroomId that was set
 * using DecodeAndSet(). Don't use this from server-based code.
 */
SESSION.Ids = () => {
  return m_current_idsobj;
};

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = SESSION;
