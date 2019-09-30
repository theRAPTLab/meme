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

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ULINK = UR.NewConnection('data');

/// URSYS HOOKS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.Hook(__dirname, 'INITIALIZE', () => {
  console.log('*** INITIALIZING DATA ***');
  //
  ULINK.NetSubscribe('NET:SYSTEM_DBSYNC', data => {
    const cmd = data.cmd;
    if (!cmd) throw Error('SYSTEM_DBSYNC packet missing cmd property');
    const collections = DATAMAP.ExtractCollections(data);
    console.log(`*** got '${data.cmd}' command with data.changed:`, data);
  });
});

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// clone ADMData
const MOD = Object.assign({ ...ADM }, { ...PMC }, { ...VM });
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
/// this is a test routine; no ADMData routines require a delete group
/// so this is here to just provide a stub.
MIR.DeleteGroup = groupId => {
  return new Promise((resolve, reject) => {
    UR.NetCall('NET:SRV_DBREMOVE', {
      groups: [groupId]
    })
      .then(rdata => resolve(rdata))
      .catch(error => reject(error));
  });
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
  // Update the group
  if (!Array.isArray(students)) students = [students];
  let group = MOD.GetGroup(groupId);
  if (group === undefined) {
    console.error('AddStudent could not find group', groupId);
    return;
  }
  students.forEach(student => {
    if (student === undefined || student === '') {
      console.error('AddStudent adding blank student', groupId);
    }
    group.students.push(student);
  });
  // Now update groups, returning promise
  return new Promise((resolve, reject) => {
    MIR.UpdateGroup(groupId, group)
      .then(rdata => {
        resolve(rdata);
      })
      .catch(err => reject(err));
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.DeleteStudent = (groupId, student) => {
  // Update the group
  if (typeof student !== 'string') {
    console.error('DeleteStudent arg2 must be string');
    return;
  }
  let group = MOD.GetGroup(groupId);
  if (group === undefined) {
    console.error('DeleteStudent could not find group', groupId);
    return;
  }
  // Remove the student
  group.students = group.students.filter(stu => student !== stu);
  // Now update groups, returning promise
  return new Promise((resolve, reject) => {
    MIR.UpdateGroup(groupId, group)
      .then(rdata => {
        resolve(rdata);
        // FIRES 'ADM_DATA_UPDATED'
      })
      .catch(err => reject(err));
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.Login = loginToken => {
  return new Promise((resolve, reject) => {
    const urs = window.URSESSION;
    if (!urs) throw Error('unexpected missing URSESSION global');
    UR.NetCall('NET:SRV_SESSION_LOGIN', { token: loginToken }).then(rdata => {
      console.log('login', rdata);
      if (rdata.error) throw Error(rdata.error);
      console.log('updating URSESSION with session data');
      urs.SESSION_Token = rdata.token;
      urs.SESSION_Key = rdata.key;
      resolve(rdata);
    });
  }).catch(err => reject(err));
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MIR.Logout = () => {
  return new Promise((resolve, reject) => {
    const urs = window.URSESSION;
    if (!urs) throw Error('unexpected missing URSESSION global');
    if (!urs.SESSION_Key) throw Error('missing URSESSION session key');
    UR.NetCall('NET:SRV_SESSION_LOGOUT', { key: urs.SESSION_Key }).then(rdata => {
      console.log('logout', rdata);
      if (rdata.error) throw Error(rdata.error);
      console.log('removing session data from URSESSION');
      if (urs.SESSION_Token && urs.SESSION_Key) {
        urs.SESSION_Token = '';
        urs.SESSION_Key = '';
      } else throw Error('URSESSION key or token was not set');
      resolve(rdata);
    });
  }).catch(err => reject(err));
};
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
MIR.ClearModel = () => {};
MIR.InitializeModel = (model, resources) => {};
MIR.BuildModel = () => {
  // derived elements
  // a_props = nodes
  // a_mechs = edges
  // a_components = []; // props that aren't children
  // h_children = new Map(); // property children
  // h_outedges = new Map(); // outedges for each prop
  // a_resources = []; // resource obj { id, label, notes, type, url, links }
  // a_evidence = []; // evidence link {  id, propId, rsrcId, note }
  // h_evidenceByEvId = new Map(); // id -> evidence
  // h_evidenceByProp = new Map(); // prop -> [ evidence, ... ]
  // h_evlinkByResource = new Map(); //
};
MIR.PMC_AddProp = node => {}; // m_graph.setNode()
MIR.PMC_SetPropParent = (node, parent) => {}; // m_graph.setParent(node, parent)
MIR.PMC_PropDelete = propid => {}; // m_graph.removeNode(propid)
MIR.PMC_MechAdd = (sourceId, targetId, label) => {}; // m_graph.setEdge
MIR.PMC_MechUpdate = (origMech, newMech) => {}; // m_graph.setEdge()
MIR.PMC_MechDelete = mechId => {}; // m_graph.removeEdge()
MIR.PMC_AddEvidenceLink = (rsrcId, note) => {}; // a_evidence.push()
MIR.PMC_DeleteEvidenceLink = evId => {}; // a_evidence.splice()
MIR.SetEvidenceLinkPropId = (evId, propId) => {}; // a_evidence.find() evidence
MIR.SetEvidenceLinkMechId = (evId, mechId) => {}; // a_evidence.find() evidence

/// MODULE HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// DEBUG /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (!window.ur) window.ur = {};
window.ur.DATATEST = MIR;
// test update group
window.ur.tupg = id => {
  const g = ADM.GetGroup(id);
  g.name = `${g.name}${g.name}`;
  MIR.UpdateGroup(id, g).then(data => {
    console.log('updategroup', data);
  });
};
// test add teacher
window.ur.taddt = name => {
  MIR.AddTeacher(name).then(data => {
    console.log('addteacher', data);
    UR.Publish('TEACHER_SELECT', { teacherId: teacher.id });
  });
};
// test add students to group
window.ur.tadds = (groupId, students) => {
  MIR.AddStudents(groupId, students).then(data => {
    console.log('addstudents', data);
    // FIRES 'ADM_DATA_UPDATED'
    UR.Publish('ADM_DATA_UPDATED');
  });
};
// test delete student from group
window.ur.tdels = (groupId, student) => {
  MIR.DeleteStudent(groupId, student).then(data => {
    console.log('deletestudent', data);
    // FIRES 'ADM_DATA_UPDATED'
    UR.Publish('ADM_DATA_UPDATED');
  });
};
// test remove group
window.ur.trmg = (groupId, student) => {
  MIR.DeleteGroup(groupId).then(data => {
    console.log('deletegroup', data);
    // FIRES 'ADM_DATA_UPDATED'
    UR.Publish('ADM_DATA_UPDATED');
  });
};
// test login
window.ur.tlogin = token => {
  MIR.Login(token).then(() => {
    window.ur.clientinfo();
  });
  return 'logging in...';
};
// test logout
window.ur.tlogout = () => {
  MIR.Logout().then(() => {
    window.ur.clientinfo();
  });
  return 'logging out...';
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default MOD;
/// export default MODULE; // import MOD from './module'
/// export default MyClass; // import MyClass from  './module'
/// export { A, B }; // import { A, B } from './module'
/// export { A as B }; // import { B } from './module'
