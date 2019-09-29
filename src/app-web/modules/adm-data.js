import DEFAULTS from './defaults';
import UR from '../../system/ursys';
import SESSION from '../../system/common-session';
import UTILS from './utils';
import PMCData from './data';

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @module ADMData
 * @desc
 * A centralized data manager for classroom administration.
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ADMData = {};

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'ADMDATA'; // prefix for console.log

/// MODEL /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let adm_db = {
  a_teacher: [],
  a_classrooms: [],
  a_groups: [],
  a_models: [],
  a_criteria: [],
  a_sentenceStarters: [],
  a_ratingsDefinitions: [],
  a_classroomResources: [],
  a_resources: []
}; // server database object by reference
let adm_settings = {}; // local settings, state of the admin view (current displayed class/teacher)

/// UTILITY ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function ConverToStringArray(arr) {
  return arr.map(item => String(item));
}

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

ADMData.InitializeData = ( data ) => {
  // INITIALIZE SETTINGS
  adm_settings = {
    selectedTeacherId: '',
    selectedClassroomId: '',
    selectedStudentId: '',
    selectedModelId: ''
  };
  
  // convert ids
  const a_resources = data.a_resources.map(res => {
    const { id, referenceLabel, label, notes, type, url, links } = res;
    return {
      id: String(id), // Convert resource ids to strings
      referenceLabel,
      label,
      notes,
      type,
      url,
      links
    };
  });
  data.a_resources = a_resources;
  
  const a_classroomResources = data.a_classroomResources.map(rsrcs => {
    const { id, classroomId, resources } = rsrcs;
    return {
      id: id, // String(id),
      classroomId: classroomId, // String(classroomId),
      resources: ConverToStringArray(resources)
    }
  });
  data.a_classroomResources = a_classroomResources;

  adm_db = data;
};

/// PRIVATE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// FIXME: This really oought to check to makes ure the id is unique
const GenerateUID = (prefix = '', suffix = '') => {
  return prefix + Math.trunc(Math.random() * 10000000000).toString() + suffix;
};

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Return array of all the properties of the PMC model. Note that a PMC
 *  component is just a property that isn't a child of any other property.
 *  @returns {array} - array of nodeId strings
 */

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// TEACHERS //////////////////////////////////////////////////////////////////
///
ADMData.GetAllTeachers = () => {
  return adm_db.a_teachers;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @return {object} Teacher Object, undefined if not found
 */
ADMData.GetTeacher = (teacherId = adm_settings.selectedTeacherId) => {
  let teacher = adm_db.a_teachers.find(tch => {
    return tch.id === teacherId;
  });
  return teacher;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} [classroomId = current selected classroomId]
 * @return {object} Teacher Object, undefined if not found
 */
ADMData.GetTeacherByClassroomId = (classroomId = adm_settings.selectedClassroomId) => {
  const classroom = ADMData.GetClassroom(classroomId);
  if (classroom === undefined || classroom.teacherId === undefined) return undefined;
  return ADMData.GetTeacher(classroom.teacherId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} [teacherId = current selected teacherId]
 * @return {string} Teacher name, '' if not found
 */
ADMData.GetTeacherName = (teacherId = adm_settings.selectedTeacherId) => {
  let teacher = ADMData.GetTeacher(teacherId);
  return teacher ? teacher.name : '';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} [studentId = current selected studentId]
 * @return {string} Teacher name, '' if not found
 */
ADMData.GetTeacherNameByStudent = (studentId = adm_settings.selectedStudentId) => {
  if (studentId === undefined || studentId === '') return;
  const classroomId = ADMData.GetClassroomIdByStudent(studentId);
  const teacher = ADMData.GetTeacherByClassroomId(classroomId);
  return teacher ? teacher.name : '';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.SelectTeacher = teacherId => {
  adm_settings.selectedTeacherId = teacherId;
  UR.Publish('TEACHER_SELECT', { teacherId });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.AddTeacher = name => {
  const teacher = {};
  teacher.id = GenerateUID('tc');
  teacher.name = name;
  adm_db.a_teachers.push(teacher);
  // Select the new teacher
  adm_settings.selectedTeacherId = teacher.id;
  UR.Publish('TEACHER_SELECT', { teacherId: teacher.id });
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// CLASSROOMS ////////////////////////////////////////////////////////////////
///
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Retrieves the classroom by classoomId or the currently selected classroom
 * @param {string} [classroomId = current selected classroomId]
 * @return {object} Clasroom Objectm, undefined if not found
 */
ADMData.GetClassroom = (classroomId = adm_settings.selectedClassroomId) => {
  return adm_db.a_classrooms.find(cls => cls.id === classroomId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Retrieve currently selected teacher's classrooms by default if no teacherId is defined
 * @param {string} [teacherId = current selected teacherId]
 * @return {Array} Array of Classroom objects, [] if not found
 */
ADMData.GetClassroomsByTeacher = (teacherId = adm_settings.selectedTeacherId) => {
  return adm_db.a_classrooms.filter(cls => cls.teacherId === teacherId);
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
ADMData.GetClassroomIdByStudent = (studentId = adm_settings.selectedStudentId) => {
  const groupId = ADMData.GetGroupIdByStudent(studentId);
  return ADMData.GetClassroomIdByGroup(groupId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} [studentId = current selected studentId]
 * @return {string} classroomId, undefined if not found
 */
ADMData.GetClassroomNameByStudent = (studentId = adm_settings.selectedStudentId) => {
  const classroomId = ADMData.GetClassroomIdByStudent(studentId);
  const classroom = ADMData.GetClassroom(classroomId);
  return classroom ? classroom.name : '';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param isVisible - bool
 */
ADMData.SetClassesModelVisibility = isVisible => {
  const classroom = ADMData.GetClassroom();
  classroom.showClassesModels = isVisible;
  console.log('setting visibility to ', isVisible);
  return isVisible;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.ClassesModelsAreVisible = () => {
  const classroom = ADMData.GetClassroom();
  return classroom.showClassesModels;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.SelectClassroom = (classroomId = ADMData.GetClassroomIdByStudent()) => {
  adm_settings.selectedClassroomId = classroomId;
  UR.Publish('CLASSROOM_SELECT', { classroomId });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetSelectedClassroomId = () => {
  return adm_settings.selectedClassroomId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.AddClassroom = name => {
  const classroom = {};
  classroom.id = GenerateUID('tc');
  classroom.name = name;
  classroom.teacherId = adm_settings.selectedTeacherId;
  adm_db.a_classrooms.push(classroom);
  // Select the new classroom
  adm_settings.selectedClassroomId = classroom.id;
  // Special case of CLASSROOM_SELECT: We need to update the list of classrooms
  // when a new classroom is added, so we pass the flag and let the component
  // do the updating.
  UR.Publish('CLASSROOM_SELECT', {
    classroomId: classroom.id,
    classroomListNeedsUpdating: true
  });
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// GROUPS ////////////////////////////////////////////////////////////////////
///
/**
 *  Add a new group
 */
ADMData.AddGroup = groupName => {
  let group = {};
  group.id = GenerateUID('gr');
  group.name = groupName;
  group.students = [];
  group.classroomId = adm_settings.selectedClassroomId;

  adm_db.a_groups.push(group);

  UR.Publish('ADM_DATA_UPDATED');
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Returns a group object
 */
ADMData.GetGroup = groupId => {
  return adm_db.a_groups.find(group => {
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
  return adm_db.a_groups.filter(grp => grp.classroomId === classroomId);
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
 *  Finds the first group with a matching student id
 *  Used to validate student login
 *  As well as to look up models associated with student.
 */
ADMData.GetGroupByStudent = (studentId = adm_settings.selectedStudentId) => {
  if (studentId === '' || adm_db.a_groups === undefined) return undefined;
  return adm_db.a_groups.find(grp => {
    return grp.students.includes(studentId);
  });
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
  const studentId = ADMData.GetSelectedStudentId();
  return ADMData.GetGroupIdByStudent(studentId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetSelectedGroupName = () => {
  const group = ADMData.GetSelectedGroupId();
  return group ? group.name : '';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Updates a_groups with latest group info
 */
ADMData.UpdateGroup = (groupId, group) => {
  let i = adm_db.a_groups.findIndex(grp => grp.id === groupId);
  if (i < 0) {
    console.error(PKG, 'UpdateGroup could not find group with id', groupId);
    return;
  }
  adm_db.a_groups.splice(i, 1, group);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.AddStudents = (groupId, students) => {
  let studentsArr;
  if (typeof students === 'string') {
    studentsArr = [students];
  } else {
    studentsArr = students;
  }
  // Update the group
  let group = ADMData.GetGroup(groupId);
  if (group === undefined) {
    console.error(PKG, 'AddStudent could not find group', groupId);
    return;
  }
  studentsArr.forEach(student => {
    if (student === undefined || student === '') {
      console.error(PKG, 'AddStudent adding blank student', groupId);
    }
    group.students.push(student);
  });
  // Now update a_groups
  ADMData.UpdateGroup(groupId, group);
  // Tell components to update
  UR.Publish('ADM_DATA_UPDATED');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.DeleteStudent = (groupId, student) => {
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
  ADMData.UpdateGroup(groupId, group);
  /*/

  /*/
  // Tell components to update
  UR.Publish('ADM_DATA_UPDATED');
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
  const decoded = SESSION.DecodeToken(hashedToken);
  let loginId, groupId, classroomId;
  if (decoded.isValid) {
    loginId = decoded.studentName;
    groupId = decoded.groupId;
    classroomId = decoded.classroomId;
  }
  // This assumes we already did validation
  adm_settings.selectedStudentId = loginId;
  // After logging in, we need to tell ADM what the default classroom is
  ADMData.SelectClassroom();
  UR.Publish('ADM_DATA_UPDATED');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.Logout = () => {
  adm_settings.selectedStudentId = '';
  ADMData.SelectClassroom('');
  UR.Publish('ADM_DATA_UPDATED');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.IsLoggedOut = () => {
  return adm_settings.selectedStudentId === undefined || adm_settings.selectedStudentId === '';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.IsValidLogin = hashedToken => {
  return SESSION.IsValidToken(hashedToken);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetSelectedStudentId = () => {
  return adm_settings.selectedStudentId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} [studentId = currently selected studentId]
 * @return {string} Name of student, or '' if not found
 */
ADMData.GetStudentName = (studentId = adm_settings.selectedStudentId) => {
  // FIXME: Eventually use actual name instead of ID?
  return studentId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetStudentGroupName = (studentId = adm_settings.selectedStudentId) => {
  const grp = ADMData.GetGroupByStudent(studentId);
  return grp ? grp.name : '';
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// MODELS ////////////////////////////////////////////////////////////////////
///
ADMData.GetModelById = (modelId = adm_settings.selectedModelId) => {
  return adm_db.a_models.find(model => model.id === modelId);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetModelsByClassroom = classroomId => {
  const groupIdsInClassroom = ADMData.GetGroupIdsByClassroom(classroomId);
  return adm_db.a_models.filter(mdl => groupIdsInClassroom.includes(mdl.groupId));
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @param {string} [studentId = current selected studentId]
 * @return {Array} Array of models, [] if not found
 */
ADMData.GetModelsByStudent = (studentId = adm_settings.selectedStudentId) => {
  const group = ADMData.GetGroupByStudent(studentId);
  if (group === undefined) return [];
  return adm_db.a_models.filter(mdl => mdl.groupId === group.id);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Gets the gropuId of the currently selected Student ID
ADMData.GetModelsByGroup = (group = ADMData.GetGroupByStudent()) => {
  return adm_db.a_models.filter(mdl => mdl.groupId === group.id);
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
ADMData.GetModelTitle = (modelId = adm_settings.selectedModelId) => {
  const model = ADMData.GetModelById(modelId);
  return model ? model.title : '';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Handles text input updates for the model title
 * @param {string} title
 */
ADMData.ModelTitleUpdate = (modelId, title) => {
  const model = ADMData.GetModelById(modelId);
  UTILS.RLog('ModelRename', `from "${model.title}" to "${title}"`);
  model.title = title;
  UR.Publish('MODEL_TITLE:UPDATED', { title });
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.NewModel = (groupId = ADMData.GetSelectedGroupId()) => {
  let model = {
    id: GenerateUID('mo'),
    title: 'new',
    groupId,
    dateCreated: new Date(),
    dateModified: new Date(),
    data: {}
  };
  adm_db.a_models.push(model);
  UR.Publish('ADM_DATA_UPDATED');
  ADMData.LoadModel(model.id, groupId);

  UTILS.RLog('ModelCreate');
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.LoadModel = modelId => {
  let model = ADMData.GetModelById(modelId);
  if (model === undefined) {
    console.error(PKG, 'LoadModel could not find a valid modelId', modelId);
  }
  PMCData.ClearModel();
  ADMData.SetSelectedModelId(modelId); // Remember the selected modelId locally
  PMCData.InitializeModel(model, adm_db.a_resources);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// This does not load the model, it just sets the currently selected model id
ADMData.SetSelectedModelId = modelId => {
  // verify it's valid
  if (adm_db.a_models.find(mdl => mdl.id === modelId) === undefined) {
    console.error(PKG, 'SetSelectedModelId could not find valid modelId', modelId);
  }
  adm_settings.selectedModelId = modelId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetSelectedModelId = () => {
  return adm_settings.selectedModelId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.CloseModel = () => {
  adm_settings.selectedModelId = '';
  UR.Publish('ADM_DATA_UPDATED');
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
ADMData.NewCriteria = (classroomId = adm_settings.selectedClassroomId) => {
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
ADMData.GetCriteriaByClassroom = (classroomId = adm_settings.selectedClassroomId) => {
  return adm_db.a_criteria.filter(crit => crit.classroomId === classroomId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.GetCriteriaLabel = (criteriaId, classroomId = ADMData.GetSelectedClassroomId()) => {
  let criteriaArr = ADMData.GetCriteriaByClassroom(classroomId);
  let criteria = criteriaArr.find(crit => crit.id === criteriaId);
  return criteria ? criteria.label : '';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.UpdateCriteria = criteria => {
  const i = adm_db.a_criteria.findIndex(cr => cr.id === criteria.id);
  if (i < 0) {
    // Criteria not found, so it must be a new criteria.  Add it.
    adm_db.a_criteria.push(criteria);
    return;
  }
  adm_db.a_criteria.splice(i, 1, criteria);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.UpdateCriteriaList = criteriaList => {
  // Remove any deleted criteria
  const updatedCriteriaIds = criteriaList.map(criteria => criteria.id);
  adm_db.a_criteria = adm_db.a_criteria.filter(
    crit =>
      crit.classroomId !== adm_settings.selectedClassroomId || updatedCriteriaIds.includes(crit.id)
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
  const sentenceStarter = adm_db.a_sentenceStarters.filter(ss => ss.classroomId === classroomId);
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

ADMData.UpdateSentenceStarter = sentenceStarter => {
  const i = adm_db.a_sentenceStarters.findIndex(ss => ss.id === sentenceStarter.id);
  if (i < 0) {
    // Sentence starter not found, so it must be new.  Add it.
    adm_db.a_sentenceStarters.push(sentenceStarter);
    return;
  }
  adm_db.a_sentenceStarters.splice(i, 1, sentenceStarter);
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
  let ratings = adm_db.a_ratingsDefinitions.find(ratings => ratings.classroomId === classroomId);
  if (ratings === undefined) {
    // create new ratings
    ratings = {};
    ratings.classroomId = classroomId;
    ratings.definitions = [];
    adm_db.a_ratingsDefinitions.push(ratings);
  }
  return ratings.definitions;
};

ADMData.UpdateRatingsDefinitions = (classroomId, ratingsDef) => {
  const ratings = adm_db.a_ratingsDefinitions.find(ratings => ratings.classroomId === classroomId);
  if (ratings) {
    ratings.definitions = ratingsDef;
  } else {
    console.error(
      PKG,
      '.UpdateRatingsDefinitions could not find ratings definition for classroomId',
      classroomId
    );
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// RESOURCES
///

// Returns all of the resource objects.
ADMData.AllResources = () => {
  return adm_db.a_resources;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Returns the resource object matching the rsrccId.
ADMData.Resource = rsrcId => {
  return adm_db.a_resources.find(item => {
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
  const classroomResource = adm_db.a_classroomResources.find(
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
  let classroomResources = adm_db.a_classroomResources.find(
    rsrc => rsrc.classroomId === classroomId
  );

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
window.adm = ADMData;
window.admdb = adm_db;
export default ADMData;
