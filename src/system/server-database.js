/* eslint-disable no-param-reassign */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

DATABASE SERVER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const Loki = require('lokijs');
const PATH = require('path');
const FS = require('fs-extra');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const SESSION = require('./common-session');
const LOGGER = require('./server-logger');
const PROMPTS = require('../system/util/prompts');

const { TERM_DB: CLR, TR } = PROMPTS;
const PR = `${CLR}${PROMPTS.Pad('UR_DB')}${TR}`;
const RUNTIMEPATH = PATH.join(__dirname, '../../runtime');

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let m_options; // saved initialization options
let m_db; // loki database
let m_max_edgeID;
let m_max_nodeID;
let NODES; // loki "nodes" collection
let EDGES; // loki "edges" collection
let m_locked_nodes;
let m_locked_edges;
let TEMPLATE;

/// API METHODS ///////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const DB_CONFIG = {
  dataset: 'meme'
}; //
const DB = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Initialize database, creating blank DB file if necessary.
 */
DB.InitializeDatabase = (options = {}) => {
  let dataset = DB_CONFIG.dataset || 'test';
  let db_file = m_GetValidDBFilePath(dataset);
  FS.ensureDirSync(PATH.dirname(db_file));
  if (!FS.existsSync(db_file)) {
    console.log(PR, `NO EXISTING DATABASE ${db_file}, so creating BLANK DATABASE...`);
  }

  // initialize database with given options
  console.log(PR, `loading database ${db_file}`);

  let ropt = {
    autoload: true,
    autoloadCallback: f_DatabaseInitialize,
    autosave: true,
    autosaveCallback: f_AutosaveStatus,
    autosaveInterval: 4000 // save every four seconds
  };

  ropt = Object.assign(ropt, options);
  m_db = new Loki(db_file, ropt);
  m_options = ropt;
  m_options.db_file = db_file; // store for use by DB.WriteJSON

  // callback on load
  function f_DatabaseInitialize() {
    // on the first load of (non-existent database), we will have no
    // collections so we can detect the absence of our collections and
    // add (and configure) them now.
    NODES = m_db.getCollection('nodes');
    if (NODES === null) NODES = m_db.addCollection('nodes');
    m_locked_nodes = new Set();
    EDGES = m_db.getCollection('edges');
    if (EDGES === null) EDGES = m_db.addCollection('edges');
    m_locked_edges = new Set();

    console.log(PR, `database ready`);
    m_db.saveDatabase();

    // Call complete callback
    if (typeof m_options.onLoadComplete === 'function') {
      m_options.onLoadComplete();
    }
  } // end f_DatabaseInitialize

  // UTILITY FUNCTION
  function f_AutosaveStatus() {
    let nodeCount = NODES.count();
    let edgeCount = EDGES.count();
    console.log(PR, `AUTOSAVING! ${nodeCount} NODES / ${edgeCount} EDGES <3`);
  }
};

/// INITIALIZE DATABASE ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: load database
 * Package the database and related templatesinto the provided pkt object.
 */
DB.PKT_GetDatabase = pkt => {
  let nodes = NODES.chain().data({ removeMeta: true });
  let edges = EDGES.chain().data({ removeMeta: true });
  if (DBG)
    console.log(
      PR,
      `PKT_GetDatabase ${pkt.Info()} (loaded ${nodes.length} nodes, ${edges.length} edges)`
    );
  LOGGER.Write(pkt.Info(), `getdatabase`);
  const adm_db = {};
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
  // SAVED IN ELECTRON/LOKI, (EVENTUALLY) EDITABLE BY TEACHERS
  adm_db.a_ratingsDefinitions = [
    { label: 'Really disagrees!', rating: -3 },
    { label: 'Kinda disagrees!', rating: -2 },
    { label: 'Disagrees a little', rating: -1 },
    { label: 'Not rated / Irrelevant', rating: 0 },
    { label: 'Weak support', rating: 1 },
    { label: 'Medium support', rating: 2 },
    { label: 'Rocks!!', rating: 3 }
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
  /*\

    stickynotes "hold" the comments for a particular PMC or Evidence object
    annotations are the academic terminology for talking about some model element (?)
    stickynotes are a form of annotation
    * StickyNoteButtons
    * StickyNote
    model connections are an assertion or hypothesis
    evidence links are a supporting assertion or hypothesis

    properties: [
      {
        id, name, parent <optional>,
        comments: [ commentObjects ]
      }
    ]
    mechanisms: [
      {
        source,target,name},
        comments: [ commentObjects ]
      }
    ]
    evidence: [
      {
        evId, propId, mechId, rsrcId, number, note,
        comments: [ commentObjects ]
      }
    ]
    def commentObject = { id, author, date, text, criteriaId, readBy }

  \*/

  let model = adm_db.a_models.find(model => model.id === 'mo01');
  model.data = {
    // components is a 'component' or a 'property' (if it has a parent)
    properties: [
      { id: 'tank', name: 'tank' },
      { id: 'fish', name: 'fish' },
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
        number: '1a',
        rating: 3,
        note: 'ghoti ghoti gothi need food',
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
          },
          {
            id: 3,
            author: 'Mary',
            date: new Date(),
            text: 'Something from another group',
            criteriaId: 'cr02',
            readBy: []
          }
        ]
      },
      {
        evId: 'ev3',
        propId: 'fish',
        mechId: undefined,
        rsrcId: 'rs2',
        number: '2a',
        rating: 2,
        note: 'fish need food'
      },
      {
        evId: 'ev2',
        propId: 'fish',
        mechId: undefined,
        rsrcId: 'rs1',
        number: '1b',
        rating: -3,
        note: 'fish need food'
      },
      {
        evId: 'ev4',
        propId: undefined,
        mechId: 'fish:food',
        rsrcId: 'rs1',
        number: '1c',
        rating: 3,
        note: 'fish need food'
      },
      {
        evId: 'ev5',
        propId: 'food',
        mechId: undefined,
        rsrcId: 'rs2',
        number: '2b',
        rating: 2,
        note: 'ammonia is bad'
      },
      {
        evId: 'ev6',
        propId: undefined,
        mechId: 'fish:food',
        rsrcId: 'rs2',
        number: '2c',
        rating: 1,
        note: 'ammonia is bad'
      },
      {
        evId: 'ev7',
        propId: undefined,
        mechId: 'fish:dirty-water-waste',
        rsrcId: 'rs2',
        number: '2d',
        rating: 1,
        note: 'ammonia is bad'
      }
    ],
    model: [
      {
        title: '',
        comments: []
      }
    ],
    commentThreads: [
      {
        id: 'tank',
        comments: [
          {
            id: 0,
            time: 0,
            author: 'Bob',
            date: new Date(),
            text: 'Tank you',
            criteriaId: 'cr01',
            readBy: ['Bob', 'Bill']
          },
          {
            id: 1,
            time: 10,
            author: 'Bill',
            date: new Date(),
            text: 'This tanks!',
            criteriaId: 'cr02',
            readBy: []
          }
        ]
      },
      {
        id: 'fish',
        comments: [
          {
            id: 0,
            time: 0,
            author: 'Bob',
            date: new Date(),
            text: 'I like this fish',
            criteriaId: 'cr01',
            readBy: ['Bob', 'Bill']
          },
          {
            id: 1,
            time: 10,
            author: 'Bill',
            date: new Date(),
            text: 'I DONT like this fish',
            criteriaId: 'cr02',
            readBy: []
          },
          {
            id: 2,
            time: 11,
            author: 'Mary',
            date: new Date(),
            text: 'This is not my fish!',
            criteriaId: 'cr02',
            readBy: []
          }
        ]
      },
      {
        id: 'fish:food',
        comments: [
          {
            id: 0,
            time: 0,
            author: 'Bill',
            date: new Date(),
            text: 'Fish food fish food',
            criteriaId: 'cr01',
            readBy: ['Bob', 'Bill']
          },
          {
            id: 1,
            time: 10,
            author: 'Bill',
            date: new Date(),
            text: 'Food fish food fish',
            criteriaId: 'cr02',
            readBy: []
          }
        ]
      },
      {
        id: 'fish:dirty-water-waste',
        comments: [
          {
            id: 0,
            time: 0,
            author: 'Bill',
            date: new Date(),
            text: 'Fish food fish poop',
            criteriaId: 'cr01',
            readBy: ['Bob', 'Bill']
          },
          {
            id: 1,
            time: 10,
            author: 'Bill',
            date: new Date(),
            text: 'Poop fish food fish',
            criteriaId: 'cr02',
            readBy: []
          }
        ]
      }
    ]
  };

  model = adm_db.a_models.find(model => model.id === 'mo02');
  model.data = {
    // components is a 'component' or a 'property' (if it has a parent)
    properties: [{ id: 'tank', name: 'tank' }, { id: 'fish', name: 'fish' }]
  };

  // return { d3data: { nodes, edges }, template: TEMPLATE };
  return adm_db;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: reset database from passed nodes, edges array
 */
DB.PKT_SetDatabase = pkt => {
  if (DBG) console.log(PR, `PKT_SetDatabase`);
  let { nodes = [], edges = [] } = pkt.Data();
  if (!nodes.length) console.log(PR, 'WARNING: empty nodes array');
  else console.log(PR, `setting ${nodes.length} nodes...`);
  if (!edges.length) console.log(PR, 'WARNING: empty edges array');
  else console.log(PR, `setting ${edges.length} edges...`);
  NODES.clear();
  NODES.insert(nodes);
  EDGES.clear();
  EDGES.insert(edges);
  console.log(PR, `PKT_SetDatabase complete. Data available on next get.`);
  m_db.close(() => {
    DB.InitializeDatabase();
    LOGGER.Write(pkt.Info(), `setdatabase`);
  });
  return { OK: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_GetNewNodeID = pkt => {
  m_max_nodeID += 1;
  if (DBG) console.log(PR, `PKT_GetNewNodeID ${pkt.Info()} nodeID ${m_max_nodeID}`);
  return { nodeID: m_max_nodeID };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_GetNewEdgeID = pkt => {
  m_max_edgeID += 1;
  if (DBG) console.log(PR, `PKT_GetNewEdgeID ${pkt.Info()} edgeID ${m_max_edgeID}`);
  return { edgeID: m_max_edgeID };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestLockNode = pkt => {
  let { nodeID } = pkt.Data();
  let errcode = m_IsInvalidNode(nodeID);
  if (errcode) return errcode;
  // check if node is already locked
  if (m_locked_nodes.has(nodeID)) return m_MakeLockError(`nodeID ${nodeID} is already locked`);
  // SUCCESS
  // single matching node exists and is not yet locked, so lock it
  m_locked_nodes.add(nodeID);
  return { nodeID, locked: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockNode = pkt => {
  let { nodeID } = pkt.Data();
  let errcode = m_IsInvalidNode(nodeID);
  if (errcode) return errcode;
  // check that node is already locked
  if (m_locked_nodes.has(nodeID)) {
    m_locked_nodes.delete(nodeID);
    return { nodeID, unlocked: true };
  }
  // this is an error because nodeID wasn't in the lock table
  return m_MakeLockError(`nodeID ${nodeID} was not locked so can't unlock`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_IsInvalidNode(nodeID) {
  if (!nodeID) return m_MakeLockError(`undefined nodeID`);
  nodeID = Number.parseInt(nodeID, 10);
  if (Number.isNaN(nodeID)) return m_MakeLockError(`nodeID was not a number`);
  if (nodeID < 0) return m_MakeLockError(`nodeID ${nodeID} must be positive integer`);
  if (nodeID > m_max_nodeID) return m_MakeLockError(`nodeID ${nodeID} is out of range`);
  // find if the node exists
  let matches = NODES.find({ id: nodeID });
  if (matches.length === 0) return m_MakeLockError(`nodeID ${nodeID} not found`);
  if (matches.length > 1)
    return m_MakeLockError(`nodeID ${nodeID} matches multiple entries...critical error!`);
  // no retval is no error!
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_MakeLockError(info) {
  return { NOP: `ERR`, INFO: info };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestLockEdge = pkt => {
  let { edgeID } = pkt.Data();
  let errcode = m_IsInvalidEdge(edgeID);
  if (errcode) return errcode;
  // check if edge is already locked
  if (m_locked_edges.has(edgeID)) return m_MakeLockError(`edgeID ${edgeID} is already locked`);
  // SUCCESS
  // single matching edge exists and is not yet locked, so lock it
  m_locked_edges.add(edgeID);
  return { edgeID, locked: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockEdge = pkt => {
  let { edgeID } = pkt.Data();
  let errcode = m_IsInvalidEdge(edgeID);
  if (errcode) return errcode;
  // check that edge is already locked
  if (m_locked_edges.has(edgeID)) {
    m_locked_edges.delete(edgeID);
    return { edgeID, unlocked: true };
  }
  // this is an error because nodeID wasn't in the lock table
  return m_MakeLockError(`edgeID ${edgeID} was not locked so can't unlock`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_IsInvalidEdge(edgeID) {
  if (!edgeID) return m_MakeLockError(`undefined edgeID`);
  edgeID = Number.parseInt(edgeID, 10);
  if (Number.isNaN(edgeID)) return m_MakeLockError(`edgeID was not a number`);
  if (edgeID < 0) return m_MakeLockError(`edgeID ${edgeID} must be positive integer`);
  if (edgeID > m_max_edgeID) return m_MakeLockError(`edgeID ${edgeID} is out of range`);
  // find if the node exists
  let matches = EDGES.find({ id: edgeID });
  if (matches.length === 0) return m_MakeLockError(`edgeID ${edgeID} not found`);
  if (matches.length > 1)
    return m_MakeLockError(`edgeID ${edgeID} matches multiple entries...critical error!`);
  // no retval is no error!
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockAllNodes = pkt => {
  m_locked_nodes = new Set();
  return { unlocked: true };
};
DB.PKT_RequestUnlockAllEdges = pkt => {
  m_locked_edges = new Set();
  return { unlocked: true };
};
DB.PKT_RequestUnlockAll = pkt => {
  m_locked_nodes = new Set();
  m_locked_edges = new Set();
  return { unlocked: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * data packet contains items that will be updated. either an individual node, edge,
 * or a nodeID with a replacement nodeID
 */
DB.PKT_Update = pkt => {
  let { node, edge, nodeID, edgeID } = pkt.Data();
  // PROCESS NODE INSERT/UPDATE
  if (node) return m_UpdateNode(node, pkt);
  if (edge) return m_UpdateEdge(edge, pkt);
  if (nodeID !== undefined) return m_DeleteNode(nodeID, pkt);
  if (edgeID !== undefined) return m_DeleteEdge(edgeID, pkt);
  // return update value
  return { op: 'error-noaction' };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_UpdateNode(node, pkt) {
  let retval = {};

  m_CleanObjID(`${pkt.Info()} node.id`, node);
  let matches = NODES.find({ id: node.id });
  if (matches.length === 0) {
    // if there was no node, then this is an insert new operation
    if (DBG) console.log(PR, `PKT_Update ${pkt.Info()} INSERT nodeID ${JSON.stringify(node)}`);
    LOGGER.Write(pkt.Info(), `insert node`, node.id, JSON.stringify(node));
    DB.AppendNodeLog(node, pkt); // log GroupId to node stored in database
    NODES.insert(node);
    retval = { op: 'insert', node };
  } else if (matches.length === 1) {
    // there was one match to update
    NODES.findAndUpdate({ id: node.id }, n => {
      if (DBG)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} UPDATE nodeID ${node.id} ${JSON.stringify(node)}`
        );
      LOGGER.Write(pkt.Info(), `update node`, node.id, JSON.stringify(node));
      DB.AppendNodeLog(n, pkt); // log GroupId to node stored in database
      Object.assign(n, node);
    });
    retval = { op: 'update', node };
  } else {
    if (DBG) console.log(PR, `WARNING: multiple nodeID ${node.id} x${matches.length}`);
    LOGGER.Write(pkt.Info(), `ERROR`, node.id, 'duplicate node id');
    retval = { op: 'error-multinodeid' };
  }
  return retval;
} // updatenode
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_UpdateEdge(edge, pkt) {
  let retval = {};
  // PROCESS EDGE INSERT/UPDATE
  m_CleanObjID(`${pkt.Info()} edge.id`, edge);
  let matches = EDGES.find({ id: edge.id });
  if (matches.length === 0) {
    // this is a new edge
    if (DBG)
      console.log(PR, `PKT_Update ${pkt.Info()} INSERT edgeID ${edge.id} ${JSON.stringify(edge)}`);
    LOGGER.Write(pkt.Info(), `insert edge`, edge.id, JSON.stringify(edge));
    DB.AppendEdgeLog(edge, pkt); // log GroupId to edge stored in database
    EDGES.insert(edge);
    retval = { op: 'insert', edge };
  } else if (matches.length === 1) {
    // update this edge
    EDGES.findAndUpdate({ id: edge.id }, e => {
      if (DBG)
        console.log(
          PR,
          `PKT_Update ${pkt.SourceGroupID()} UPDATE edgeID ${edge.id} ${JSON.stringify(edge)}`
        );
      LOGGER.Write(pkt.Info(), `update edge`, edge.id, JSON.stringify(edge));
      DB.AppendEdgeLog(e, pkt); // log GroupId to edge stored in database
      Object.assign(e, edge);
    });
    retval = { op: 'update', edge };
  } else {
    console.log(PR, `WARNING: multiple edgeID ${edge.id} x${matches.length}`);
    LOGGER.Write(pkt.Info(), `ERROR`, edge.id, 'duplicate edge id');
    retval = { op: 'error-multiedgeid' };
  }
  return retval;
} // update edge
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_DeleteNode(nodeID, pkt) {
  // DELETE NODE
  nodeID = m_CleanID(`${pkt.Info()} nodeID`, nodeID);
  if (DBG) console.log(PR, `PKT_Update ${pkt.Info()} DELETE nodeID ${nodeID}`);
  // Log first so it's apparent what is triggering the edge changes
  LOGGER.Write(pkt.Info(), `delete node`, nodeID);

  // handle edges
  let edgesToProcess = EDGES.where(e => {
    return e.source === nodeID || e.target === nodeID;
  });

  // handle linked nodes
  let { replacementNodeID } = pkt.Data();
  replacementNodeID = m_CleanID(`${pkt.Info()} replacementNodeID`, replacementNodeID);
  if (replacementNodeID !== -1) {
    // re-link edges to replacementNodeID...
    EDGES.findAndUpdate({ source: nodeID }, e => {
      LOGGER.Write(pkt.Info(), `relinking edge`, e.id, `to`, replacementNodeID);
      e.source = replacementNodeID;
    });
    EDGES.findAndUpdate({ target: nodeID }, e => {
      LOGGER.Write(pkt.Info(), `relinking edge`, e.id, `to`, replacementNodeID);
      e.target = replacementNodeID;
    });
  } else {
    // ... or delete edges completely
    let sourceEdges = EDGES.find({ source: nodeID });
    EDGES.findAndRemove({ source: nodeID });
    if (sourceEdges.length)
      LOGGER.Write(pkt.Info(), `deleting ${sourceEdges.length} sources matching ${nodeID}`);
    let targetEdges = EDGES.find({ target: nodeID });
    EDGES.findAndRemove({ target: nodeID });
    if (targetEdges.length)
      LOGGER.Write(pkt.Info(), `deleting ${targetEdges.length} targets matching ${nodeID}`);
  }
  // ...finally remove the node itself
  NODES.findAndRemove({ id: nodeID });
  return { op: 'delete', nodeID, replacementNodeID };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_DeleteEdge(edgeID, pkt) {
  edgeID = m_CleanID(`${pkt.Info()} edgeID`, edgeID);
  if (DBG) console.log(PR, `PKT_Update ${pkt.Info()} DELETE edgeID ${edgeID}`);
  LOGGER.Write(pkt.Info(), `delete edge`, edgeID);
  EDGES.findAndRemove({ id: edgeID });
  return { op: 'delete', edgeID };
}

/// NODE ANNOTATION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** write/remove packet SourceGroupID() information into the node before writing
  the first entry is the insert, subsequent operations are updates
 */
DB.AppendNodeLog = (node, pkt) => {
  if (!node._nlog) node._nlog = [];
  let gid = pkt.SourceGroupID() || pkt.SourceAddress();
  node._nlog.push(gid);
  if (DBG) {
    let out = '';
    node._nlog.forEach(el => {
      out += `[${el}] `;
    });
    console.log(PR, 'nodelog', out);
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** */
DB.FilterNodeLog = node => {
  let newNode = Object.assign({}, node);
  Reflect.deleteProperty(newNode, '_nlog');
  return newNode;
};
/// EDGE ANNOTATION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** write/remove packet SourceGroupID() information into the node before writing
 * the first entry is the insert, subsequent operations are updates
 */
DB.AppendEdgeLog = (edge, pkt) => {
  if (!edge._elog) edge._elog = [];
  let gid = pkt.SourceGroupID() || pkt.SourceAddress();
  edge._elog.push(gid);
  if (DBG) {
    let out = '';
    edge._elog.forEach(el => {
      out += `[${el}] `;
    });
    console.log(PR, 'edgelog', out);
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *
 */
DB.FilterEdgeLog = edge => {
  let newEdge = Object.assign({}, edge);
  Reflect.deleteProperty(newEdge, '_elog');
  return newEdge;
};

/// JSON EXPORT ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called by brunch to generate an up - to - date JSON file to path.
 * creates the path if it doesn't exist
 */
DB.WriteDbJSON = filePath => {
  let dataset = DB_CONFIG.dataset;

  // Ideally we should use m_otions value, but in standlone mode,
  // m_options might not be defined.
  let db_file = m_options ? m_options.db_file : m_GetValidDBFilePath(dataset);
  let db = new Loki(db_file, {
    autoload: true,
    autoloadCallback: () => {
      if (typeof filePath === 'string') {
        if (DBG) console.log(PR, `writing { nodes, edges } to '${filePath}'`);
        let nodes = db
          .getCollection('nodes')
          .chain()
          .data({ removeMeta: true });
        let edges = db
          .getCollection('edges')
          .chain()
          .data({ removeMeta: true });
        let data = { nodes, edges };
        let json = JSON.stringify(data);
        if (DBG) console.log(PR, `ensuring DIR ${PATH.dirname(filePath)}`);
        FS.ensureDirSync(PATH.dirname(filePath));
        if (DBG) console.log(PR, `writing file ${filePath}`);
        FS.writeFileSync(filePath, json);
        console.log(PR, `*** WROTE JSON DATABASE ${filePath}`);
      } else {
        console.log(PR, `ERR path ${filePath} must be a pathname`);
      }
    }
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called by brunch to generate an up - to - date Template file to path.
 * creates the path if it doesn't exist
 */
DB.WriteTemplateJSON = filePath => {
  let templatePath = `${RUNTIMEPATH + DB_CONFIG.dataset}.template`;
  FS.ensureDirSync(PATH.dirname(templatePath));
  // Does the template exist?
  if (!FS.existsSync(templatePath)) {
    console.error(PR, `ERR could not find template ${templatePath}`);
  } else {
    FS.copySync(templatePath, filePath);
    console.log(PR, `*** COPIED TEMPLATE ${templatePath} to ${filePath}`);
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// utility function for cleaning nodes with numeric id property
function m_CleanObjID(prompt, obj) {
  if (typeof obj.id === 'string') {
    let int = parseInt(obj.id, 10);
    LOGGER.Write(PR, `! ${prompt} "${obj.id}" is string; converting to ${int}`);
    obj.id = int;
  }
  return obj;
}
function m_CleanEdgeEndpoints(prompt, edge) {
  if (typeof edge.source === 'string') {
    let int = parseInt(edge.source, 10);
    LOGGER.Write(PR, `  edge ${prompt} source "${edge.source}" is string; converting to ${int}`);
    edge.source = int;
  }
  if (typeof edge.target === 'string') {
    let int = parseInt(edge.target, 10);
    LOGGER.Write(PR, `  edge ${prompt} target "${edge.target}" is string; converting to ${int}`);
    edge.target = int;
  }
  return edge;
}
function m_CleanID(prompt, id) {
  if (typeof id === 'string') {
    let int = parseInt(id, 10);
    LOGGER.Write(PR, `! ${prompt} "${id}" is string; converting to number ${int}`);
    id = int;
  }
  return id;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a root word, create a full pathname to .loki file in the runtime path.
 * Makes sure that the passed pathname allows only alphanumeric characters with
 * some special characters
 */
function m_GetValidDBFilePath(dataset) {
  // validate dataset name
  let regex = /^([A-z0-9-_+./])*$/; // Allow _ - + . /, so nested pathways are allowed
  if (!regex.test(dataset)) {
    console.error(PR, `Trying to initialize database with bad dataset name: ${dataset}`);
  }

  return `${RUNTIMEPATH}/dataset.loki`;
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
module.exports = DB;
