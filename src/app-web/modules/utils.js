import UR from '../../system/ursys';
import SESSION from './adm-data'; // FIXME: This is a circular reference because adm-data also loads UTILS

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const UTILS = {};

/**
 * Researcher Logs
 *
 * This will write events out to the server runtime logs at '../../runtime/logs';
 * 
 * Calls are documented here: https://docs.google.com/spreadsheets/d/1EjsoXLeaWU-lvtd2addln6gftcqQ4vgzt7Cw9ADl7rw/edit#gid=0
 * 
 */
UTILS.RLog = (event, params) => {
  const cleanedParams = params || '';
  const username = SESSION.GetSelectedStudentId(); // FIXME: Pull data from session
  const group = SESSION.GetGroupNameByStudent(username);
  const modelId = SESSION.GetSelectedModelId();
  const modelName = SESSION.GetModelTitle(modelId);
  const items = [username, group, modelId, modelName, cleanedParams];
  UR.NetPublish('SRV_LOG_EVENT', { event, items });
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default UTILS;
