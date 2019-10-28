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
  if (data.teacherId === undefined) throw Error('Classroom requires a teacherId!');
  return {
    id: data.id,
    teacherId: data.teacherId,
    name: data.name || 'Untitled',
    canViewOthers: data.canViewOthers || false
  };
};

/**
 *  @return {Object} Returns a new group data object
 */
ADMObj.Group = data => {
  if (data.classroomId === undefined) throw Error('Group requires a classroomId!');
  return {
    id: data.id,
    classroomId: data.classroomId,
    name: data.name || 'Untitled',
    students: data.students || []
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
  return { entities: [], comments: [], markedread: [], visuals: [] };
};

/**
 *  @return {Object} Returns a new ratings definition data object
 */
ADMObj.RatingsDefinition = data => {
  if (data.classroomId === undefined) throw Error('RatingsDefinition requires a classroomId!');
  return {
    id: data.id,
    classroomId: data.classroomId,
    definitions: data.definitions || []
  };
};


/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ADMObj;
