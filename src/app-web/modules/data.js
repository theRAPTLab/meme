/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DATA

  A wrapper for the ADM DATA and PMC DATA structures

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import ADM from './adm-data';
import PMC from './pmc-data';
import VM from './vm-data';
import UR from '../../system/ursys';
import DATAMAP from '../../system/common-datamap';
import SESSION from '../../system/common-session';
import ASET from './adm-settings';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ULINK = UR.NewConnection('data');
const DBG = false;

/// URSYS HOOKS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.Hook(__dirname, 'INITIALIZE', () => {
  console.log('*** INITIALIZING DATA ***');
  //
  ULINK.NetSubscribe('NET:SYSTEM_DBSYNC', data => {
    const cmd = data.cmd;
    if (!cmd) throw Error('SYSTEM_DBSYNC packet missing cmd property');
    if (!DATAMAP.ValidateCommand(cmd)) throw Error(`SYSTEM_DBSYNC unrecognized command '${cmd}'`);
    switch (cmd) {
      case 'add':
        ADM.SyncAddedData(data);
        PMC.SyncAddedData(data);
        break;
      case 'update':
        ADM.SyncUpdatedData(data);
        PMC.SyncUpdatedData(data);
        break;
      case 'remove':
        ADM.SyncRemovedData(data);
        PMC.SyncRemovedData(data);
        break;
      default:
        console.error('unrecognized command', cmd);
    }
    if (DBG) console.log(`SYSTEM_DBSYNC '${cmd}'\n`, data);
  });
});

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// clone ADMData, PMC, VM into $ object
const $$$ = Object.assign({}, { ...ADM }, { ...PMC }, { ...VM });

/// NEW METHOD PROTOTYPING AREA ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return true if the prop designated by propId has a parent that is
 *  different than newParentId
 */
$$$.PMC_IsDifferentPropParent = (propId, newParentId) => {
  return $$$.PropParent(propId) !== newParentId;
};

/// DEBUG /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (!window.ur) window.ur = {};
// - - - - - - - - - - - - - - - - - - - - -
// test update group
window.ur.tupg = id => {
  const g = ADM.GetGroup(id);
  g.name = `${g.name}${g.name}`;
  $$$.UpdateGroup(id, g).then(data => {
    console.log('updategroup', data);
  });
};
// test add teacher
window.ur.taddt = name => {
  $$$.AddTeacher(name).then(data => {
    console.log('addteacher', data);
    const teacher = data.teachers[0];
    UR.Publish('TEACHER_SELECT', { teacherId: teacher.id });
  });
};
// test add students to group
window.ur.tadds = (groupId, students) => {
  $$$.AddStudents(groupId, students).then(data => {
    console.log('addstudents', data);
    // FIRES 'ADM_DATA_UPDATED'
    UR.Publish('ADM_DATA_UPDATED');
  });
  return `adding ${JSON.stringify(students)} to group ${groupId}`;
};
// test delete student from group
window.ur.tdels = (groupId, student) => {
  $$$.DeleteStudent(groupId, student).then(data => {
    console.log('deletestudent', data);
    // FIRES 'ADM_DATA_UPDATED'
    UR.Publish('ADM_DATA_UPDATED');
  });
  return `deleting student  ${student} from group ${groupId}`;
};
// test remove group
window.ur.trmg = groupId => {
  $$$.DeleteGroup(groupId).then(data => {
    console.log('deletegroup', JSON.stringify(data));
    // FIRES 'ADM_DATA_UPDATED'
    UR.Publish('ADM_DATA_UPDATED');
  });
  return `deleting group ${groupId}`;
};
// - - - - - - - - - - - - - - - - - - - - -
// test pmc entity delete
window.ur.tpropd = propId => {
  $$$.PMC_PropDelete(propId).then(data => {
    console.log('deleteprop', data);
  });
  return `deleting pmc prop`;
};
// - - - - - - - - - - - - - - - - - - - - -
window.ur.tpropa = name => {
  $$$.PMC_PropAdd(name).then(data => {
    console.log('addprop', data);
  });
  return `adding pmc prop`;
};

// - - - - - - - - - - - - - - - - - - - - -
// test login
window.ur.tlogin = token => {
  $$$.Login(token).then(() => {
    window.ur.clientinfo();
  });
  return 'logging in...';
};
// test logout
window.ur.tlogout = () => {
  $$$.Logout().then(() => {
    window.ur.clientinfo();
  });
  return 'logging out...';
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// $ is the combined ADM, PMC, VM plus overrides
export default $$$;
