import DEFAULTS from './defaults';
import UR from '../../system/ursys';
import SESSION from '../../system/common-session';
import UTILS from './utils';
import DATAMAP from '../../system/common-datamap';
import PMCData from './data'; // this is a bit problematicn (circular ref)
import ADMObj from './adm-objects';
import ASET from './adm-settings';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'ADMDATA'; // prefix for console.log

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @module ADMData
 * @desc
 * A centralized data manager for classroom administration.
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ADMData = {}; // module object to export

/// MODULE-WIDE DATA //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let adm_db; // set in InitializeData

/// URSYS HOOKS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.Hook(__dirname, 'LOAD_ASSETS', () => {
  // return promise to enable asynchronous loading. This ensures
  // that LOAD_ASSETS phase completes before allowing subsequent
  // phases to run
  return new Promise((resolve, reject) => {
    console.log(PKG, 'LOAD_ASSETS');
    UR.NetCall('NET:SRV_DBGET', {}).then(data => {
      if (data.error) {
        reject(`server says '${data.error}'`);
        return;
      }
      ADMData.InitializeData(data);
      resolve();
    });
  });
});

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

ADMData.InitializeData = data => {
  /*/
  All ids are now integers.
  We used to have to scrub them manually, but we were able
  to monkey-patch @dagre/graphlib (which is really old) to
  not convert numeric keys to string keys
  See PMCData.InitializeModel() to see how it's added to the
  m_graph instance.
  /*/
  adm_db = data;
  // clear settings
  ASET.clear();
  // dbg info
  if (DBG) console.log('DBG:INITIALIZE: adm_db', adm_db);
};

/// PRIVATE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// FIXME: This really oought to check to makes ure the id is unique
const GenerateUID = (prefix = '', suffix = '') => {
  return prefix + Math.trunc(Math.random() * 10000000000).toString() + suffix;
};

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** URSYS: DATABASE SYNC
 * Receive a list of ONLY changed objects to the specified collections so
 * adm_db can be updated in a single place. Afterwards, fire any necessary
 * UPDATE or BUILD or SELECT.
 * See common-datamap.js for the collection keys itemized in DBKEYS. Called from
 * data.js.
 * @param {Object} data - a collection object
 */
ADMData.SyncAddedData = data => {
  // the syncitems iterating way
  const syncitems = DATAMAP.ExtractSyncData(data);
  syncitems.forEach(item => {
    const { colkey, subkey, value } = item;
    if (DBG) console.log('SyncAddedData: added', colkey, subkey || '', value);

    switch (colkey) {
      case 'teachers':
        const teacher = ADMObj.Teacher(value);
        adm_db.teachers.push(teacher);
        UR.Publish('ADM_DATA_UPDATED', data);
        break;
      case 'classrooms':
        const classroom = ADMObj.Classroom(value);
        adm_db.classrooms.push(classroom);
        UR.Publish('ADM_DATA_UPDATED', data);
        break;
      case 'groups':
        const group = ADMObj.Group(value);
        adm_db.groups.push(group);
        UR.Publish('ADM_DATA_UPDATED', data);
        break;
      case 'models':
        // Only add it if it doesn't already exist
        // This is necessary because a local call to
        // DB_NewModel will also update adm_db.models.
        if (!ADMData.GetModelById(value.id)) {
          const model = ADMObj.Model(value);
          adm_db.models.push(model);
          UR.Publish('ADM_DATA_UPDATED', data);
        } else {
          // Usually tjos fires before DB_NewModel's then() so the model is already added
          if (DBG) console.error(`SyncAddedData: Model ${value.id} already added, skipping`);
        }
        break;
      case 'ratingsDefinitions':
        const ratingsDefinition = ADMObj.RatingsDefinition(value);
        adm_db.ratingsDefinitions.push(ratingsDefinition);
        UR.Publish('ADM_DATA_UPDATED', data);
        break;
      case 'pmcData':
      // ignore pmcData updates
      // console.log('SyncAddedData got pmcData', value);
      default:
      // ignore any other updates
      // throw Error('unexpected colkey', colkey);
    }
  });
  /** Old code
  // the manual inspection way (more HACKY)
  if (data.teachers) {
    const teacherId = data.teachers[0];
    adm_db.teachers.push(teacherId);
    ASET.selectedTeacherId = teacherId;
    UR.Publish('ADM_DATA_UPDATED', data);
  }
  // can add better logic to avoid updating too much
   */
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.SyncUpdatedData = data => {
  const syncitems = DATAMAP.ExtractSyncData(data);
  syncitems.forEach(item => {
    const { colkey, subkey, value } = item;
    if (DBG) console.log('updated', colkey, subkey || '', value);
    switch (colkey) {
      case 'teachers':
        throw Error('This should not ever get called');
        break;
      case 'classrooms':
        const classroom = ADMData.GetClassroom(value.id);
        classroom.canViewOthers = value.canViewOthers;
        UR.Publish('ADM_DATA_UPDATED', data);
        break;
      case 'groups':
        const group = ADMData.GetGroup(value.id);
        group.students = value.students;
        UR.Publish('ADM_DATA_UPDATED', data);
        break;
      case 'models':
        const model = ADMData.GetModelById(value.id);
        model.dateModified = value.dateModified;
        if (model.title !== value.title) {
          model.title = value.title;
          UR.Publish('MODEL_TITLE:UPDATED', { title: value.title });
        }
        break;
      case 'ratingsDefinitions':
        const index = adm_db.ratingsDefinitions.findIndex(r => r.classroomId === value.id);
        const ratingsDefinition = ADMObj.RatingsDefinition(value);
        adm_db.ratingsDefinitions.splice(index, 1, ratingsDefinition);
        UR.Publish('ADM_DATA_UPDATED', data);
        break;
      case 'pmcData':
      // ignore pmcData updates
      // console.log('SyncUpdatedData got pmcData', value);
      default:
      // ignore any other updates
      // throw Error('unexpected colkey', colkey);
    }
  });
  // can add better logic to avoid updating too much
  // UR.Publish('ADM_DATA_UPDATED', data);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.SyncRemovedData = data => {
  const syncitems = DATAMAP.ExtractSyncData(data);
  syncitems.forEach(item => {
    const { colkey, subkey, value } = item;
    if (DBG) console.log('removed', colkey, subkey || '', value);
  });
  // can add better logic to avoid updating too much
  // UR.Publish('ADM_DATA_UPDATED', data);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// TEACHERS //////////////////////////////////////////////////////////////////
///
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Creates a new teacher and then selects the teacher
 *  @param {String} name - New teacher name
 */
ADMData.DB_AddTeacher = name => {
  return UR.DBQuery('add', {
    teachers: { name }
  }).then(rdata => {
    if (rdata.error) throw Error(rdata.error);
    ADMData.SelectTeacher(rdata.teachers[0].id);
  });
  // let round-trip handle update logic
  // e.g.  ASET.selectedTeacherId = teacherId; UR.Publish('TEACHER_SELECT', { teacherId: teacherId });

  /* OLD STUFF TO DELETE
  const teacher = {};
  teacher.id = GenerateUID('tc');
  teacher.name = name;
  adm_db.teachers.push(teacher);
  // Select the new teacher
  ASET.selectedTeacherId = teacher.id;
  UR.Publish('TEACHER_SELECT', { teacherId: teacher.id });
  */
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetAllTeachers = () => {
  return adm_db.teachers;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @return {object} Teacher Object, undefined if not found
 */
ADMData.GetTeacher = (teacherId = ASET.selectedTeacherId) => {
  return adm_db.teachers.find(tch => tch.id === teacherId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} [classroomId = current selected classroomId]
 * @return {object} Teacher Object, undefined if not found
 */
ADMData.GetTeacherByClassroomId = (classroomId = ASET.selectedClassroomId) => {
  const classroom = ADMData.GetClassroom(classroomId);
  if (classroom === undefined || classroom.teacherId === undefined) return undefined;
  return ADMData.GetTeacher(classroom.teacherId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} [teacherId = current selected teacherId]
 * @return {string} Teacher name, '' if not found
 */
ADMData.GetTeacherName = (teacherId = ASET.selectedTeacherId) => {
  let teacher = ADMData.GetTeacher(teacherId);
  return teacher ? teacher.name : '';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} [studentId = current selected studentId]
 * @return {string} Teacher name, '' if not found
 */
ADMData.GetTeacherNameByStudent = (studentId = ASET.selectedStudentId) => {
  if (studentId === undefined || studentId === '') return;
  const classroomId = ADMData.GetClassroomIdByStudent(studentId);
  const teacher = ADMData.GetTeacherByClassroomId(classroomId);
  return teacher ? teacher.name : '';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.SelectTeacher = teacherId => {
  ASET.selectedTeacherId = teacherId;
  UR.Publish('TEACHER_SELECT', { teacherId });
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// CLASSROOMS ////////////////////////////////////////////////////////////////
///
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Creates a new classroom and then selects the classroom
 *  @param {String} name - New classroom name
 */
ADMData.DB_AddClassroom = name => {
  const classroom = ADMObj.Classroom({
    teacherId: ASET.selectedTeacherId,
    name
  });
  return UR.DBQuery('add', { classrooms: classroom }).then(rdata => {
    if (rdata.error) throw Error(rdata.error);
    ADMData.SelectClassroom(rdata.classrooms[0].id);
  });

  /** old/
  const classroom = {};
  classroom.id = GenerateUID('tc');
  classroom.name = name;
  classroom.teacherId = ASET.selectedTeacherId;
  adm_db.classrooms.push(classroom);
  // Select the new classroom
  ASET.selectedClassroomId = classroom.id;
  // Special case of CLASSROOM_SELECT: We need to update the list of classrooms
  // when a new classroom is added, so we pass the flag and let the component
  // do the updating.
  UR.Publish('CLASSROOM_SELECT', {
    classroomId: classroom.id,
    classroomListNeedsUpdating: true
  });
  */
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Updates existing classroom
 *  Primarily used to set the CanViewOthersModels property
 *  @param {String} data - New teacher name
 */
ADMData.DB_UpdateClassroom = (id, data) => {
  const classroom = Object.assign(ADMData.GetClassroom(id), data, { id }); // make sure id doens't get clobbered
  return UR.DBQuery('update', { classrooms: classroom });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Retrieves the classroom by classoomId or the currently selected classroom
 * @param {string} [classroomId = current selected classroomId]
 * @return {object} Clasroom Objectm, undefined if not found
 */
ADMData.GetClassroom = (classroomId = ASET.selectedClassroomId) => {
  return adm_db.classrooms.find(cls => cls.id === classroomId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Retrieve currently selected teacher's classrooms by default if no teacherId is defined
 * @param {string} [teacherId = current selected teacherId]
 * @return {Array} Array of Classroom objects, [] if not found
 */
ADMData.GetClassroomsByTeacher = (teacherId = ASET.selectedTeacherId) => {
  return adm_db.classrooms.filter(cls => cls.teacherId === teacherId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} groupId
 * @return {string} classroomId, undefined if not found
 */
ADMData.GetClassroomIdByGroup = groupId => {
  let group = ADMData.GetGroup(groupId);
  return group ? group.classroomId : undefined;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} [studentId = current selected studentId]
 * @return {string} classroomId, undefined if not found
 */
ADMData.GetClassroomIdByStudent = (studentId = ASET.selectedStudentId) => {
  const groupId = ADMData.GetGroupIdByStudent(studentId);
  return ADMData.GetClassroomIdByGroup(groupId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} [studentId = current selected studentId]
 * @return {string} classroomId, undefined if not found
 */
ADMData.GetClassroomNameByStudent = (studentId = ASET.selectedStudentId) => {
  const classroomId = ADMData.GetClassroomIdByStudent(studentId);
  const classroom = ADMData.GetClassroom(classroomId);
  return classroom ? classroom.name : '';
};
/* replaced by DB_Classroomupdate
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param isVisible - bool
 * /
ADMData.SetClassesModelVisibility = isVisible => {
  const classroom = ADMData.GetClassroom();
  classroom.canViewOthers = isVisible;
  console.log('setting visibility to ', isVisible);
  return isVisible;
};
*/
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Students in this classroom are a allowed to view the models of their
 *  fellow classmates.  Used for commenting.
 */
ADMData.CanViewOthers = () => {
  const classroom = ADMData.GetClassroom();
  return classroom ? classroom.canViewOthers : false;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.SelectClassroom = (classroomId = ADMData.GetClassroomIdByStudent()) => {
  ASET.selectedClassroomId = classroomId;
  UR.Publish('CLASSROOM_SELECT', { classroomId });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetSelectedClassroomId = () => {
  return ASET.selectedClassroomId;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// GROUPS ////////////////////////////////////////////////////////////////////
///
/**
 *  Creates a new group object and saves it to the db
 */
ADMData.DB_AddGroup = groupName => {
  const group = ADMObj.Group({
    classroomId: ASET.selectedClassroomId,
    name: groupName
  });
  return UR.DBQuery('add', { groups: group });

  /** old code
  let group = {};
  group.id = GenerateUID('gr');
  group.name = groupName;
  group.students = [];
  group.classroomId = ASET.selectedClassroomId;

  adm_db.groups.push(group);

  UR.Publish('ADM_DATA_UPDATED');
  */
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Updates the db with the group info
 *  Allows partial update of group data
 */
ADMData.DB_UpdateGroup = (groupId, group) => {
  const groupData = Object.assign(ADMData.GetGroup(groupId), group, { id: groupId });
  return UR.DBQuery('update', { groups: groupData });

  /* old code
  let i = adm_db.groups.findIndex(grp => grp.id === groupId);
  if (i < 0) {
    console.error(PKG, 'UpdateGroup could not find group with id', groupId);
    return;
  }
  adm_db.groups.splice(i, 1, group);
  */
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Returns a group object
 */
ADMData.GetGroup = groupId => {
  return adm_db.groups.find(group => {
    return group.id === groupId;
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Returns array of group objects associated the classroom e.g.
 *    [
 *       { id: 'gr01', name: 'Blue', students: 'Bob, Bessie, Bill', classroomId: 'cl01' },
 *       { id: 'gr02', name: 'Green', students: 'Ginger, Gail, Greg', classroomId: 'cl01' },
 *       { id: 'gr03', name: 'Red', students: 'Rob, Reese, Randy', classroomId: 'cl01' },
 *    ]
 */
ADMData.GetGroupsByClassroom = classroomId => {
  return adm_db.groups.filter(grp => grp.classroomId === classroomId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Returns array of group ids associated with the classroom, e.g.
 *    [ 'gr01', 'gr02', 'gr03' ]
 *  This is primarily used by ADMData.GetModelsByClassroom to check if
 *  a model is from a particular classsroom.
 */
ADMData.GetGroupIdsByClassroom = classroomId => {
  const groups = ADMData.GetGroupsByClassroom(classroomId);
  return groups.map(grp => grp.id);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Finds the first group with for provided student id
 *  Used to look up models associated with student.
 */
ADMData.GetGroupByStudent = (studentId = ASET.selectedStudentId) => {
  if (studentId === '' || adm_db.groups === undefined) return undefined;
  const { groupId } = SESSION.DecodeToken(studentId);
  if (groupId) return adm_db.groups.find(grp => grp.id === groupId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetGroupIdByStudent = studentId => {
  let group = ADMData.GetGroupByStudent(studentId);
  return group ? group.id : undefined;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} groupId
 * @return {string} Group Name, '' if not found
 */
ADMData.GetGroupName = groupId => {
  let group = ADMData.GetGroup(groupId);
  return group ? group.name : '';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetGroupNameByStudent = studentId => {
  let group = ADMData.GetGroupByStudent(studentId);
  return group ? group.name : '';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetSelectedGroupId = () => {
  const studentId = ADMData.GetAuthorId();
  return ADMData.GetGroupIdByStudent(studentId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetSelectedGroupName = () => {
  const group = ADMData.GetSelectedGroupId();
  return group ? group.name : '';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Adds new students to the existing array of students
 */
ADMData.AddStudents = (groupId, students) => {
  // convert to array if necessary
  const studentsArr = typeof students === 'string' ? [students] : students;

  // remove empty students
  const cleanedArr = studentsArr.filter(s => s !== '');

  const group = ADMData.GetGroup(groupId);
  if (group === undefined) throw Error(`${PKG}.AddStudent could not find group ${groupId}`);
  const oldStudents = group.students;

  const newStudents = oldStudents.concat(cleanedArr);

  ADMData.DB_UpdateGroup(groupId, { students: newStudents });

  /* old code
    // Update the group
  // const group = { students: [] };
  // let group = ADMData.GetGroup(groupId);
  // if (group === undefined) {
  //   console.error(PKG, 'AddStudent could not find group', groupId);
  //   return;
  // }
  // studentsArr.forEach(student => {
  //   if (student === undefined || student === '') {
  //     console.error(PKG, 'AddStudent adding blank student', groupId);
  //   }
  //   group.students.push(student);
  // });
  */
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.DeleteStudent = (groupId, student) => {
  const group = ADMData.GetGroup(groupId);
  if (group === undefined) throw Error(`${PKG}.AddStudent could not find group ${groupId}`);
  const updatedStudents = group.students.filter(stu => student !== stu);
  ADMData.DB_UpdateGroup(groupId, { students: updatedStudents });

  /** old code
  // Get the group
  const group = ADMData.GetGroup(groupId);
  if (group === undefined) {
    console.error(PKG, 'AddStudent could not find group', groupId);
    return;
  }
  const students = group.students;
  if (students === undefined) {
    console.error(PKG, 'AddStudent could not find any students in group', groupId);
    return;
  }
  // Remove the student
  const filteredStudents = students.filter(stu => student !== stu);
  group.students = filteredStudents;
  // Now update a_groups
  ADMData.DB_UpdateGroup(groupId, group);
  /*/

  /*/
  // Tell components to update
  UR.Publish('ADM_DATA_UPDATED');
  */
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// STUDENTS //////////////////////////////////////////////////////////////////
///
/**
 *  Call with no 'studentName' to get the group token
 */
ADMData.GetToken = (groupId, studentName) => {
  const classroomId = ADMData.GetClassroomIdByGroup(groupId);
  const token = SESSION.MakeToken(studentName, { groupId, classroomId });
  return `${token}\n`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.Login = hashedToken => {
  const urs = window.URSESSION;
  if (!urs) throw Error('unexpected missing URSESSION global');
  return UR.NetCall('NET:SRV_SESSION_LOGIN', { token: hashedToken }).then(rdata => {
    if (DBG) console.log('login', rdata);
    if (rdata.error) throw Error(rdata.error);
    if (DBG) console.log('updating URSESSION with session data');
    urs.SESSION_Token = rdata.token;
    urs.SESSION_Key = rdata.key;
    // also save globally
    SESSION.DecodeAndSet(rdata.token);
    SESSION.SetAccessKey(rdata.key);

    // This assumes we already did validation
    const lprops = SESSION.LoggedInProps();
    if (lprops.studentName) ASET.selectedStudentId = rdata.token;
    if (lprops.teacherName) ASET.selectedTeacherId = rdata.token;
    // After logging in, we need to tell ADM what the default classroom is
    ADMData.SelectClassroom();
    UR.Publish('ADM_DATA_UPDATED');
    UR.Publish('MODEL_SELECT_OPEN');
    return rdata;
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.Logout = () => {
  const urs = window.URSESSION;
  if (!urs) throw Error('unexpected missing URSESSION global');
  if (!urs.SESSION_Key) throw Error('missing URSESSION session key');
  return UR.NetCall('NET:SRV_SESSION_LOGOUT', { key: urs.SESSION_Key }).then(rdata => {
    console.log('logout', rdata);
    if (rdata.error) throw Error(rdata.error);
    console.log('removing session data from URSESSION');
    if (urs.SESSION_Token && urs.SESSION_Key) {
      urs.SESSION_Token = '';
      urs.SESSION_Key = '';
      SESSION.Clear();
      ASET.selectedStudentId = '';
      ADMData.SelectClassroom('');
      UR.Publish('ADM_DATA_UPDATED');
      return rdata;
    } else throw Error('URSESSION key or token was not set');
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.IsLoggedOut = () => {
  return (!SESSION.IsStudent() && !SESSION.IsTeacher());
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.IsValidLogin = hashedToken => {
  return SESSION.IsValidToken(hashedToken);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Returns true of user has write priviledges as the author of the model
 *  The user's group grants the priviledges
 */
ADMData.IsViewOnly = () => {
  const author = ADMData.GetAuthorId();
  const groupAuthorId = ADMData.GetGroup()
  const model = ADMData.GetModelById(); // Current model
  const modelGroupAuthorId = model ? model.groupId : '';  
  return groupAuthorId !== modelGroupAuthorId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Returns studentId or teacheId depending on who's logged in.
 */
ADMData.GetAuthorId = () => {
  if (SESSION.IsStudent()) return ASET.selectedStudentId;
  if (SESSION.IsTeacher()) return ASET.selectedTeacherId;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Returns logged in user name, normalizing the case to initial caps.
 *  @return {string} Name of student, or '' if not found
 */
ADMData.GetLggedInUserName = () => {
  // return just the first part of the studentid without the hash
  // note SESSION.LoggedInName() is also an option
  let authorId = ADMData.GetAuthorId();
  let name = authorId.split('-')[0];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Returns logged in user's group
 *  @return {string} Name of group, or '' if not found
 */
ADMData.GetLoggedInGroupName = () => {
  if (SESSION.IsTeacher()) return 'Teacher';
  const grp = ADMData.GetGroupByStudent(ASET.selectedStudentId);
  return grp ? grp.name : '';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetSelectedStudentId = () => {
  return ASET.selectedStudentId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Returns student name, normalizing the case to initial caps.
 *  @param {string} [studentId = currently selected studentId]
 *  @return {string} Name of student, or '' if not found
 */
ADMData.GetStudentName = (studentId = ASET.selectedStudentId) => {
  // return just the first part of the studentid without the hash
  // note SESSION.LoggedInName() is also an option
  let name = studentId.split('-')[0];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetStudentGroupName = (studentId = ASET.selectedStudentId) => {
  const grp = ADMData.GetGroupByStudent(studentId);
  return grp ? grp.name : '';
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// MODELS ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Creates a new db model
 *  @param {Object} data - ADMObj.Model object.  groupID MUST be defined
 *  @param {Function} cb - A callback function
 */
ADMData.DB_NewModel = (data, cb) => {
  return UR.DBQuery('add', {
    pmcData: ADMObj.ModelPMCData()
  }).then(rdata => {
    if (rdata.error) throw Error(rdata.error);
    const mdata = {};
    mdata.groupId = data.groupId;
    mdata.pmcDataId = rdata.pmcData[0].id;
    mdata.title = data.title;
    const model = ADMObj.Model(mdata); // set creation date
    UR.DBQuery('add', {
      models: model // db will set id
    }).then(rdata2 => {
      if (rdata2.error) throw Error(rdata2.error);
      const model = rdata2.models[0];
      if (!ADMData.GetModelById(model.id)) {
        adm_db.models.push(model);
      } else {
        // Usually SyncAddedData fires before this so the model is already added
        if (DBG) console.error(`DB_NewModel model id ${model.id} already exits. Skipping add.`);
      }
      UTILS.RLog('ModelCreate');
      cb(rdata2);
    });
  });

  /* old
  return UR.DBQuery('add', {
    'models': {
      ...data
    }
  }).then(rdata => {
    UTILS.RLog('ModelCreate');
    cb(rdata);
  });
  */
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Handles text input updates for the model title
 * @param {string} title
 */
ADMData.DB_ModelTitleUpdate = (modelId, title) => {
  return UR.DBQuery('update', {
    models: {
      id: modelId,
      title: title,
      dateModified: new Date()
    }
  }).then(() => {
    UTILS.RLog('ModelRename', `id "${modelId}" to "${title}"`);
  });

  /** Old CODE
  const model = ADMData.GetModelById(modelId);
  UTILS.RLog('ModelRename', `from "${model.title}" to "${title}"`);
  model.title = title;
  UR.Publish('MODEL_TITLE:UPDATED', { title });
   */
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Called by ModelSelect when user requests a new model
 *  This will add a new model to the db and then open the new model
 *  It uses the currently selected GroupID.
 *  @param {Function} cb - Callback function
 */
ADMData.NewModel = cb => {
  const data = {
    groupId: ADMData.GetSelectedGroupId()
  };
  ADMData.DB_NewModel(data, rdata => {
    if (rdata && rdata.models && rdata.models.length > 0) {
      // grab the first model returned
      const model = rdata.models[0];
      ADMData.LoadModel(model.id);
    }
    cb();
  });

  //** OLD CODE */
  // adm_db.models.push(model);
  // UR.Publish('ADM_DATA_UPDATED');
  // ADMData.LoadModel(model.id, groupId);
  // UTILS.RLog('ModelCreate');
};
/**
 * return the model meta data
 *  @param {Integer} modelId
 */
ADMData.GetModelById = (modelId = ASET.selectedModelId) => {
  return adm_db.models.find(model => model.id === modelId);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetModelsByClassroom = classroomId => {
  const groupIdsInClassroom = ADMData.GetGroupIdsByClassroom(classroomId);
  return adm_db.models.filter(mdl => groupIdsInClassroom.includes(mdl.groupId));
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} [studentId = current selected studentId]
 * @return {Array} Array of models, [] if not found
 */
ADMData.GetModelsByStudent = (studentId = ASET.selectedStudentId) => {
  const group = ADMData.GetGroupByStudent(studentId);
  if (group === undefined) return [];
  return adm_db.models.filter(mdl => mdl.groupId === group.id);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Gets the models for a teacher
ADMData.GetModelsByTeacher = (token = ASET.selectedTeacherId) => {
  // handle special
  const { groupId, classroomId } = SESSION.DecodeToken(token);
  if (groupId !== 0) {
    console.error(`${token} is not a teacher token`);
    return [];
  }
  // the teacherId is a repurposed classroomId field
  const teacherId = classroomId;
  return adm_db.models.filter(mdl => {
    const cid = ADMData.GetClassroomIdByGroup(mdl.groupId);
    if (!cid) {
      console.log('classroom error', cid, 'from', mdl);
      return false;
    }
    const teacher = ADMData.GetTeacherByClassroomId(cid);
    if (!teacher) {
      console.log('teacher error', teacher);
      return false;
    }
    return teacherId === teacher.id;
  });
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Gets the gropuId of the currently selected Student ID
ADMData.GetModelsByGroup = (group = ADMData.GetGroupByStudent()) => {
  return adm_db.models.filter(mdl => mdl.groupId === group.id);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns models from the class EXCLUDING those from the group.
 * This is used by ModelSelect.jsx to allow students to select models from
 * their classmates to view.
 * @param {string} classroomId
 * @param {string} studentId
 * @return {Array} Array of model objects, [] if not found
 */
ADMData.GetMyClassmatesModels = (classroomId, studentId) => {
  const classroomModels = ADMData.GetModelsByClassroom(classroomId);
  const groupId = ADMData.GetGroupIdByStudent(studentId);
  return classroomModels.filter(mdl => {
    return mdl.groupId !== groupId;
  });
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} [modelId = current selected modelId]
 * @return {string} Model name, or '' if not found
 */
ADMData.GetModelTitle = (modelId = ASET.selectedModelId) => {
  const model = ADMData.GetModelById(modelId);
  return model ? model.title : '';
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Retrieves the latest pmcData object from the database.
 *  This is necessary because adm_db's pmcData array is not
 *  updated with SyncAdd and SyncUpdate.
 *  @param {Function} cb - A callback function
 */
ADMData.DB_RefreshPMCData = cb => {
  UR.NetCall('NET:SRV_DBGET', {}).then(data => {
    if (data.error) {
      reject(`server says '${data.error}'`);
      return;
    }
    adm_db.pmcData = data.pmcData;
    cb();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.LoadModel = modelId => {
  let model = ADMData.GetModelById(modelId);
  if (model === undefined)
    throw Error(`${PKG}.LoadModel could not find a valid modelId ${modelId}`);
  PMCData.ClearModel();
  UR.Publish('SVG_PANZOOM_RESET');
  ADMData.SetSelectedModelId(modelId, model.pmcDataId); // Remember the selected modelId locally
  ADMData.DB_RefreshPMCData(() => PMCData.InitializeModel(model, adm_db));
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// This does not load the model, it just sets the currently selected model id
ADMData.SetSelectedModelId = (modelId, pmcDataId) => {
  // verify it's valid
  if (adm_db.models.find(mdl => mdl.id === modelId) === undefined) {
    console.error(PKG, 'SetSelectedModelId could not find valid modelId', modelId);
  }
  ASET.selectedModelId = modelId;
  ASET.selectedPMCDataId = pmcDataId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetSelectedModelId = () => {
  return ASET.selectedModelId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.CloseModel = () => {
  ASET.selectedModelId = '';
  UR.Publish('ADM_DATA_UPDATED');
  UR.Publish('MODEL_SELECT_OPEN');
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// CRITERIA //////////////////////////////////////////////////////////////////
///
/**
 *  NewCriteria
 *  1. Creates a new empty criteria object with a unqiue ID.
 *  2. Returns the criteria object.
 *
 *  Calling `NewCriteria()` will automatically use the currently
 *  selectedClassssroomId as the classroomId.
 *
 *  Call `NewCriteria('xxId')` to set the classroomId manually.
 */
ADMData.NewCriteria = (classroomId = ASET.selectedClassroomId) => {
  const id = GenerateUID('cr');
  if (classroomId === undefined) {
    console.error(PKG, 'NewCriteria called with bad classroomId:', classroomId);
    return undefined;
  }
  const crit = {
    id,
    label: '',
    description: '',
    classroomId
  };
  // Don't add it to a_criteria -- user might cancel the edit
  // a_criteria.push(crit);
  return crit;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetCriteriaByClassroom = (classroomId = ASET.selectedClassroomId) => {
  return adm_db.criteria.filter(crit => crit.classroomId === classroomId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetCriteriaLabel = (criteriaId, classroomId = ADMData.GetSelectedClassroomId()) => {
  let criteriaArr = ADMData.GetCriteriaByClassroom(classroomId);
  let criteria = criteriaArr.find(crit => crit.id === criteriaId);
  return criteria ? criteria.label : '';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.UpdateCriteria = criteria => {
  const i = adm_db.criteria.findIndex(cr => cr.id === criteria.id);
  if (i < 0) {
    // Criteria not found, so it must be a new criteria.  Add it.
    adm_db.criteria.push(criteria);
    return;
  }
  adm_db.criteria.splice(i, 1, criteria);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.UpdateCriteriaList = criteriaList => {
  // Remove any deleted criteria
  const updatedCriteriaIds = criteriaList.map(criteria => criteria.id);
  adm_db.criteria = adm_db.criteria.filter(
    crit => crit.classroomId !== ASET.selectedClassroomId || updatedCriteriaIds.includes(crit.id)
  );
  // Update existing criteria
  criteriaList.forEach(criteria => ADMData.UpdateCriteria(criteria));
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// SENTENCE STARTERS
///
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Returns a single sentenceStarter object, if not found, undefined
ADMData.GetSentenceStartersByClassroom = (classroomId = ADMData.GetSelectedClassroomId()) => {
  const sentenceStarter = adm_db.sentenceStarters.filter(ss => ss.classroomId === classroomId);
  let result;
  if (Array.isArray(sentenceStarter)) {
    result = sentenceStarter[0];
  } else {
    console.error(
      PKG,
      'GetSentenceSTarterByClassroom: Sentence starter for classroomId',
      classroomId,
      'not found!'
    );
  }
  return result;
};
// Returns a single sentenceStarter object for the current classroom, if not found ''
ADMData.GetSentenceStarter = () => {
  const sentenceStarter = ADMData.GetSentenceStartersByClassroom();
  if (sentenceStarter === undefined || sentenceStarter.sentences === undefined) {
    return '';
  } else {
    return sentenceStarter.sentences;
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

ADMData.UpdateSentenceStarter = sentenceStarter => {
  const i = adm_db.sentenceStarters.findIndex(ss => ss.id === sentenceStarter.id);
  if (i < 0) {
    // Sentence starter not found, so it must be new.  Add it.
    adm_db.sentenceStarters.push(sentenceStarter);
    return;
  }
  adm_db.sentenceStarters.splice(i, 1, sentenceStarter);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// RATINGS DEFINITIONS
///
/// For now Ratings Definitions are shared across all classrooms.
/// We may need to allow teachers to customize this in th e future.

/**
 * @return {Array} [ratingsDefition] -- Array of ratings defintion objects,
 * e.g.{ label: 'Really disagrees!', rating: -3 },
 * Returns [] if not found
 */
ADMData.GetRatingsDefinition = classroomId => {
  let ratings = adm_db.ratingsDefinitions.find(ratings => ratings.classroomId === classroomId);
  if (ratings === undefined) {
    // create new ratings
    ratings = {};
    ratings.classroomId = classroomId;
    ratings.definitions = [];
    adm_db.ratingsDefinitions.push(ratings);
  }
  return ratings.definitions;
};

ADMData.DB_RatingsUpdate = (classroomId, ratingsDef) => {
  const ratingsDefinition = Object.assign(
    adm_db.ratingsDefinitions.find(r => r.classroomId === classroomId),
    { definitions: ratingsDef }
  );
  // replace existing ratings
  return UR.DBQuery('update', { ratingsDefinitions: ratingsDefinition });

  /** old code
  const ratings = adm_db.ratingsDefinitions.find(ratings => ratings.classroomId === classroomId);
  if (ratings) {
    ratings.definitions = ratingsDef;
  } else {
    console.error(
      PKG,
      '.DB_RatingsUpdate could not find ratings definition for classroomId',
      classroomId
    );
  } */
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// RESOURCES
///

// Returns all of the resource objects.
ADMData.AllResources = () => {
  return adm_db.resources;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Returns the resource object matching the rsrccId.
ADMData.Resource = rsrcId => {
  return adm_db.resources.find(item => {
    return item.id === rsrcId;
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// returns `resources` not `classroomResources`
/**
 * Returns an array of the subset of all resources that have been made available to the classroom
 * @param {string} classroomId
 * @return {Array} Array of classroom resource ids, e.g. `['rs1', 'rs2']`, [] if not found
 */
ADMData.GetResourcesForClassroom = classroomId => {
  const classroomResource = adm_db.classroomResources.find(
    rsrc => rsrc.classroomId === classroomId
  );
  const classroomResourceIds = classroomResource ? classroomResource.resources : [];
  const classroomResources = classroomResourceIds.map(rsrcId => {
    return ADMData.Resource(rsrcId);
  });
  return classroomResources ? classroomResources : [];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.SetClassroomResource = (rsrcId, checked, classroomId) => {
  let classroomResources = adm_db.classroomResources.find(rsrc => rsrc.classroomId === classroomId);

  if (checked) {
    // Add resource
    classroomResources.resources.push(rsrcId);
  } else {
    // Remove resource
    classroomResources.resources = classroomResources.resources.filter(rsrc => rsrc.id !== rsrcId);
  }
  UR.Publish('ADM_DATA_UPDATED');
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (!window.ur) window.ur = {};
window.ur.getadmdb = () => adm_db;
window.ur.getpmcdata = () => adm_db.pmcData;
window.ur.getmodel = id => {
  if (typeof id === 'number') return adm_db.pmcData.find(el => el.id === id);
  return adm_db.pmcData(ASET.selectedModelId);
};
window.ur.ADM = ADMData;
export default ADMData;
