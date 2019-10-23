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
 *  @return {Object} Returns a new teacher data object
 */
ADMObj.Teacher = data => {
  return {
    id: data.id,
    name: data.name
  };
};

/**
 *  @return {Object} Returns a new classroom data object
 */
ADMObj.Classroom = data => {
  if (data.teacherId === undefined) throw Error('Classroom requires a teacherID!');
  return {
    id: data.id,
    teacherId: data.teacherId,
    name: data.name
  };
};

/**
 *  @param {Object} data - Initial data for the model
 *                        `groupId` is required.
 *  @return {Object} Returns a new model object
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

/**
 *  Returns a new pmcData data object (used in models)
 */
ADMObj.ModelPMCData = () => {
  return { entities: [], commentThreads: [], visuals: [] };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ADMObj;
