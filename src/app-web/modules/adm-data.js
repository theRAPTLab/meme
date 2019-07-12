import DEFAULTS from './defaults';
import UR from '../../system/ursys';

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
const PKG = 'adm-data';

/// MODEL /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let a_teachers = []; // all properties (strings)
let a_classrooms = []; // all mechanisms (pathId strings)
let a_groups = [];
let a_models = [];
let a_criteria = [];
let a_classroomResources = []; // List of resources enabled for each classroom

let selectedClassroomId = '';

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ADMData.Load = () => {
  a_teachers = [
    { id: 'brown', name: 'Ms Brown' },
    { id: 'smith', name: 'Mr Smith' },
    { id: 'gordon', name: 'Ms Gordon' }
  ];
  a_classrooms = [
    { id: 'cl01', name: 'Period 1', teacherId: 'brown' },
    { id: 'cl02', name: 'Period 3', teacherId: 'brown' },
    { id: 'cl03', name: 'Period 2', teacherId: 'smith' },
    { id: 'cl04', name: 'Period 3', teacherId: 'smith' }
  ];
  a_groups = [
    { id: 'gr01', name: 'Blue', students: ['Bob', 'Bessie', 'Bill'], classroomId: 'cl01' },
    { id: 'gr02', name: 'Green', students: ['Ginger', 'Gail', 'Greg'], classroomId: 'cl01' },
    { id: 'gr03', name: 'Red', students: ['Rob', 'Reese', 'Randy'], classroomId: 'cl01' },
    { id: 'gr04', name: 'Purple', students: ['Peter', 'Paul', 'Penelope'], classroomId: 'cl02' },
  ];
  a_models = [
    { id: 'mo01', title: 'Fish Sim', groupId: 'gr01', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo02', title: 'Tank Sim', groupId: 'gr01', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo03', title: 'Ammonia', groupId: 'gr01', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo04', title: 'Fish Sim', groupId: 'gr02', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo05', title: 'Tank Sim', groupId: 'gr02', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo06', title: 'Fish Sim', groupId: 'gr04', dateCreated: '', dateModified: '', data: '' },
    { id: 'mo07', title: 'No Sim', groupId: 'gr04', dateCreated: '', dateModified: '', data: '' }
  ];
  a_criteria = [
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
  a_classroomResources = [
    { classroomId: 'cl01', resources: ['rs1', 'rs2'] },
    { classroomId: 'cl02', resources: ['rs2', 'rs3'] },
    { classroomId: 'cl03', resources: ['rs4', 'rs5'] },
    { classroomId: 'cl04', resources: ['rs6', 'rs7'] }
  ]
};

/// PRIVATE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// FIXME: This really oought to check to makes ure the id is unique
const GenerateUID = (prefix = '', suffix = '') => {
  return prefix + Math.trunc(Math.random() * 10000000000).toString() + suffix;
}

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Return array of all the properties of the PMC model. Note that a PMC
 *  component is just a property that isn't a child of any other property.
 *  @returns {array} - array of nodeId strings
 */

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// TEACHERS
ADMData.GetAllTeachers = () => {
  return a_teachers;
};
ADMData.GetTeacherName = teacherId => {
  let teacher = a_teachers.find(tch => {
    return tch.id === teacherId;
  });
  return teacher ? teacher.name : '';
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// CLASSROOMS
ADMData.GetClassroomsByTeacher = teacherId => {
  return a_classrooms.filter(cls => cls.teacherId === teacherId);
};
ADMData.SelectClassroom = classroomId => {
  selectedClassroomId = classroomId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// GROUPS
/**
 *  Add a new group
 */
ADMData.AddGroup = (groupName) => {
  let group = {};
  group.id = GenerateUID('gr');
  group.name = groupName;
  group.students = [];
  group.classroomId = selectedClassroomId;
  a_groups.push(group);
  UR.Publish('ADM_DATA_UPDATED');
};

/**
 *  Returns a group object
 */
ADMData.GetGroup = groupId => {
  return a_groups.find(group => {
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
  return a_groups.filter(grp => grp.classroomId === classroomId);
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
 *  Updates a_groups with latest group info
 */
ADMData.UpdateGroup = (groupId, group) => {
  let i = a_groups.findIndex(grp => grp.id === groupId);
  if (i < 0) {
    console.error(PKG, '.UpdateGroup could not find group with id', groupId);
    return;
  }
  a_groups.splice(i, 1, group);
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
    console.error('ADMData.AddStudent could not find group', groupId);
    return;
  }
  studentsArr.map(student => {
    if (student === undefined || student === '') {
      console.error('ADMData.AddStudent adding blank student', groupId);
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
    console.error('ADMData.AddStudent could not find group', groupId);
    return;
  }
  const students = group.students;
  if (students === undefined) {
    console.error('ADMData.AddStudent could not find any students in group', groupId);
    return;
  }
  // Remove the student
  const filteredStudents = students.filter(stu => student !== stu);
  group.students = filteredStudents;
  // Now update a_groups
  ADMData.UpdateGroup(groupId, group);
  // Tell components to update
  UR.Publish('ADM_DATA_UPDATED');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// MODELS
ADMData.GetModelsByClassroom = classroomId => {
  const groupIdsInClassroom = ADMData.GetGroupIdsByClassroom(classroomId);
  return a_models.filter(mdl => groupIdsInClassroom.includes(mdl.groupId));
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// CRITERIA
/**
 *  NewCriteria
 *  1. Creates a new empty criteria object with a unqiue ID.
 *  2. Adds the criteria object to the a_criteria array
 *  3. Returns the criteria object.
 * 
 *  Calling `NewCriteria()` will automatically use the currently
 *  selectedClassssroomId as the classroomId.
 * 
 *  Call `NewCriteria('xxId')` to set the classroomId manually.
 */
ADMData.NewCriteria = (classroomId = selectedClassroomId) => {
  const id = GenerateUID('cr');
  if (classroomId === undefined) {
    console.error(PKG, '.NewCriteria called with bad classroomId:', classroomId);
    return;
  }
  const crit = {
    id,
    label: '',
    description: '',
    classroomId
  };
  a_criteria.push(crit);
  return crit;
};
ADMData.GetCriteriaByClassroom = classroomId => {
  return a_criteria.filter(crit => crit.classroomId === classroomId);
};
ADMData.UpdateCriteria = criteria => {
  const i = a_criteria.findIndex(cr => cr.id === criteria.id);
  if (i < 0) {
    console.error(PKG, '.UpdateCriteria could not find criteria with id', criteria.id);
    return;
  }
  a_criteria.splice(i, 1, criteria);
};
ADMData.UpdateCriteriaList = criteriaList => {
  // Remove any deleted criteria
  const updatedCriteriaIds = criteriaList.map(criteria => criteria.id);
  a_criteria = a_criteria.filter(
    crit => crit.classroomId !== selectedClassroomId || updatedCriteriaIds.includes(crit.id)
  );
  // Update existing criteria
  criteriaList.forEach(criteria => ADMData.UpdateCriteria(criteria));
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// RESOURCES
ADMData.GetResourcesByClassroom = classroomId => {
  let classroomResources = a_classroomResources.find(rsrc => rsrc.classroomId === classroomId);
  return classroomResources ? classroomResources.resources : [];
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ADMData;
