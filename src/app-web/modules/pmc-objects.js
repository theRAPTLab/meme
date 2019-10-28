/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PKG = 'PMCObj'; // prefix for console.log

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @module PMCObj
 * @desc
 * A centralized object factory for model objects.
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PMCObj = {}; // module object to export

/**
 *  @return {Object} Returns a new classroom data object
 */
PMCObj.Comment = data => {
console.log('PMCObj.Comment data',data)
  if (data.refId === undefined) throw Error('Comment requires a refId!');
  if (data.author === undefined) throw Error('Comment requires an author!');
  return {
    id: data.id,
    refId: data.refId,
    author: data.author,
    date: data.date || new Date(),
    text: data.text || '',
    criteriaId: data.criteriaId || undefined,
    placeholder: data.placeholder
  };
};

/**
 *  @return {Object} Returns a new comment MarkedRead object
 */
PMCObj.MarkedRead = data => {
  if (data.commentId === undefined) throw Error('MarkedRead requires a commentId!');
  if (data.author === undefined) throw Error('MarkedRead requires an author!');
  return {
    id: data.id,
    commentId: data.commentId,
    author: data.author
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default PMCObj;
