import DEFAULTS from './defaults';
import UR from '../../system/ursys';
import PMCData from './pmc-data';

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
const PKG = 'adm-data.';

/// MODEL /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let adm_db = {
  a_teacher: [],
  a_classrooms: [],
  a_groups: [],
  a_models: [],
  a_criteria: [],
  a_sentenceStarters: [],
  a_classroomResources: []
}; // server database object by reference
let adm_settings = {}; // local settings, state of the admin view (current displayed class/teacher)

UR.DB_Subscribe = () => {}; // FIXME: Cover for now. Remove when implemented.
UR.DB_Subscribe('ADMIN:UPDATED', ADMData.AdmDataUpdated); // active
ADMData.AdmDataUpdated = data => {
  adm_db = data.adm_db;
};

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
lifecycle position: "configuration" LOAD_ASSETS (URSYS Lifecycle)

Server Use Model is a shared laptop between a couple of teachers. data is local
to who the user. The need for editing teachers, class periods is as yet
undwefined.

The admin interface is accessed from LOCALHOST ONLY, so no need for network
sync. However, it should implement a UR.Message-style REACTIVE RENDER:

1. React subscribes to data changes, and only then rerenders (no forced renders)
2. React changes its internal data-dependent display elements by publishing data
   and letting 1. actually trigger the rerender

TODO:
o Resources LIst into ADMDATA here.
o How to represent
o A "stickynote" is a container for comments, "linked" to a PMC element

/*/
ADMData.Load = () => {
  // SAVED IN ELECTRON/LOKI, EDITABLE BY TEACHERS
  adm_db.a_teachers = [
    { id: 'brown', name: 'Ms Brown' },
    { id: 'smith', name: 'Mr Smith' },
    { id: 'gordon', name: 'Ms Gordon' }
  ];
  // SAVED IN ELECTRON/LOKI, EDITABLE BY TEACHERS
  adm_db.a_classrooms = [
    { id: 'cl01', name: 'Period 1', teacherId: 'brown' },
    { id: 'cl02', name: 'Period 3', teacherId: 'brown' },
    { id: 'cl03', name: 'Period 2', teacherId: 'smith' },
    { id: 'cl04', name: 'Period 3', teacherId: 'smith' }
  ];
  // SAVED IN ELECTRON/LOKI, EDITABLE BY TEACHERS
  adm_db.a_groups = [
    { id: 'gr01', name: 'Blue', students: ['Bob', 'Bessie', 'Bill'], classroomId: 'cl01' },
    { id: 'gr02', name: 'Green', students: ['Ginger', 'Gail', 'Greg'], classroomId: 'cl01' },
    { id: 'gr03', name: 'Red', students: ['Rob', 'Reese', 'Randy'], classroomId: 'cl01' },
    { id: 'gr04', name: 'Purple', students: ['Peter', 'Paul', 'Penelope'], classroomId: 'cl01' },
    { id: 'gr05', name: 'Mackerel', students: ['Mary', 'Mavis', 'Maddy'], classroomId: 'cl02' }
  ];
  // LIST SAVED IN ELECTRON/LOKI, EDITABLE BY TEACHERS AND STUDENTS
  // ids here are relevant to PMCData / SVGView operation
  adm_db.a_models = [
    { id: 'mo01', title: 'Fish Sim', groupId: 'gr01', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo02', title: 'Tank Sim', groupId: 'gr01', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo03', title: 'Ammonia', groupId: 'gr01', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo04', title: 'Fish Sim', groupId: 'gr02', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo05', title: 'Tank Sim', groupId: 'gr02', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo06', title: 'Fish Sim', groupId: 'gr04', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo07', title: 'No Sim', groupId: 'gr04', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo08', title: 'Fish Sim', groupId: 'gr04', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo09', title: 'Tank Sim', groupId: 'gr04', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo10', title: 'Fish Sim', groupId: 'gr04', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo11', title: 'No Sim', groupId: 'gr05', dateCreated: '', dateModified: '', data: '' }
  ];
  // SAVED IN ELECTRON/LOKI, EDITABLE BY TEACHERS
  // ViewMain will eventually show a link that shows criteria
  adm_db.a_criteria = [
    {
      id: 'cr01',
      label: 'Clarity',
      description: 'How clear is the explanation?',
      classroomId: 'cl01'
    },
    {
      id: 'cr02',
      label: 'Visuals',
      description: 'Does the layout make sense?',
      classroomId: 'cl01'
    },
    {
      id: 'cr03',
      label: 'Clarity',
      description: 'How clear is the evidence link?',
      classroomId: 'cl02'
    },
    {
      id: 'cr04',
      label: 'Layout',
      description: 'Does the layout make sense?',
      classroomId: 'cl02'
    }
  ];
  // SAVED IN ELECTRON/LOKI, EDITABLE BY TEACHERS
  adm_db.a_sentenceStarters = [
    {
      id: 'ss01',
      classroomId: 'cl01',
      sentences: 'I noticed...\nI think...'
    },
    {
      id: 'ss02',
      classroomId: 'cl02',
      sentences: 'We noticed...'
    },
    {
      id: 'ss03',
      classroomId: 'cl03',
      sentences: 'We believe...'
    }
  ];
  // SAVED IN ELECTRON/LOKI, EDITABLE BY TEACHERS
  adm_db.a_classroomResources = [
    { classroomId: 'cl01', resources: ['rs1', 'rs2'] }, // PMCData Rsources
    { classroomId: 'cl02', resources: ['rs2', 'rs3'] },
    { classroomId: 'cl03', resources: ['rs4', 'rs5'] },
    { classroomId: 'cl04', resources: ['rs6', 'rs7'] }
  ];

  /*/
   *    Resources
   *
   *    Currently resources use a placeholder screenshot as the default image.
   *    (Screenshot-creation and saving have not been implemented yet).
   *
  /*/
  adm_db.a_resources = [
    {
      rsrcId: 'rs1',
      referenceLabel: '1',
      label: 'Fish in a Tank Simulation',
      notes: 'water quality and fish deaths over time',
      type: 'simulation',
      url: '../static/dlc/FishinaTank.html',
      links: 0
    },
    {
      rsrcId: 'rs2',
      referenceLabel: '2',
      label: "Raj's forum post.",
      notes: 'Forum post about fish deaths',
      type: 'report',
      url: '../static/dlc/RajForumPost.pdf',
      links: 0
    },
    {
      rsrcId: 'rs3',
      referenceLabel: '3',
      label: 'Autopsy Report',
      notes: 'Fighting?',
      type: 'report',
      url: '../static/dlc/VetReport.pdf',
      links: 0
    },
    {
      rsrcId: 'rs4',
      referenceLabel: '4',
      label: 'Fish Starving Simulation',
      notes: 'food and fish population',
      type: 'simulation',
      url: '../static/dlc/FishStarving.html',
      links: 0
    },
    {
      rsrcId: 'rs5',
      referenceLabel: '5',
      label: 'Ammonia Testing',
      notes: 'Ammonia Testing and Water Quality',
      type: 'report',
      url: '../static/dlc/AmmoniaTesting.pdf',
      links: 0
    },
    {
      rsrcId: 'rs6',
      referenceLabel: '6',
      label: 'Fish Fighting Simulation',
      notes: 'fighting, fish death',
      type: 'simulation',
      url: '../static/dlc/FishFighting.html',
      links: 0
    },
    {
      rsrcId: 'rs7',
      referenceLabel: '7',
      label: 'Food Rot Simulation',
      notes: 'rotting, waste, fish death',
      type: 'simulation',
      url: '../static/dlc/FoodRot.html',
      links: 0
    },
    {
      rsrcId: 'rs8',
      referenceLabel: '8',
      label: 'Ammonia in Tanks Report',
      notes: 'Ammonia, Research',
      type: 'report',
      url: '../static/dlc/AmmoniaInTanks.pdf',
      links: 0
    },
    {
      rsrcId: 'rs9',
      referenceLabel: '9',
      label: 'Fish Simulation With All Variables',
      notes: 'ammonia, waste, death, food, rotting, aggression, filter',
      type: 'simulation',
      url: '../static/dlc/FishAllVariables.html',
      links: 0
    }
  ];

  // HACK IN TEMPORARY DATA
  let model = ADMData.GetModelById('mo01');
  model.data = {
    // components is a 'component' or a 'property' (if it has a parent)
    properties: [
      {
        id: 'tank',
        name: 'tank',
        comments: [
          {
            id: 0,
            time: 0,
            author: 'Bob',
            date: new Date(),
            text: 'I like this',
            criteriaId: 'cr01',
            readBy: ['Bob', 'Bill']
          },
          {
            id: 1,
            time: 10,
            author: 'Bill',
            date: new Date(),
            text: 'I DONT like this',
            criteriaId: 'cr02',
            readBy: []
          },
          {
            id: 2,
            time: 11,
            author: 'Mary',
            date: new Date(),
            text: 'This is not mine!',
            criteriaId: 'cr02',
            readBy: []
          }
        ]
      },
      {
        id: 'fish',
        name: 'fish',
        comments: [
          {
            id: 0,
            author: 'Bessie',
            date: new Date(),
            text: 'What is this',
            criteriaId: 'cr01',
            readBy: ['Bob', 'Bill']
          },
          {
            id: 1,
            author: 'Bill',
            date: new Date(),
            text: 'I DONT like this',
            criteriaId: 'cr02',
            readBy: []
          }
        ]
      },
      { id: 'food', name: 'food' },
      { id: 'ammonia', name: 'Ammonia' },
      { id: 'clean-water', name: 'clean water', parent: 'tank' },
      { id: 'dirty-water-waste', name: 'waste', parent: 'tank' },
      { id: 'poop', name: 'poop', parent: 'dirty-water-waste' }
    ],
    mechanisms: [
      { source: 'fish', target: 'tank', name: 'live in' },
      { source: 'fish', target: 'food', name: 'eat' },
      { source: 'fish', target: 'dirty-water-waste', name: 'produce' }
    ],
    evidence: [
      {
        evId: 'ev1',
        propId: 'fish',
        mechId: undefined,
        rsrcId: 'rs1',
        note: 'fish need food',
        comments: [
          {
            id: 0,
            author: 'Bessie',
            date: new Date(),
            text: 'What is this',
            criteriaId: 'cr01',
            readBy: ['Bob', 'Bill']
          },
          {
            id: 1,
            author: 'Bill',
            date: new Date(),
            text: 'I DONT like this',
            criteriaId: 'cr02',
            readBy: []
          }
        ]
      },
      { evId: 'ev2', propId: undefined, mechId: 'fish:food', rsrcId: 'rs1', note: 'fish need food' }
    ]
  };
  let model2 = ADMData.GetModelById('mo02');
  model2.data = {
    // components is a 'component' or a 'property' (if it has a parent)
    components: [
      { id: 'tank', name: 'tank' },
      { id: 'fish', name: 'fish' },
      { id: 'ammonia', name: 'Ammonia' }
    ]
  };

  // INITIALIZE SETTINGS
  adm_settings = {
    selectedTeacherId: '',
    selectedClassroomId: '',
    selectedStudentId: '',
    selectedModelId: ''
  };
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
ADMData.GetTeacherName = teacherId => {
  let teacher = adm_db.a_teachers.find(tch => {
    return tch.id === teacherId;
  });
  return teacher ? teacher.name : '';
};
ADMData.SelectTeacher = teacherId => {
  adm_settings.selectedTeacherId = teacherId;
  UR.Publish('TEACHER_SELECT', { teacherId });
};
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
// Retreive currently selected teacher's classrooms by default if no teacherId is defined
ADMData.GetClassroomsByTeacher = (teacherId = adm_settings.selectedTeacherId) => {
  return adm_db.a_classrooms.filter(cls => cls.teacherId === teacherId);
};
ADMData.GetClassroomByGroup = groupId => {
  let group = ADMData.GetGroup(groupId);
  return group ? group.classroomId : undefined;
};
ADMData.GetClassroomByStudent = (studentId = adm_settings.selectedStudentId) => {
  const groupId = ADMData.GetGroupIdByStudent(studentId);
  return ADMData.GetClassroomByGroup(groupId);
};
ADMData.SelectClassroom = (classroomId = ADMData.GetClassroomByStudent()) => {
  adm_settings.selectedClassroomId = classroomId;
  UR.Publish('CLASSROOM_SELECT', { classroomId });
};
ADMData.GetSelectedClassroomId = () => {
  return adm_settings.selectedClassroomId;
};
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

/**
 *  Returns a group object
 */
ADMData.GetGroup = groupId => {
  return adm_db.a_groups.find(group => {
    return group.id === groupId;
  });
};
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
ADMData.GetGroupIdByStudent = studentId => {
  let group = ADMData.GetGroupByStudent(studentId);
  return group ? group.id : undefined;
};
ADMData.GetGroupNameByStudent = studentId => {
  let group = ADMData.GetGroupByStudent(studentId);
  return group ? group.name : '';
};
ADMData.GetSelectedGroupId = () => {
  const studentId = ADMData.GetSelectedStudentId();
  return ADMData.GetGroupIdByStudent(studentId);
};
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
  studentsArr.map(student => {
    if (student === undefined || student === '') {
      console.error(PKG, 'AddStudent adding blank student', groupId);
      return;
    }
    group.students.push(student);
  });
  // Now update a_groups
  ADMData.UpdateGroup(groupId, group);
  // Tell components to update
  UR.Publish('ADM_DATA_UPDATED');
};
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
  return `BR-${groupId}-XYZ${studentName ? '-' : ''}${studentName}\n`;
};
ADMData.Login = loginId => {
  // FIXME: Replace this with a proper token check and lookup
  // This assumes we already did validation
  adm_settings.selectedStudentId = loginId;
  // After logging in, we need to tell ADM what the default classroom is
  ADMData.SelectClassroom();
  UR.Publish('ADM_DATA_UPDATED');
};
ADMData.Logout = () => {
  adm_settings.selectedStudentId = '';
  ADMData.SelectClassroom('');
  UR.Publish('ADM_DATA_UPDATED');
};
ADMData.IsLoggedOut = () => {
  return adm_settings.selectedStudentId === undefined || adm_settings.selectedStudentId === '';
};
ADMData.IsValidLogin = loginId => {
  // FIXME: Replace this with a proper token check
  let isValid = ADMData.GetGroupByStudent(loginId) !== undefined;
  return isValid;
};
ADMData.GetSelectedStudentId = () => {
  return adm_settings.selectedStudentId;
};
ADMData.GetStudentName = () => {
  // FIXME: Eventually use actual name instead of ID?
  return adm_settings.selectedStudentId;
};
ADMData.GetStudentGroupName = (studentId = adm_settings.selectedStudentId) => {
  const grp = ADMData.GetGroupByStudent(studentId);
  return grp ? grp.name : '';
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// MODELS ////////////////////////////////////////////////////////////////////
///
ADMData.GetModelById = modelId => {
  return adm_db.a_models.find(model => model.id === modelId);
};
ADMData.GetModelsByClassroom = classroomId => {
  const groupIdsInClassroom = ADMData.GetGroupIdsByClassroom(classroomId);
  return adm_db.a_models.filter(mdl => groupIdsInClassroom.includes(mdl.groupId));
};
ADMData.GetModelsByStudent = (studentId = adm_settings.selectedStudentId) => {
  const group = ADMData.GetGroupByStudent(studentId);
  if (group === undefined) return [];

  return adm_db.a_models.filter(mdl => mdl.groupId === group.id);
};
// Gets the gropuId of the currently selected Student ID
ADMData.GetModelsByGroup = (group = ADMData.GetGroupByStudent()) => {
  return adm_db.a_models.filter(mdl => mdl.groupId === group.id);
};
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
};
ADMData.LoadModel = modelId => {
  let model = ADMData.GetModelById(modelId);
  if (model === undefined) {
    console.error(PKG, 'LoadModel could not find a valid modelId', modelId);
  }
  PMCData.LoadModel(model, adm_db.a_resources);
  ADMData.SetSelectedModelId(modelId); // Remember the selected modelId locally
};
// This does not load the model, it just sets the currently selected model id
ADMData.SetSelectedModelId = modelId => {
  // verify it's valid
  if (adm_db.a_models.find(mdl => mdl.id === modelId) === undefined) {
    console.error(PKG, 'SetSelectedModelId could not find valid modelId', modelId);
  }
  adm_settings.selectedModelId = modelId;
};
ADMData.GetSelectedModelId = () => {
  return adm_settings.selectedModelId;
};
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
ADMData.GetCriteriaByClassroom = (classroomId = adm_settings.selectedClassroomId) => {
  return adm_db.a_criteria.filter(crit => crit.classroomId === classroomId);
};
ADMData.GetCriteriaLabel = (criteriaId, classroomId = ADMData.GetSelectedClassroomId()) => {
  let criteriaArr = ADMData.GetCriteriaByClassroom(classroomId);
  let criteria = criteriaArr.find(crit => crit.id === criteriaId);
  return criteria ? criteria.label : '';
};
ADMData.UpdateCriteria = criteria => {
  const i = adm_db.a_criteria.findIndex(cr => cr.id === criteria.id);
  if (i < 0) {
    // Criteria not found, so it must be a new criteria.  Add it.
    adm_db.a_criteria.push(criteria);
    return;
  }
  adm_db.a_criteria.splice(i, 1, criteria);
};
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

ADMData.UpdateSentenceStarter = sentenceStarter => {
  const i = adm_db.a_sentenceStarters.findIndex(ss => ss.id === sentenceStarter.id);
  if (i < 0) {
    // Sentence starter not found, so it must be new.  Add it.
    adm_db.a_sentenceStarters.push(sentenceStarter);
    return;
  }
  adm_db.a_sentenceStarters.splice(i, 1, sentenceStarter);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// RESOURCES
///

// Returns all of the resource objects.
ADMData.AllResources = () => {
  return adm_db.a_resources;
};
// Returns the resource object matching the rsrccId.
ADMData.Resource = rsrcId => {
  return adm_db.a_resources.find(item => {
    return item.rsrcId === rsrcId;
  });
};
// returns `resources` not `classroomResources`
ADMData.GetResourcesByClassroom = classroomId => {
  let classroomResources = adm_db.a_classroomResources.find(
    rsrc => rsrc.classroomId === classroomId
  );
  return classroomResources ? classroomResources.resources : [];
};
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
export default ADMData;
