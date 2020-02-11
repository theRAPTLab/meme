import { Graph, alg as GraphAlg, json as GraphJSON } from '@dagrejs/graphlib';
import { cssinfo, cssreset, cssdata } from './console-styles';
import DEFAULTS from './defaults';
import DATAMAP from '../../system/common-datamap';
import UR from '../../system/ursys';
import VM from './vm-data';
import UTILS from './utils';
import ASET from './adm-settings';
import ADMObj from './adm-objects';
import PMCObj from './pmc-objects';

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
let a_comments = []; // all comments
let a_markedread = []; // ids of comments that have been read by students
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
  a_comments = [];
  a_markedread = [];
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

  const data = pmcData.find(data => data.id === pmcDataId) || {}; // empty object if new pmcData
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
  if (data.comments) {
    a_comments = data.comments.map(c => {
      return Object.assign({ refId: String(c.refId) }, c);
    });
  } else {
    a_comments = [];
  }
  if (data.markedread) {
    a_markedread = data.markedread.slice(0);
  } else {
    a_markedread = [];
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
      if (PMCData.PropParent()) {
        if (DBG) console.warn(`vprop ${id} has a parent: skipping`);
        return;
      }
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
  if (DBG) console.log('PMCData.SyncAddedData data', data);
  // skip update if no model is loaded
  if (ASET.selectedModelId === '' || m_graph === undefined) return;
  // skip update if data is for a different model
  if (data.pmcDataId !== ASET.selectedPMCDataId) return;

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
          const { id, propId, mechId, rsrcId, numberLabel, rating, note, imageURL } = value;
          a_evidence.push({
            id,
            propId,
            mechId,
            rsrcId,
            numberLabel,
            rating,
            note,
            imageURL
          });
          break;
        default:
          throw Error('unexpected proptype');
      }
      PMCData.BuildModel();
    }

    if (subkey === 'comments') {
      const comment = PMCObj.Comment(value);
      console.log('....adding comment', comment);
      a_comments.push(comment);
      UR.Publish('DATA_UPDATED');
    }

    if (subkey === 'markedread') {
      a_markedread.push(value);
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
  // skip update if no model is loaded
  if (ASET.selectedModelId === '' || m_graph === undefined) return;
  // skip update if data is for a different model
  if (data.pmcDataId !== ASET.selectedPMCDataId) return;

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
          const { id, propId, mechId, rsrcId, numberLabel, rating, note, imageURL } = value;
          const evlink = {
            id,
            propId,
            mechId,
            rsrcId,
            numberLabel,
            rating,
            note,
            imageURL
          };
          const i = a_evidence.findIndex(e => e.id === id);
          a_evidence.splice(i, 1, evlink);
          break;
        default:
          throw Error('unexpected proptype');
      }
      PMCData.BuildModel();
    }

    if (subkey === 'comments') {
      const newComment = PMCObj.Comment(value);
      const i = a_comments.findIndex(c => c.id === value.id);
      if (i < 0) throw Error('Trying to update non-existent comments');
      const comment = Object.assign(a_comments[i], newComment);
      a_comments.splice(i, 1, comment); 
      UR.Publish('DATA_UPDATED');
    }

    if (subkey === 'markedread') {
      // marked read really doesn't get updates
    }
  }); // syncitems
  if (DBG && data['pmcData.comments']) console.log('PMCData.comments update');
  // do stuff here

  // can add better logic to avoid updating too much
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SyncRemovedData = data => {
  // skip update if no model is loaded
  if (ASET.selectedModelId === '' || m_graph === undefined) return;
  // skip update if data is for a different model
  if (data.pmcDataId !== ASET.selectedPMCDataId) return;

  const syncitems = DATAMAP.ExtractSyncData(data);
  syncitems.forEach(item => {
    const { colkey, subkey, value } = item;
    if (DBG) console.log('removed', colkey, subkey || '', value);

    if (subkey === 'entities') {
      // has id, type, name
      switch (value.type) {
        case 'prop':
          // 1. deselect the prop before deleting it
          //    otherwise, it remains on selectedProps list causing all kinds of havoc
          VM.VM_DeselectAllProps();
          // 2. now remove it
          m_graph.removeNode(value.id);
          // 3. force build before publishing PROP_DELETE
          //    otherwise ToolsPanel rebuilds with missing component
          PMCData.BuildModel();
          // 4. Fire PROP_DELETE so that any open dialogs can remove it
          UR.Publish('PROP_DELETE', { id: value.id });
          return; // so we don't fire BuildModel again
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

    if (subkey === 'comments') {
      let i = a_comments.findIndex(c => c.id === value.id);
      a_comments.splice(i, 1);
      // no need to build model, just send a data update
      UR.Publish('DATA_UPDATED');
    }

    if (subkey === 'markedread') {
      // marked read really doesn't get removed
    }
  });
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
 *  @param {String} nodeId - the nodeId to test
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
  const pmcDataId = ASET.selectedPMCDataId;
  const propObj = Object.assign(newPropObj, { type: 'prop' });
  UTILS.RLog(
    'PropertyAdd',
    `name: "${newPropObj.name}" description: "${newPropObj.description}" with parent "${newPropObj.parent}"`
  );
  return UR.DBQuery('add', {
    'pmcData.entities': {
      id: pmcDataId,
      entities: propObj
    }
  });
  // round-trip will call BuildModel() for us
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
  const pmcDataId = ASET.selectedPMCDataId;
  UTILS.RLog(
    'PropertyEdit',
    `name: "${propData.name}" description: "${propData.description}" with parent "${propData.parent}"`
  );
  // we need to update pmcdata which looks like
  // { id, entities:[ { id, name } ] }
  return UR.DBQuery('update', {
    'pmcData.entities': {
      id: pmcDataId,
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
  const pmcDataId = ASET.selectedPMCDataId;
  return UR.DBQuery('remove', {
    'pmcData.entities': {
      id: pmcDataId,
      entities: { id: propId }
    }
  });
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
  if (!PMCData.PMC_IsDifferentPropParent(nodeId, parentId)) {
    // only write to the database (and roundtrip) if the propparent
    // is different from last time
    return false;
  }
  // REVIEW/FIXME: Is this coercion necessary once we convert to ints?
  const id = Number(nodeId);
  const pid = Number(parentId);
  UTILS.RLog('PropertySetParent', `id: ${id} parentId: ${pid}`);
  return PMCData.PMC_PropUpdate(id, { parent: pid }).then(rdata => {
    if (DBG) console.log('PropUpdate', JSON.stringify(rdata['pmcData.entities']));
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_MechAdd = (sourceId, targetId, label, description) => {
  if (DBG) {
    if (typeof sourceId !== 'number')
      console.log('coercing sourceId to Number from', typeof sourceId);
    if (typeof targetId !== 'number')
      console.log('coercing targetId to Number from', typeof targetId);
  }
  // Validate: Make sure source and target still exist before saving
  if (!PMCData.HasProp(sourceId)) {
    console.error('PMCData.PMC_MechAdd trying to add non existent source prop', sourceId);
    return;
  }
  if (!PMCData.HasProp(targetId)) {
    console.error('PMCData.PMC_MechAdd trying to add non existent target prop', targetId);
    return;
  }
  const pmcDataId = ASET.selectedPMCDataId;
  const mechObj = {
    type: 'mech',
    name: label,
    source: Number(sourceId),
    target: Number(targetId),
    description
  };
  UTILS.RLog('MechanismAdd', `from: "${sourceId}" to: "${targetId}" label: "${label}" description: "${description}"`);
  return UR.DBQuery('add', {
    'pmcData.entities': {
      id: pmcDataId,
      entities: mechObj
    }
  });
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
  // Validate: Make sure source and target still exist before saving
  if (!PMCData.HasProp(sourceId)) {
    console.error('PMCData.PMC_MechAdd trying to add non existent source prop', sourceId);
    return;
  }
  if (!PMCData.HasProp(targetId)) {
    console.error('PMCData.PMC_MechAdd trying to add non existent target prop', targetId);
    return;
  }
  const pmcDataId = ASET.selectedPMCDataId;
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
      id: pmcDataId,
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
      const comments = PMCData.GetComments(origMechId);
      if (comments.length > 0) PMCData.DB_CommentsUpdate(newMechId, comments);

      UTILS.RLog(
        'MechanismEdit',
        `from: "${origMechId}" to: "${newMechId}" label: "${newMech.label}" description: "${newMech.description}"`
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

  UTILS.RLog('MechanismDelete', mechId);

  const pmcDataId = ASET.selectedPMCDataId;
  return UR.DBQuery('remove', {
    'pmcData.entities': {
      id: pmcDataId,
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
 *  @param {Object} evObjData - Any subset of PMBObj.Evidence keys
 *  @param {Function} cb - callback function will be called with the new id as a parameter
 *                         e.g. cb(id);
 */
PMCData.PMC_AddEvidenceLink = (evObjData, cb) => {
  const numberLabel = GenerateNumberLabel(evObjData.rsrcId);
  const evObj = PMCObj.Evidence({
    // no id - id should be undefined since we're defining a new db object
    // propId and mechId remain undefined until the user sets it later
    rsrcId: evObjData.rsrcId,
    numberLabel,
    note: evObjData.note,
    imageURL: evObjData.imageURL
  });
  
  UTILS.RLog('EvidenceCreate', evObj.rsrcId); // note is empty at this point
  const pmcDataId = ASET.selectedPMCDataId;
  return UR.DBQuery('add', {
    'pmcData.entities': {
      id: pmcDataId,
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
 *  @param {Integer} evId - id of the source evidence link to duplicate
 *  @param {function} cb - callback function will be called with the new id as a parameter
 *                         e.g. cb(id);
 */
PMCData.PMC_DuplicateEvidenceLink = (evId, cb) => {
  // First get the old link
  const oldev = PMCData.PMC_GetEvLinkByEvId(evId);
  const newev = Object.assign(
    {},
    oldev,
    { id: undefined, propId: undefined, mechId: undefined }
  );
  UTILS.RLog('EvidenceDuplicate', oldev.note);
  // Create new evlink
  PMCData.PMC_AddEvidenceLink(
    newev,
    id => { if (typeof cb === 'function') cb(id) },
  );
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_DeleteEvidenceLink = evId => {
  const pmcDataId = ASET.selectedPMCDataId;
  return UR.DBQuery('remove', {
    'pmcData.entities': {
      id: pmcDataId,
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
    throw Error(`PMCData.PMC_GetEvLinkByEvId requested evId with non-Number ${evId} typeof ${typeof evId}`);
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
  const pmcDataId = ASET.selectedPMCDataId;
  UTILS.RLog('EvidenceUpdate',
    `rsrcId: ${evData.rsrcId} propId: ${evData.propId} mechId: ${evData.mechId} numberLabel: ${evData.numberLabel} rating: ${evData.rating} note: ${evData.note}  imageURL: ${evData.imageURL}`
  );

  // we need to update pmcdata which looks like
  // { id, entities:[ { id, name } ] }
  return UR.DBQuery('update', {
    'pmcData.entities': {
      id: pmcDataId,
      entities: evData
    }
  });
  // round-trip will call BuildModel() for us
};;
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
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SetEvidenceLinkNote = (evId, note) => {
  const newData = {
    note
  };
  PMCData.PMC_EvidenceUpdate(evId, newData);
  UTILS.RLog('EvidenceSetNote', `Set evidence note to "${note}"`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SetEvidenceLinkRating = (evId, rating) => {
  const newData = {
    rating
  };
  PMCData.PMC_EvidenceUpdate(evId, newData);
  UTILS.RLog('EvidenceSetRating', `Set evidence "${evId}" to "${rating}"`);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// STICKIES //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Adds a new comment item to the database
 *  @param {String} refId - id of the parent object the comment is pointing to
 *  @param {Object} commentData - a PMCObj.Comment-like object with NO id
 *                                three optional parameters: text, criteriaId
 */
PMCData.DB_CommentAdd = (refId, commentData, cb) => {
  if (refId === undefined || refId === "") throw Error(`refId is required for a new comment object! refId="${refId}`);
  if (commentData.id) throw Error('comment id should not be passed to a new comment object!');
  const newComment = PMCObj.Comment({
    refId: commentData.refId,
    author: commentData.author,
    text: commentData.text,
    criteriaId: commentData.criteriaId,
    placeholder: commentData.placeholder
  });
  UTILS.RLog(
    'CommentAdd',
    `id:${newComment.id} "${commentData.text}" with criteria "${commentData.criteriaId}" on "${refId}"`
  );
  const pmcDataId = ASET.selectedPMCDataId;
  return UR.DBQuery('add', {
    'pmcData.comments': {
      id: pmcDataId,
      comments: newComment
    }
  }).then(rdata => {
    if (cb && typeof cb === 'function') cb(rdata);
  });
};
/**
 *  Updates a single comment items
 *  @param {String} refId - id of the parent object the comment is pointing to
 *  @param {Object} comment - a PMCObj.Comment-like object with
 *                                three optional parameters: text, criteriaId
 *  @param {Function} cb - a callback function
 *  */
PMCData.DB_CommentUpdate = (refId, comment, cb) => {
  if (DBG) console.log('PMCData.CommentUpdateReadBy', refId, comment);
  // merge into old comments
  const origComment = PMCData.GetComment(comment.id);
  if (origComment === undefined) {
    // new comment
    return PMCData.DB_CommentAdd(refId, comment, cb);
  }

  // update existing comment
  const updatedComment = Object.assign(origComment, comment);
  
  UTILS.RLog(
    'CommentUpdate',
    `id:${updatedComment.id} "${updatedComment.text}" with criteria "${updatedComment.criteriaId}" on "${refId}"`
  );

  const pmcDataId = ASET.selectedPMCDataId;
  return UR.DBQuery('update', {
    'pmcData.comments': {
      id: pmcDataId,
      comments: updatedComment
    }
  }).then(rdata => {
    if (cb && typeof cb === 'function') cb(rdata);
  });
};
/**
 *  Updates an array of comment items
 *  @param {String} refId - id of the parent object the comment is pointing to
 *  @param {Object} comments - an array of PMCObj.Comment-like object with
 *                                three optional parameters: text, criteriaId
 *  @param {Function} cb - a callback function
 *  */
PMCData.DB_CommentsUpdate = (refId, comments, cb) => {
  if (!Array.isArray(comments)) throw Error(`comments is not an array: ${comments} ${typeof comments}`);
  const count = comments.length;
  let callback = undefined;
  for (let i = 0; i++; i < count) {
    if (i === count - 1) {
      // last one so add the callback
      callback = cb;
    }
    PMCData.DB_CommentUpdate(refId, comment[i], callback);
  }
}

/**
 *  Remove comment from the db
 *  @param {String} id - id of the comment object (not refId)
 */
PMCData.DB_CommentDelete = commentId => {
  const pmcDataId = ASET.selectedPMCDataId;
  UTILS.RLog('CommentDelete', `id:${commentId} from model "${pmcDataId}"`);
  return UR.DBQuery('remove', {
    'pmcData.comments': {
      id: pmcDataId,
      comments: { id: commentId }
    }
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Retrieves the comment object in the database matching the comment id
 *  @param {String} id - database id of the comment object (not refId)
 *  @return {Array} Array of comment objects, or undefined if not found
 */
PMCData.GetComment = id => {
  return a_comments.find(c => c.id === id);
};
/**
 *  Retrieves all of the comment objects in the database related to refId
 *  @param {String} refId - id of Property(Number) or Mechanism(String)
 *  @return {Array} Array of comment objects, or [] if none defined.
 */
PMCData.GetComments = refId => {
  return a_comments.filter(c => c.refId === refId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Adds a new markedread item to the database
 *  @param {String} commentId - id of the coment object that is being marked read
 *  @param {Object} author - id of the author who read the comment
 */
PMCData.DB_MarkRead = (commentId, author) => {
  if (DBG) console.log('PMCData.DB_MarkRead', commentId, authors);
  const newMarkedRead = PMCObj.MarkedRead({
    commentId,
    author: author
  });
  UTILS.RLog('CommentMarkedRead', `id:${commentId} read by "${author}"`);
  const pmcDataId = ASET.selectedPMCDataId;
  return UR.DBQuery('add', {
    'pmcData.markedread': {
      id: pmcDataId,
      markedread: newMarkedRead
    }
  });
};
/**
 *  Checks if the comment referenced by commentId has been read by the author
 *  @param {Integer} commentId - db id of the comment object
 *  @param {String} author - token 
 */
PMCData.HasBeenRead = (commentId, author) => {
  return a_markedread.find(m => {
    return m.commentId === commentId && m.author === author;
  })
};
/**
 *  Checks if the comment referenced by commentId has been read by the author
 *  Used to set StickyNoteButton status.
 *  @param {Array} comments - an array of Comment objects
 *  @param {String} author - token 
 */
PMCData.HasUnreadComments = (comments, author) => {
  if (!Array.isArray(comments)) throw Error('comments is not an array')
  return comments.find(c => !PMCData.HasBeenRead(c.id, author));
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
if (!window.ur) window.ur = {};
window.ur.PMC = PMCData;
window.ur.props = () => a_props;
window.ur.mechs = () => a_mechs;

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default PMCData;
