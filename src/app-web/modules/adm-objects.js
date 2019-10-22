/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PKG = 'ADMObj'; // prefix for console.log

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @module ADMObj
 * @desc
 * A centralized object factory for classroom administration.
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ADMObj = {}; // module object to export

/**
 *  Returns a new model object
 *  @param {Object} data - Initial data for the model
 *                        `groupId` is required.
 */
ADMObj.Model = data => {
  if (data.groupId === undefined) throw Error('Model requires a groupId!');
  const model = {
    id: data.id || undefined, // id is gnerated by DB
    title: data.title || 'Untitled',
    groupId: data.groupId,
    dateCreated: data.dateCreated || new Date(),
    dateModified: data.dateModified || new Date(),
    pmcDataId: data.pmcDataId || undefined
  };
  return model;
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ADMObj;
