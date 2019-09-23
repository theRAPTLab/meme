/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DATA

  A wrapper for the ADM DATA and PMC DATA structures

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import ADM from './adm-data';
import PMC from './pmc-data';
import UR from '../../system/ursys';
import DATAMAP from '../../system/common-datamap';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// clone ADMData
const MOD = Object.assign({ ...ADM }, { ...PMC });
const MIR = {};

/// OVERRIDE SELECT ADM DATA METHODS //////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.AddTeacher = name => {
  return new Promise((resolve, reject) => {
    UR.NetCall('NET:SRV_DBADD', {
      teachers: { name }
    })
      .then(rdata => resolve(rdata))
      .catch(error => reject(error));
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.SetClassesModelVisibility = isVisible => {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.AddClassroom = name => {
  // FIRES 'CLASSROOM_SELECT' classroomId, needsUpdating
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.AddGroup = groupName => {
  // FIRES 'ADM_DATA_UPDATED'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.UpdateGroup = (groupId, group) => {
  return new Promise((resolve, reject) => {
    const groupData = Object.assign({}, group, { id: groupId });
    UR.NetCall('NET:SRV_DBUPDATE', {
      groups: [groupData]
    })
      .then(rdata => resolve(rdata))
      .catch(error => reject(error));
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.AddStudents = (groupId, students) => {
  // FIRES 'ADM_DATA_UPDATED'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.DeleteStudent = (groupId, student) => {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.Login = loginId => {
  // FIRES 'ADM_DATA_UPDATED'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.Logout = () => {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.ModelTitleUpdate = (modelId, title) => {
  // FIRES 'MODEL_TITLE_UPDATED' title
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.NewModel = groupId => {
  // FIRES 'ADM_DATA_UPDATED'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.UpdateCriteria = criteria => {}; //
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.UpdateCriteriaList = criteria => {}; //
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.UpdateSentenceStarter = sstarter => {}; //
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.UpdateRatingsDefinitions = (classId, rateDef) => {}; //

/// PMC DATA MOD METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MODULE HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// debug
window.mdat = MIR;
window.mdat.tupg = id => {
  const g = ADM.GetGroup(id);
  g.name = `${g.name}${g.name}`;
  MIR.UpdateGroup(id, g).then(data => {
    console.log('got data', data);
  });
};
// test add teacher
window.mdat.taddt = name => {
  MIR.AddTeacher(name).then(data => {
    console.log('got data', data);
  });
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default MOD;
/// export default MODULE; // import MOD from './module'
/// export default MyClass; // import MyClass from  './module'
/// export { A, B }; // import { A, B } from './module'
/// export { A as B }; // import { B } from './module'
