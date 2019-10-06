import UR from '../../system/ursys';
import ADATA from './data';
import ASET from './adm-settings';

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
  const username = ADATA.GetSelectedStudentId().toUpperCase();
  const groupId = ASET.selectedGroupId;
  const group = ADATA.GetGroupNameByStudent(username);
  const modelId = ASET.selectedModelId;
  const model = ADATA.GetModelById(modelId);
  const modelName = ADATA.GetModelTitle(modelId);
  const items = [username, group, groupId, modelName, modelId, cleanedParams];
  UR.NetPublish('NET:SRV_LOG_EVENT', { event, items });
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default UTILS;
