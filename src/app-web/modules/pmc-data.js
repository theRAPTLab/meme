import { Graph, alg as GraphAlg, json as GraphJSON } from '@dagrejs/graphlib';
import { cssinfo, cssreset, cssdata } from './console-styles';
import DEFAULTS from './defaults';
import DATAMAP from '../../system/common-datamap';
import UR from '../../system/ursys';
import VM from './vm-data';
import UTILS from './utils';
import ASET from './adm-settings';

const { CoerceToPathId, CoerceToEdgeObj } = DEFAULTS;

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @module PMCData
 * @desc
 * A centralized data manager for graph data consisting of MEME properties and
 * mechanisms. Also provides derived structures used for building view models
 * for the user interface.
 *
 * NOTE: `nodeId` (used by graphlib natively) corresponds to a PMC Property
 * `propId` and visual prop `vpropId`. They all map to the same value
 * NODE: `edgeObj` (used by graphlib natively) contains two nodeIds that
 * collectively refer to a particular PMC Mechanism `mechId`. See below for
 * more info about the data structure.
 *
 * The model, viewmodel, and view data elements all use the same kinds of id.
 * For properties and components, a string `nodeId` is used. For mechanisms
 * connecting properties, a string `pathId` consisting of the form
 * `sourcetNodeId:targetNodeId` is used internally. However, mechanism-related
 * API methods also accept dagres/graphlib's native `edgeObj` and `w,v`
 * syntax as well.
 *
 * ADDITIONAL NOTES FROM BEN (WIP):
 *
 * resourceItems -- resourceItems refer to the information resources, such as
 * simulations and reports, that students use as evidence for their models.
 * They are considered "facts" rather than "interpretations", so they are not
 * in themselves considered evidence until some connection is made to a model.
 * The interpreation is embodied by the evidence link.
 * `referenceLabel` is the human-readable footnote-like reference number for the
 * resource.  e.g. this way you can refer to "resource 1".
 *
 * evidenceLink -- evidenceLinks are core objects that connect components or
 * properties or mechanisms to resources.  There may be multiple connections
 * between any component/property/mechanism and any resourceItem.  The
 * structure is:
 *  `{ evId: 'ev1', propId: 'a', mechId: 'a', rsrcId: 'rs1', note: 'fish need food' })`
 * where `evId` is the evidenceLink id
 *       `propId` is the property id
 *       `mechId` is the mechanism id, e.g. 'ammonia:fish'
 *       `rsrcId` is the resourceItem id
 *       `note` is a general text field for the student to enter an explanation
 * Since an evidence link can be connected either a prop or a mechanism, the
 * one not used just remains undefined.
 *
 * @example TO USE MODULE
 * import PMCData from `../modules/pmc-data`;
 * console.log(PMCData.Graph())
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PMCData = {};

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'PMCDATA';

/// MODEL /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_graph; // dagresjs/graphlib instance
let a_props = []; // all properties (strings)
let a_mechs = []; // all mechanisms (pathId strings)
let a_commentThreads = []; // all prop and mech comments
//
let a_components = []; // top-level props with no parents, derived
let h_children = new Map(); // children hash of each prop by id (string)
let h_outedges = new Map(); // outedges hash of each prop by id
//
let a_resources = []; // resource objects { id, label, notes, type, url, links }
let a_evidence = []; // evidence objects { id, propId, rsrcId, note }
let h_evidenceById = new Map(); // evidence object for each id (lookup table)
let h_evidenceByProp = new Map(); // evidence object array associated with each prop
let h_evidenceByResource = new Map(); // evidence id array associated with each resource
let h_evidenceByMech = new Map(); // links to evidence by mechanism id
let h_propByResource = new Map(); // hash of props to a given resource
let h_mechByResource = new Map(); // hash of mechs to a given resource

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: DATASTORE:
 * Returns the raw object database, which is an instance of Graphlib
 * @returns {Graph} - GraphlibJS object
 * @example
 * const model = PMCData.Graph();
 * const edges = model.edges();
 * console.log(`there are ${edges.length} edges in the graph!`);
 */
PMCData.Graph = () => {
  return m_graph;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Clears all model data in preparation for loading a new model
 */
PMCData.ClearModel = () => {
  a_props = [];
  a_mechs = [];
  a_commentThreads = [];
  a_resources = [];
  a_evidence = [];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Loads a graph from model data and saves a local copy.  Replaces PMCData.LoadGraph.
 * This will self repair bad data, but model.id and model.groupID MUST be defined.
 * This should be only be called by ADMData.InitializeModel().
 * NEVER CALL THIS FUNCTION DIRECTLY
 */
PMCData.InitializeModel = (model, admdb) => {
  const g = new Graph({ directed: true, compound: true, multigraph: true });
  if (!admdb) console.error(`PMCData.InitializeModel() arg2 must be an instance of adm_db`);

  const { id, groupId, pmcDataId } = model;
  if (id === undefined || groupId === undefined || pmcDataId === undefined) {
    console.error(
      `PMCData.InitializeModel called with either bad id (${id}) or bad groupId (${groupId}) or bad pmcDataId (${pmcDataId})`
    );
  }

  // get essentials
  const { resources, pmcData } = admdb;

  // Resources
  a_resources = resources || [];

  /*/
  The model data format changed in october 2019 to better separate pmcdata from model
  adm_db.models contain model objects that formerly contained a .data prop which has
  been replaced with a .pmcDataId prop that refers to the actual data stored in
  the 'pmcData' collection.

  To avoid a rewrite, this code has been modified to produce the original structure,
  by model.data = pmcData[pmcDataId]
  /*/

  const data = pmcData.find(data => data.id === pmcDataId);
  if (DBG) console.log('loaded data', data);
  if (DBG) console.log('data.entities start processing');
  if (data.entities)
    data.entities.forEach(obj => {
      if (DBG) console.log(obj.type, obj.id, obj);
      switch (obj.type) {
        case 'prop':
          g.setNode(obj.id, {
            name: obj.name,
            description: obj.description
          });
          if (obj.parent) {
            g.setParent(obj.id, obj.parent);
          }
          break;
        case 'mech':
          if (obj.source && obj.target)
            g.setEdge(obj.source, obj.target, {
              id: obj.id,
              name: obj.name,
              description: obj.description
            });
          break;
        case 'evidence':
          obj.comments = obj.comments || [];
          a_evidence.push(obj);
          break;
        default:
          console.error('PMCData.InitializeModel could not map unknown type', obj);
      }
    });
  if (DBG) console.log('data.entities processed');

  // Comments
  // Clean up data: Make sure refIds are strings.
  if (data.commentThreads) {
    a_commentThreads = data.commentThreads.map(c => {
      return Object.assign({ refId: String(c.refId) }, c);
    });
  } else {
    a_commentThreads = [];
  }

  // test serial write out, then serial read back in
  // this doesn't do anything other than ensure data
  // format is OK (and to remind me that we can do this)
  const cleanGraphObj = GraphJSON.write(g);
  const json = JSON.stringify(cleanGraphObj);
  m_graph = GraphJSON.read(JSON.parse(json));
  // MONKEY PATCH graphlib so it doesn't use ancient lodash _.keys()
  // command, which converts numbers to string.
  m_graph.nodes = () => Object.keys(m_graph._nodes);

  // update the essential data structures
  // this also fires DATA_UPDATED
  PMCData.BuildModel();

  // data and view are now stable
  // on first load, move visuals to saved places
  if (data.visuals) {
    data.visuals.forEach(vstate => {
      const id = String(vstate.id);
      const pos = vstate.pos;
      const vprop = VM.VM_VProp(id);
      // only position components, not props
      // because visuals array doesn't remove stuff
      if (PMCData.PropParent()) return;
      if (!vprop) {
        if (DBG) console.warn(`InitializeModel data.visuals: skipping missing prop ${id}`);
        return;
      }
      if (DBG) console.log(`init vprop ${id} to ${pos.x}, ${pos.y}`);
      vprop.Move(pos);
      vprop.LayoutDisabled(true);
    });
    UR.Publish('PROP_MOVED', { visuals: data.visuals });
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** URSYS: DATABASE SYNC
 * Receive a list of ONLY changed objects to the specified collections so
 * adm_db can be updated in a single place. Afterwards, fire any necessary
 * UPDATE or BUILD or SELECT.
 * See common-datamap.js for the collection keys itemized in DBKEYS. Called from
 * data.js.
 * @param {Object} data - a collection object
 */
PMCData.SyncAddedData = data => {
  const syncitems = DATAMAP.ExtractSyncData(data);
  syncitems.forEach(item => {
    const { colkey, subkey, value } = item;
    if (DBG) console.log('added', colkey, subkey || '', value);

    if (subkey === 'entities') {
      switch (value.type) {
        case 'prop':
          m_graph.setNode(value.id, {
            name: value.name,
            description: value.description
          });
          f_NodeSetParent(value.id, value.parent); // enforces type
          break;
        case 'mech':
          m_graph.setEdge(value.source, value.target, {
            id: value.id,
            name: value.name,
            description: value.description
          });
          break;
        case 'evidence':
          const { id, propId, mechId, rsrcId, numberLabel, rating, note } = value;
          a_evidence.push({
            id,
            propId,
            mechId,
            rsrcId,
            numberLabel,
            rating,
            note
          });
          break;
        default:
          throw Error('unexpected proptype');
      }
      PMCData.BuildModel();
    }

    if (subkey === 'commentThreads') {
      const { id, refId, comments } = value;
      const thread = { id, refId, comments };
      a_commentThreads.push(thread);
      UR.Publish('DATA_UPDATED');
    }
  });

  // old way
  // if (data['pmcData']) console.log('PMCData add');
  // if (data['pmcData.entities']) console.log('PMCData.entities add');
  // if (data['pmcData.commentThreads']) console.log('PMCData.commentThreads add');
  // do stuff here

  // can add better logic to avoid updating too much
  // PMCData.BuildModel();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SyncUpdatedData = data => {
  const syncitems = DATAMAP.ExtractSyncData(data);
  syncitems.forEach(item => {
    const { colkey, subkey, value } = item;
    if (DBG) console.log('updated', colkey, subkey || '', value);

    if (subkey === 'entities') {
      // has id, type, name
      switch (value.type) {
        case 'prop':
          m_graph.setNode(value.id, {
            name: value.name,
            description: value.description
          });
          f_NodeSetParent(value.id, value.parent);
          break;
        case 'mech':
          // 1. Remove the old edge first.
          const oldMechPathObj = PMCData.MechById(value.id);
          m_graph.removeEdge(oldMechPathObj);

          // 2. Then create the updated edge as a new edge
          m_graph.setEdge(value.source, value.target, {
            id: value.id,
            name: value.name,
            description: value.description
          });
          break;
        case 'evidence':
          const { id, propId, mechId, rsrcId, numberLabel, rating, note } = value;
          const evlink = {
            id,
            propId,
            mechId,
            rsrcId,
            numberLabel,
            rating,
            note
          };
          const i = a_evidence.findIndex(e => e.id === id);
          a_evidence.splice(i, 1, evlink);
          break;
        default:
          throw Error('unexpected proptype');
      }
      PMCData.BuildModel();
    }

    if (subkey === 'commentThreads') {
      const { id, refId, comments } = value;
      const newThread = { id, refId, comments };
      const i = a_commentThreads.findIndex(c => c.refId === refId);
      if (i < 0) throw Error('Trying to update non-existent commentThread');
      const oldThread = a_commentThreads[i];
      const thread = Object.assign(oldThread, newThread);
      a_commentThreads.splice(i, 1, thread);
      UR.Publish('DATA_UPDATED');
    }
  }); // syncitems
  if (DBG && data['pmcData.commentThreads']) console.log('PMCData.commentThreads update');
  // do stuff here

  // can add better logic to avoid updating too much
  // PMCData.BuildModel();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SyncRemovedData = data => {
  const syncitems = DATAMAP.ExtractSyncData(data);
  syncitems.forEach(item => {
    const { colkey, subkey, value } = item;
    if (DBG) console.log('removed', colkey, subkey || '', value);

    if (subkey === 'entities') {
      // has id, type, name
      switch (value.type) {
        case 'prop':
          m_graph.removeNode(value.id);
          break;
        case 'mech':
          m_graph.removeEdge(value.source, value.target);
          break;
        case 'evidence':
          let i = a_evidence.findIndex(e => e.id === value.id);
          a_evidence.splice(i, 1);
          break;
        default:
          throw Error('unexpected proptype');
      }
      PMCData.BuildModel();
    }
  });
  // oldway
  // if (data['pmcData']) console.log('PMCData remove');
  // if (data['pmcData.entities']) console.log('PMCData.entities remove');
  // if (data['pmcData.commentThreads']) console.log('PMCData.commentThreads remove');
  // // do stuff here

  // can add better logic to avoid updating too much
  // PMCData.BuildModel();
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** SyncData Utility Function.
 *  Handles the case where parent may be undefined, and we still want to set it
 */
function f_NodeSetParent(nodeId, parent) {
  let value = parent;
  if (value === null) value = undefined;
  if (typeof value === 'string') value = Number(value);
  m_graph.setParent(nodeId, value);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Builds the PROPS, MECHS, COMPONENTS, CHILDREN, and OUTEDGES lists
 *  from the raw GraphLibJS data store.
 */
PMCData.BuildModel = () => {
  // test graphlib
  a_props = m_graph.nodes(); // returns numeric node ids
  a_mechs = m_graph.edges(); // returns edgeObjects {v,w}
  a_components = [];
  h_children = new Map(); // property children
  h_outedges = new Map(); // outedges for each prop
  /*/
   *  a_components is an array of ids of top-level props
   *  h_children maps prop ids to arrays of ids of child props,
   *  including children of children
   *  h_outedges maps all the outgoing edges for a node
  /*/
  a_props.forEach(n => {
    const p = m_graph.parent(n);
    if (!p) {
      a_components.push(n);
    }
    //
    const children = m_graph.children(n);
    let arr = h_children.get(n);
    if (arr) arr.push.apply(children);
    else h_children.set(n, children);
    //
    const outedges = m_graph.outEdges(n); // an array of edge objects {v,w,name}
    arr = h_outedges.get(n) || [];
    outedges.forEach(key => {
      arr.push(key.w);
    });
    h_outedges.set(n, arr);
  });

  /*/
   *  Update h_evidenceById table
  /*/
  h_evidenceById = new Map();
  a_evidence.forEach(ev => {
    h_evidenceById.set(ev.id, ev);
  });

  /*/
   *  Update h_evidenceByProp table
  /*/
  h_evidenceByProp = new Map();
  a_evidence.forEach(ev => {
    if (ev.propId === undefined) return; // Not a prop ev link
    let evidenceLinkArray = h_evidenceByProp.get(ev.propId);
    if (evidenceLinkArray === undefined) evidenceLinkArray = [];
    if (!evidenceLinkArray.includes(ev.propId)) evidenceLinkArray.push(ev);
    h_evidenceByProp.set(ev.propId, evidenceLinkArray);
  });

  /*/
   *  Update h_evidenceByMech table
  /*/
  h_evidenceByMech = new Map();
  a_evidence.forEach(ev => {
    let mechId = ev.mechId;
    if (mechId === undefined) return; // not a mech ev link
    let evidenceLinkArray = h_evidenceByMech.get(mechId); // any existing?
    if (evidenceLinkArray === undefined) evidenceLinkArray = []; // new
    if (!evidenceLinkArray.includes(mechId)) evidenceLinkArray.push(ev);
    h_evidenceByMech.set(mechId, evidenceLinkArray);
  });

  /*/
   *  Update h_propByResource lookup table to
   *  look up props that are linked to a particular piece of evidence
  /*/
  h_propByResource = new Map();
  h_evidenceByProp.forEach((evArr, propId) => {
    if (evArr) {
      evArr.forEach(ev => {
        let propIds = h_propByResource.get(ev.rsrcId);
        if (propIds === undefined) propIds = [];
        if (!propIds.includes(propId)) propIds.push(propId);
        h_propByResource.set(ev.rsrcId, propIds);
      });
    }
  });

  /*/
   *  Update h_propByResource lookup table to
   *  look up props that are linked to a particular piece of evidence
  /*/
  h_mechByResource = new Map();
  h_evidenceByMech.forEach((evArr, mechId) => {
    if (evArr) {
      evArr.forEach(ev => {
        let mechIds = h_mechByResource.get(ev.rsrcId);
        if (mechIds === undefined) mechIds = [];
        if (!mechIds.includes(mechId)) mechIds.push(mechId);
        h_mechByResource.set(ev.rsrcId, mechIds);
      });
    }
  });

  /*/
   *  Used by EvidenceList to look up all evidence related to a resource
  /*/
  h_evidenceByResource = new Map();
  a_resources.forEach(resource => {
    let evlinkArray = a_evidence.filter(evlink => evlink.rsrcId === resource.id);
    if (evlinkArray === undefined) evlinkArray = [];
    h_evidenceByResource.set(resource.id, evlinkArray);
  });

  /*/
   *  Now update all evidence link counts
  /*/
  a_resources.forEach(resource => {
    let props = h_propByResource.get(resource.id);
    if (props) {
      resource.links = props.length;
    } else {
      resource.links = 0;
    }
    let mechs = h_mechByResource.get(resource.id);
    if (mechs) {
      resource.links += mechs.length;
    }
  });
  UR.Publish('DATA_UPDATED');

  if (!DBG) return;
  console.groupCollapsed('%cBuildModel()%c Nodes and Edges', cssinfo, cssreset);
  console.log(`arry a_components`, a_components);
  console.log(`hash h_children`, h_children);
  console.log(`hash h_outedges`, h_outedges);
  console.groupEnd();
};

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Return array of all the properties of the PMC model. Note that a PMC
 *  component is just a property that isn't a child of any other property.
 *  @returns {array} - array of nodeId strings
 */
PMCData.AllProps = () => {
  return a_props;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Return array of all the mechanisms of the PMC model.
 *  @returns {array} - array of pathId strings "sourceid:targetid"
 */
PMCData.AllMechs = () => {
  return a_mechs;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Return array of all the components of the PMC model. Note that a PMC
 *  component is just a property (node) that isn't a child of another property.
 *  @returns {array} - array of nodeId strings
 */
PMCData.Components = () => {
  return a_components;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Return array of all the children.
 *  @param {String} nodeId - the nodeId that might have children
 *  @returns {Array} - an array of nodeId strings, or empty array
 */
PMCData.Children = nodeId => {
  if (typeof nodeId !== 'string') throw Error('PMCData.Children expected a string id');
  return h_children.get(nodeId) || [];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Returns TRUE if the passed nodeId exists in the graph data store
 *  @param {string} nodeId - the nodeId to test
 *  @returns {boolean} - true if the nodeId exists
 */
PMCData.HasProp = nodeId => {
  return m_graph.hasNode(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Returns TRUE if the passed edge exists. This function can accept one of
 *  three formats: an edgeObject, a pathId, or a source/target pair of nodeId strings
 *  @param {object|string} evo - edgeObj {w,v}, pathId, or nodeId string of source
 *  @param {string|undefined} ew - if defined, nodeId string of the target prop
 *  @returns {boolean} - true if the the edge exists
 */
PMCData.HasMech = (evo, ew) => {
  const eobj = CoerceToEdgeObj(evo, ew);
  return m_graph.hasEdge(eobj);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed nodeId string, returns the requested property object.
 *  This object is not a copy, so changing its properties will change the
 *  underlying data. If it the requested nodeId doesn't exist, an error is
 *  thrown.
 *  @param {string} nodeId - the nodeId you want
 *  @returns {object} - the property object
 */
PMCData.Prop = nodeId => {
  const prop = m_graph.node(nodeId);
  if (prop) return prop;
  console.error(`no prop with id '${nodeId}' typeof ${typeof nodeId} exists`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed nodeId string, returns the parent nodeId if it exists
 *  or undefined if it does not.
 *  This object is not a copy, so changing its properties will change the
 *  underlying data. If it the requested nodeId doesn't exist, an error is
 *  thrown.
 *  @param {string} nodeId - the nodeId you want
 *  @returns {boolean} - the property object
 */
PMCData.PropParent = nodeId => {
  return m_graph.parent(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed edge selector, returns the requested mechanism object.
 *  This object is not a copy, so changing it will change the
 *  underlying data. If it the requested edge doesn't exist, an error is
 *  thrown.
 *
 *  This function can accept one of three formats: an edgeObject, a pathId,
 *  or a source/target pair of nodeId strings.
 *  @param {object|string} evo - edgeObj {v,w}, pathId, or nodeId string of source
 *  @param {string|undefined} ew - if defined, nodeId string of the target prop
 */
PMCData.Mech = (evo, ew) => {
  const eobj = CoerceToEdgeObj(evo, ew);
  return m_graph.edge(eobj);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Return the mech pathObj matching the db id.
 *  This is necessary during SyncUpdateData to remove an old edge that has
 *  changed its source/target (since the old source/target path is not known
 *  to SyncUpdateData).
 * 
 *  An alternative approach would be to trigger a deletion in MechUpdate, but
 *  that would cause another server roundtrip.
 * 
 *  @param {Integer} id - The mech id of the db record (not a pathId)
 *  @return {Object} A pathObj {v,w}}
 */
PMCData.MechById = id => {
  const all_mechs = PMCData.AllMechs();
  return all_mechs.find(pathObj => {
    const edgeAttr = PMCData.Mech(pathObj);
    if (edgeAttr.id === id) return pathObj;
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  @param {Object} newPropObj - {name, description, parent} for the property
 */
PMCData.PMC_PropAdd = newPropObj => {
  const modelId = ASET.selectedModelId;
  const propObj = Object.assign(newPropObj, { type: 'prop' });
  UTILS.RLog(
    'PropertyAdd',
    newPropObj.name,
    newPropObj.description,
    newPropObj.parent ? `with parent ${newPropObj.parent}` : ''
  );
  return UR.DBQuery('add', {
    'pmcData.entities': {
      id: modelId,
      entities: propObj
    }
  });
  // round-trip will call BuildModel() for us

  /** OLD STUFF
  // FIXME
  // Temporarily insert a random numeric prop id
  // This will get replaced with a server promise once that's implemented
  const propId = Math.trunc(Math.random() * 10000000000).toString();
  m_graph.setNode(propId, { name });
  PMCData.BuildModel();
  UTILS.RLog('PropertyAdd', name);
  return `added node:name ${name}`;
  **/
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** update through database
 *  @param {Integer} propId - id of the prop being updated
 *  @param {Object} newData - propObject, could be partial, e.g. just {name}
 */
PMCData.PMC_PropUpdate = (propId, newData) => {
  let numericId = propId;
  if (typeof propId !== 'number') {
    if (DBG)
      console.log(
        'PMCData.PMC_PropUpdate expected Number but got',
        typeof propId,
        propId,
        '!  Coercing to Number!  Review the calling function to see why non-Number was passed.'
      );
    numericId = Number(propId);
  }
  if (!DATAMAP.IsValidId(numericId)) throw Error('invalid id');
  const prop = m_graph.node(numericId);
  // make a copy of the prop with overwritten new data
  // local data will be updated on DBSYNC event, so don't write it here
  const propData = Object.assign(prop, newData, { id: numericId }); // id last to make sure we're using a cleaned one
  const modelId = ASET.selectedModelId;
  // we need to update pmcdata which looks like
  // { id, entities:[ { id, name } ] }
  return UR.DBQuery('update', {
    'pmcData.entities': {
      id: modelId,
      entities: propData
    }
  });
  // round-trip will call BuildModel() for us

  /** THIS METHOD DID NOT EXIST BEFORE **/
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  @param {Integer} propId - id of the prop being updated
 * */
PMCData.PMC_PropDelete = propId => {
  let numericId = propId;
  if (typeof propId !== 'number') {
    if (DBG)
      console.log(
        'PMCData.PMC_PropDelete expected Number but got',
        typeof propId,
        propId,
        '!  Coercing to Number!  Review the calling function to see why non-Number was passed.'
      );
    numericId = Number(propId);
  }
  if (!DATAMAP.IsValidId(numericId)) throw Error('invalid id');

  // 1. Deselect the prop first, otherwise the deleted prop will remain selected
  VM.VM_DeselectAll();

  // 2. Unlink any evidence (don't delete them)
  PMCData.PMC_GetEvLinksByPropId(numericId).forEach(evlink => {
    PMCData.SetEvidenceLinkPropId(evlink.id, undefined);
  });

  // 3. Unlink any related mechs
  PMCData.AllMechs().forEach(mid => {
    if (mid.v === String(numericId) || mid.w === String(numericId)) {
      PMCData.PMC_MechDelete(mid);
    }
  });

  // 4. Delete any comments?
  // We don't need to update commentThreads since they are
  // retrieved by their parent objects?

  // 5. Delete any children
  // h_children uses string ids
  PMCData.Children(String(numericId)).forEach(cid => PMCData.PMC_PropDelete(Number(cid)));

  // 6. Log it
  UTILS.RLog('PropertyDelete', propId);

  // 7. Remove the actual prop
  const modelId = ASET.selectedModelId;
  return UR.DBQuery('remove', {
    'pmcData.entities': {
      id: modelId,
      entities: { id: propId }
    }
  });

  /** OLD CODE
  // Deselect the prop first, otherwise the deleted prop will remain selected
  VM.VM_DeselectAll();
  // Unlink any evidence
  const evlinks = PMCData.PMC_GetEvLinksByPropId(propId);
  if (evlinks)
    evlinks.forEach(evlink => {
      PMCData.SetEvidenceLinkPropId(evlink.id, undefined);
    });
  // Delete any children nodes
  const children = PMCData.Children(propId);
  if (children)
    children.forEach(cid => {
      PMCData.PMC_SetPropParent(cid, undefined);
    });
  // Then remove propId
  m_graph.removeNode(propId);
  PMCData.BuildModel();
  UTILS.RLog('PropertyDelete', propId);
  return `deleted propId ${propId}`;
  **/
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return true if the prop designated by propId has a parent that is
 *  different than newParentId
 */
PMCData.PMC_IsDifferentPropParent = (propId, newParentId) => {
  return PMCData.PropParent(propId) !== newParentId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_SetPropParent = (nodeId, parentId) => {
  // NOTE: a parentId of value of 'undefined' because that's how
  // graphlib removes a parent from a node
  if (!PMCData.PMC_IsDifferentPropParent(nodeId, parentId)) return;
  // REVIEW/FIXME: Is this coercion necessary once we convert to ints?
  const id = Number(nodeId);
  const pid = Number(parentId);
  UTILS.RLog('PropertySetParent', id, pid);
  return PMCData.PMC_PropUpdate(id, { parent: pid }).then(rdata => {
    if (DBG) console.log('PropUpdate', JSON.stringify(rdata['pmcData.entities']));
  });

  // round-trip will call BuildModel() for us
  /** OLD CODE
  m_graph.setParent(nodeId, parentId);
  PMCData.BuildModel();
  UTILS.RLog('PropertySetParent', nodeId, parent);
  return `set parentId ${parentId} to node ${nodeId}`;
  **/
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_MechAdd = (sourceId, targetId, label, description) => {
  if (DBG) {
    if (typeof sourceId !== 'number')
      console.log('coercing sourceId to Number from', typeof sourceId);
    if (typeof targetId !== 'number')
      console.log('coercing targetId to Number from', typeof targetId);
  }
  const modelId = ASET.selectedModelId;
  const mechObj = {
    type: 'mech',
    name: label,
    source: Number(sourceId),
    target: Number(targetId),
    description
  };
  return UR.DBQuery('add', {
    'pmcData.entities': {
      id: modelId,
      entities: mechObj
    }
  });

  /** OLD CODE
   *
  m_graph.setEdge(sourceId, targetId, { name: label });
  PMCData.BuildModel();
  UTILS.RLog('MechanismAdd', sourceId, targetId, label);
  return `added edge ${sourceId} ${targetId} ${label}`;
   */
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  When a Mech is updated, the mech id changes, since it is made up of the
 *  source and target ids.  This essentially creates a new Mech.
 *  So we have to do a bit of extra work to copy the
 *  assets over from the old mech to the new mech.
 */
PMCData.PMC_MechUpdate = (origMech, newMech) => {
  // Update the data
  const { sourceId, targetId, label, description } = newMech;
  if (DBG) {
    console.log('MechUpdate: Updating', origMech.sourceId, '=>', sourceId, 'and', origMech.targetId, '=>', targetId)
    if (typeof sourceId !== 'number')
      console.log('coercing sourceId to Number from', typeof sourceId);
    if (typeof targetId !== 'number')
      console.log('coercing targetId to Number from', typeof targetId);
  }
  const modelId = ASET.selectedModelId;
  const mechObj = {
    type: 'mech',
    id: origMech.id,
    name: label,
    source: Number(sourceId),
    target: Number(targetId),
    description
  };
  return UR.DBQuery('update', {
    'pmcData.entities': {
      id: modelId,
      entities: mechObj
    }
  }).then(() => {
    // If source or target changed,  move evidence and comments
    if (origMech.sourceId !== newMech.sourceId || origMech.targetId !== newMech.targetId) {
      const origMechId = CoerceToPathId(origMech.sourceId, origMech.targetId);
      const newMechId = CoerceToPathId(newMech.sourceId, newMech.targetId);

      // 2a. Move evidence over.
      const evlinks = PMCData.PMC_GetEvLinksByMechId(origMechId);
      if (evlinks) {
        evlinks.forEach(evlink => {
          PMCData.SetEvidenceLinkMechId(evlink.id, newMechId);
        });
      }
      // 2b. Move comments over
      const comments = PMCData.GetCommentThreadComments(origMechId);
      PMCData.CommentThreadUpdate(newMechId, comments);

      UTILS.RLog(
        'MechanismEdit',
        `from "${origMechId}" to "${newMechId}" with label "${newMech.label}"`
      );

      // 3. Show review dialog alert.
      // HACK: Delay the alert so the system has a chance to redraw first.
      if (evlinks || comments.length > 0) {
        setTimeout(() => {
          alert(
            'Please review the updated mechanism to make sure the Evidence Links and comments are still relevant.'
          );
        }, 500);
      }
    }
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_MechDelete = mechId => {
  // mechId is of form "v:w"
  // Deselect the mech first, otherwise the deleted mech will remain selected
  VM.VM_DeselectAll();

  // Unlink any evidence
  const evlinks = PMCData.PMC_GetEvLinksByMechId(mechId);
  if (evlinks)
    evlinks.forEach(evlink => {
      PMCData.SetEvidenceLinkMechId(evlink.id, undefined);
    });

  // Then remove mech
  // FIXME / REVIEW : Do we need to use `name` to distinguish between
  // multiple edges between the same source target?
  const mech = PMCData.Mech(mechId);

  if (DBG) {
    if (typeof mechId !== 'number') console.log('coercing mechId to Number from', typeof mechId);
  }

  const modelId = ASET.selectedModelId;
  return UR.DBQuery('remove', {
    'pmcData.entities': {
      id: modelId,
      entities: { id: Number(mech.id) }
    }
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Checks to make sure the numberLabel already exists
 *  Called by GenerateNumberLabel, below
 */
function NumberLabelExists(numberLabel, evlinks) {
  return evlinks.find(ev => ev.numberLabel === numberLabel);
}
/**
 *  Construct numberLabel, e.g. "2c".
 *  Called by PMCData.PMC_AddEvidenceLink, below.
 *  @param {string} rsrcId
 *  @return {string} - A new numberLabel, e.g. "2c"
 */
function GenerateNumberLabel(rsrcId) {
  // 1. Ordinal value of resource in resource library, e.g. "2"
  const prefix = PMCData.PMC_GetResourceIndex(rsrcId);
  // 2. Ordinal value of evlink in evlink list, e.g. "c"
  const evlinks = PMCData.GetEvLinksByResourceId(rsrcId);
  let numberOfEvLinks = evlinks.length;
  let letter;
  let numberLabel;
  do {
    letter = String.fromCharCode(97 + numberOfEvLinks); // lower case for smaller footprint
    numberLabel = String(prefix) + letter;
    numberOfEvLinks++;
  } while (NumberLabelExists(numberLabel, evlinks));

  return numberLabel;
}
/**
 *  Adds a new evidence link object to the database and generates a new id for it.
 *  This also calculates the numberLabel automatically based on the assets already
 *  in the system.
 *
 *  @param {string} rsrcId - string id of the parent resource
 *  @param {function} cb - callback function will be called with the new id as a parameter
 *                         e.g. cb(id);
 *  @param {string} [note] - optional initial value of the note
 */
PMCData.PMC_AddEvidenceLink = (rsrcId, cb, note = '') => {
  const modelId = ASET.selectedModelId;
  const numberLabel = GenerateNumberLabel(rsrcId);

  // propId and mechId remain undefined until the user sets it later
  const evObj = {
    type: 'evidence',
    propId: undefined,
    mechId: undefined,
    rsrcId,
    numberLabel,
    rating: undefined,
    note
  };
  return UR.DBQuery('add', {
    'pmcData.entities': {
      id: modelId,
      entities: evObj
    }
  }).then(rdata => {
    const syncitems = DATAMAP.ExtractSyncData(rdata);
    syncitems.forEach(item => {
      const { colkey, subkey, value } = item;
      if (subkey === 'entities') {
        switch (value.type) {
          case 'evidence':
            const id = value.id;
            if (typeof cb === 'function') {
              cb(id);
            } else {
              throw Error('PMC_AddEvidenceLink callback cb is not a function!  Skipping...');
            }
            break;
        }
      }
    });
  });

  /** OLD CODE
  // Retrieve from db?!?
  // HACK!  FIXME!  Need to properly generate a unique ID.
  let id = `ev${Math.trunc(Math.random() * 10000)}`;

  // Construct number, e.g. "2c"
  // 1. Ordinal value of resource in resource library, e.g. "2"
  const prefix = PMCData.PMC_GetResourceIndex(rsrcId);
  // 2. Ordinal value of evlink in evlink list, e.g. "c"
  const evlinks = PMCData.GetEvLinksByResourceId(rsrcId);
  const numberOfEvLinks = evlinks.length;
  const count = String.fromCharCode(97 + numberOfEvLinks); // lower case for smaller footprint

  const number = String(prefix) + count;
  a_evidence.push({ id, propId: undefined, rsrcId, number, note });
  PMCData.BuildModel();

  UTILS.RLog('EvidenceCreate', rsrcId); // note is empty at this point
  return id;
  */
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Returns the 1-based index of the resource in the resource list.
 *  This is used for numbering evidence links, e.g. "2a"
 */
PMCData.PMC_GetResourceIndex = rsrcId => {
  const index = a_resources.findIndex(r => r.id === rsrcId);
  if (index === -1) console.error(PR, 'PMC_GetResourceIndex could not find', rsrcId);
  return index + 1;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 * @returns {string} EvId of the duplicated EvidenceLink object
 */
PMCData.PMC_DuplicateEvidenceLink = evId => {
  // First get the old link
  const oldlink = PMCData.PMC_GetEvLinkByEvId(evId);
  // Create new evlink
  let newEvId = PMCData.PMC_AddEvidenceLink(oldlink.rsrcId, oldlink.note);
  UTILS.RLog('EvidenceDuplicate', oldlink.note);
  return newEvId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_DeleteEvidenceLink = evId => {
  const modelId = ASET.selectedModelId;
  return UR.DBQuery('remove', {
    'pmcData.entities': {
      id: modelId,
      entities: { id: evId }
    }
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed evidence ID, returns the EvidenceLink object.
 *  NEVER access h_evidenceById directly!
 *
 *  @param {string|undefined} rsrcId - if defined, id string of the resource object
 *  @return {evlink} An evidenceLink object.
 */
PMCData.PMC_GetEvLinkByEvId = evId => {
  if (typeof evId !== 'number')
    throw Error('PMCData.PMC_GetEvLinkByEvId requested evId with non-Number', evId, typeof evId);
  return h_evidenceById.get(evId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed propid, returns evidence linked to the prop object.
 *  e.g. { evidenceId: '1', note: 'fish food fish food' }
 *  @param {Integer} propId - if defined, id of the prop (aka `propId`)
 *  @return {Array} - An array of evidenceLink objects, [] if not found
 */
PMCData.PMC_GetEvLinksByPropId = propId => {
  let numericId = propId;
  if (typeof propId !== 'number') {
    // coercing to Number because h_evidenceByProp is indexed by Number
    /* This is mostly to deal with calls from class-vbadge.Update()
       The issue is that VBadges get propIds from the parent vprop's id,
       but the VProp constructor requires a string id (mostly to match m_graphs'
       use of a string id).  Changing this would require cascading changes across
       many different code areas.
    */
    if (DBG)
      console.log(
        'PMCData.PMC_GetEvLinksByPropId expected Number but got',
        typeof propId,
        propId,
        '!  Coercing to Number!  Review the calling function to see why non-Number was passed.'
      );
    numericId = Number(propId);
  }
  if (!DATAMAP.IsValidId(numericId)) throw Error('invalid id');
  return h_evidenceByProp.get(numericId) || [];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed mechId (mech object), returns evidence linked to the mech object.
 *  e.g. { evidenceId: '1', note: 'fish food fish food' }
 *  @param {String|undefined} mechId - if defined, mechId string of the prop (aka `propId`)
 *  @return [evlinks] An array of evidenceLink objects
 */
PMCData.PMC_GetEvLinksByMechId = mechId => {
  return h_evidenceByMech.get(mechId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  General Evidence Update call
 *  Called by all the setters
 */
PMCData.PMC_EvidenceUpdate = (evId, newData) => {
  if (typeof evId === 'string') {
    console.warn('got string evId');
  }
  const ev = PMCData.PMC_GetEvLinkByEvId(evId);

  // data validation to make sure Object assign doesn't die.
  if (typeof ev !== 'object') throw Error('ev is not an object', typeof ev);
  if (typeof newData !== 'object') throw Error('newData is not an object', typeof newData);

  // Clean Data
  /* This data is being sent to the database, so all ids referring to
     the evidence, properties and resources should be integers.
     Not every key will be set, so only coerce if present
  
     propId is coming from EvidenceLink's target, which in turn is
     set from vm-data's selected_vprops array. That array is set from
     vprop ids, which means the ids are strings.  So we always want to
     coerce propIds to numbers here.
  */
  const cleanedData = Object.assign(newData); // copy everything first
  cleanedData.id = Number(evId); // Always coerce
  if (newData.propId) cleanedData.propId = Number(newData.propId);
  if (newData.rsrcId) cleanedData.rsrcId = Number(newData.rsrcId);
  const evData = Object.assign(ev, cleanedData);
  const modelId = ASET.selectedModelId;
  // we need to update pmcdata which looks like
  // { id, entities:[ { id, name } ] }
  return UR.DBQuery('update', {
    'pmcData.entities': {
      id: modelId,
      entities: evData
    }
  });
  // round-trip will call BuildModel() for us
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  @param {String} evId
 *  @param {String||undefined} propId - Set propId to `undefined` to unlink
 */
PMCData.SetEvidenceLinkPropId = (evId, propId) => {
  const newData = {
    propId,
    mechId: null // clear this in case it was set
  };
  PMCData.PMC_EvidenceUpdate(evId, newData);
  if (propId !== undefined)
    // Only log when setting, not when programmatically clearing
    UTILS.RLog('EvidenceSetTarget', `Attaching evidence "${evId}" to Property "${propId}"`);

  /** old code
  let evlink = h_evidenceById.get(evId);
  evlink.propId = propId;
  evlink.mechId = undefined; // clear this in case it was set
  // Call BuildModel to rebuild hash tables since we've added a new propId
  PMCData.BuildModel(); // DATA_UPDATED called by BuildModel()
  */
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SetEvidenceLinkMechId = (evId, mechId) => {
  const newData = {
    propId: null, // clear this in case it was set
    mechId
  };
  PMCData.PMC_EvidenceUpdate(evId, newData);
  if (mechId !== undefined)
    // Only log when setting, not when programmatically clearing
    UTILS.RLog('EvidenceSetTarget', `Attaching evidence "${evId}" to Mechanism "${mechId}"`);

  /** old code
  let evlink = h_evidenceById.get(evId);
  evlink.mechId = mechId;
  evlink.propId = undefined; // clear this in case it was set
  // Call BuildModel to rebuild hash tables since we've added a new mechId
  PMCData.BuildModel(); // DATA_UPDATED called by BuildModel()
  if (mechId !== undefined)
    // Only log when setting, not when programmatically clearing
    UTILS.RLog('EvidenceSetTarget', `Attaching evidence "${evId}" to Mechanism "${mechId}"`);
  */
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SetEvidenceLinkNote = (evId, note) => {
  const newData = {
    note
  };
  PMCData.PMC_EvidenceUpdate(evId, newData);
  UTILS.RLog('EvidenceSetNote', `Set evidence note to "${note}"`);

  /** old data
  let evlink = h_evidenceById.get(evId);
  evlink.note = note;
  UR.Publish('DATA_UPDATED');
  UTILS.RLog('EvidenceSetNote', `Set evidence note to "${evlink.note}"`);
   */
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SetEvidenceLinkRating = (evId, rating) => {
  console.error('setting ev rating to', evId, rating);
  const newData = {
    rating
  };
  PMCData.PMC_EvidenceUpdate(evId, newData);
  UTILS.RLog('EvidenceSetRating', `Set evidence "${evId}" to "${rating}"`);

  /** old data
  let evlink = h_evidenceById.get(evId);
  if (evlink) {
    evlink.rating = rating;
    UR.Publish('DATA_UPDATED');
    UTILS.RLog('EvidenceSetRating', `Set evidence "${evlink.note}" to "${rating}"`);
    return;
  }
  throw Error(`no evidence link with evId '${evId}' exists`);
  */
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// STICKIES //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * @param {string||number} refId - id of Property (Number) or Mechanism (String)
 * @return {object} Comment thread object, or [] if none defined.
// or undefined
 */
PMCData.GetCommentThread = refId => {
  return a_commentThreads.find(c => {
    return c.refId === refId;
  });
};
/** API.VIEWMODEL:
 * @param {string||number} refId - id of Property (Number) or Mechanism (String)
 * @return [array] Array of comment objects, or [] if none defined.
// or undefined
 */
PMCData.GetCommentThreadComments = refId => {
  const result = PMCData.GetCommentThread(refId);
  return result ? result.comments : [];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Returns an empty sticky with the current student info
 *  @param {string} author - author's studentId
 *  @param {string} sentenceStarter - placeholder text for a new comment
 * */
PMCData.NewComment = (author, sentenceStarter) => {
  const id = `co${new Date().getTime()}`;
  return {
    id,
    author,
    date: new Date().toJSON(),
    text: '',
    placeholder: sentenceStarter,
    criteriaId: '',
    readBy: []
  };
};
/**
 *  Add or Update individual comment item, then the thread itself
 */
PMCData.CommentAdd = (refId, newComment) => {
  if (DBG) console.log('PMCData.CommentAdd', refId, newComment);
  const comments = PMCData.GetCommentThreadComments(refId);
  if (comments.length < 1) {
    // Add new comment to new comment thread
    PMCData.CommentThreadAdd(refId, [newComment]);
  } else {
    // Add/Update comment to existing comment thread
    PMCData.CommentUpdate(refId, newComment);
  }
};
/**
 *  Update individual comment item, then the thread itself
 */
PMCData.CommentUpdate = (refId, newComment) => {
  if (DBG) console.log('PMCData.CommentUpdate', refId, newComment);
  const comments = PMCData.GetCommentThreadComments(refId);
  if (comments < 1) throw Error(`Trying to update a non-existent thread refId=${refId}`);

  // update existing comment or add a new comment?
  const i = comments.findIndex(c => c.id === newComment.id);
  if (i > -1) {
    // existing comment
    comments.splice(i, 1, newComment);
  } else {
    // new comment
    comments.push(newComment);
  }

  let thread = PMCData.GetCommentThread(refId);
  thread.comments = comments;
  const modelId = ASET.selectedModelId;
  if (DBG) console.log('updating model', modelId, 'with commentThread', thread);
  // we need to update pmcdata which looks like
  // { id, entities:[ { id, name } ] }
  return UR.DBQuery('update', {
    'pmcData.commentThreads': {
      id: modelId,
      commentThreads: thread
    }
  });
  // round-trip will call BuildModel() for us
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Adds a mew comment thread to refId
 *  @param {string} refId - if defined, id string of the target of the comment
 *                  propId, mechId, or evId
 *  @param [object] newComments - Array of comment objects
 *
 *  This is primarily used by the Sticky Notes system to save chagnes to
 *  comment text.
 */
PMCData.CommentThreadAdd = (refId, newComments) => {
  // local data will be updated on DBSYNC event, so don't write it here
  const threadData = Object.assign({ refId }, { comments: newComments });
  const modelId = ASET.selectedModelId;
  if (DBG)
    console.log(
      'PMCData.CommentThreadAdd: adding model',
      modelId,
      'with commentThread',
      threadData
    );
  // we need to update pmcdata which looks like
  // { id, entities:[ { id, name } ] }
  return UR.DBQuery('add', {
    'pmcData.commentThreads': {
      id: modelId,
      commentThreads: threadData
    }
  });
  // round-trip will call BuildModel() for us
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Updates the respective data structure (a_commentThreads or a_evidence) with the
 *  updated comment text.
 *  @param {string} refId - if defined, id string of the target of the comment
 *                  propId, mechId, or evId
 *  @param [object] newComments - Array of comment objects
 *
 *  This is primarily used by the Sticky Notes system to save changes to
 *  comment text.
 */
PMCData.CommentThreadUpdate = (refId, newComments) => {
  
  const thread = PMCData.GetCommentThread(refId);
  if (thread === undefined) {
    // When a StickyNote is created, the note doesn't know if there is a parent
    // thread or not, it just calls CommentThreadUpdate
    // If there's no existing thread, we need to create one.
    PMCData.CommentThreadAdd(refId, newComments);
    return;
  }

  // make a copy of the prop with overwritten new data
  // local data will be updated on DBSYNC event, so don't write it here
  const threadData = Object.assign(thread, { comments: newComments });
  const modelId = ASET.selectedModelId;
  if (DBG) console.log('updating model', modelId, 'with commentThread', threadData);
  // we need to update pmcdata which looks like
  // { id, entities:[ { id, name } ] }
  return UR.DBQuery('update', {
    'pmcData.commentThreads': {
      id: modelId,
      commentThreads: threadData
    }
  });
  // round-trip will call BuildModel() for us

  /* OLD CODE
  return;

  let index;
  let commentThread;
  index = a_commentThreads.findIndex(c => {
    return c.refId === refId;
  });
  if (index > -1) {
    // existing comment
    commentThread = a_commentThreads[index];
    commentThread.comments = comments;
    a_commentThreads.splice(index, 1, commentThread);
  } else {
    // new comment
    // FIXME
    // Temporarily insert a random numeric prop id
    // This will get replaced with a server promise once that's implemented
    const id = Math.trunc(Math.random() * 10000000000).toString();
    commentThread = { id, refId: refId, comments };
    a_commentThreads.push(commentThread);
  }
  UR.Publish('DATA_UPDATED');
  */
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed resource ID, returns array of prop ids linked to the resource object.
 *  @param {string|undefined} rsrcId - if defined, id string of the resource object
 */
PMCData.GetPropIdsByResourceId = rsrcId => {
  // console.log('props by rsrcId', ...Object.keys(h_propByResource));
  return h_propByResource.get(rsrcId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed resource ID, returns array of prop ids linked to the resource object.
 *  @param {string|undefined} rsrcId - if defined, id string of the resource object
 *  @return {array} Array of propery ids
 */
PMCData.GetEvLinksByResourceId = rsrcId => {
  // console.log('evlinks by rsrcId', ...Object.keys(h_evidenceByResource));
  return h_evidenceByResource.get(rsrcId);
};

/// DEBUG UTILS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default PMCData;
