/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A Selection Manager for ADM DATA
  This allows us to access settings from outside of ADM DATA,
  optionally making it a global self-managing class instance.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import DEFAULTS from './defaults';
import UR from '../../system/ursys';
import SESSION from '../../system/common-session';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// SETTINGS //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ADMSettings {
  constructor() {
    this.clear();
  }
  // utility
  clear() {
    this.sTeacherId = ''; // an id
    this.sStudentId = ''; // a login token (string)
    this.sModelId = ''; // an id
    this.sPMCDataId = ''; // an id
    //
    this.sClassroomId = ''; // set from login token
    this.sStudentGroupId = ''; // set from login token
  }
  // getters
  get selectedTeacherId() {
    if (DBG) console.log('get teacherId', this.sTeacherId, typeof this.sTeacherId);
    return this.sTeacherId;
  }
  get selectedClassroomId() {
    if (DBG) console.log('get classroomId', this.sClassroomId, typeof this.sClassroomId);
    return this.sClassroomId;
  }
  get selectedStudentId() {
    if (DBG) console.error('get sStudentId', this.sStudentId, typeof this.sStudentId);
    return this.sStudentId;
  }
  get selectedModelId() {
    if (DBG) console.log('sModelId', this.sModelId, typeof this.sModelId);
    return this.sModelId;
  }
  get selectedPMCDataId() {
    if (DBG) console.log('sPMCDataId', this.sPMCDataId, typeof this.sPMCDataId);
    return this.sPMCDataId;
  }
  get selectedGroupId() {
    if (DBG) console.log('get sStudentGroupId', this.sStudentGroupId, typeof this.sStudentGroupId);
    return this.sStudentGroupId;
  }
  // setters
  set selectedTeacherId(id) {
    // use SESSION.LoggedInProps() to pull specific data
    this.sTeacherId = id;
    // teacherId is set to '' to log out.
  }
  set selectedClassroomId(id) {
    this.sClassroomId = id;
  }
  set selectedStudentId(id) {
    this.sStudentId = id;
    // studentId is set to '' to log out.
    // Only validate and load group if a non empty id is passed.
    if (id !== '') {
      const { isValid, groupId } = SESSION.DecodeToken(id);
      if (!isValid) throw Error(`invalid studentId '${id}'`);
      this.sStudentGroupId = groupId;
    }
  }
  set selectedModelId(id) {
    this.sModelId = id;
  }
  set selectedPMCDataId(id) {
    this.sPMCDataId = id;
  }
} // class

/// CREATE INSTANCE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ASET = new ADMSettings();

/// EXPORT ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ASET;
