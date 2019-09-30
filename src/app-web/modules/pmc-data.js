import { Graph, alg as GraphAlg, json as GraphJSON } from '@dagrejs/graphlib';
import { cssinfo, cssreset, cssdata } from './console-styles';
import DEFAULTS from './defaults';
import UR from '../../system/ursys';
import VM from './vm-data';
import UTILS from './utils';

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
const DBG = true;
const PKG = 'PMCDATA';

/// MODEL /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_graph; // dagresjs/graphlib instance
let a_props = []; // all properties (strings)
let a_mechs = []; // all mechanisms (pathId strings)
let a_commentThreads = []; // all prop and mech comments
//
let a_components = []; // top-level props with no parents, derived
let h_children = new Map(); // children hash of each prop by id
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
 *  Loads a graph from model data and saves a local copy.  Replaces PMCData.LoadGraph.
 *  This will self repair bad data, but model.id and model.groupID MUST be defined.
 *  This should be only be called by ADMData.InitializeModel. Never call this direcly.
 */
PMCData.InitializeModel = (model, resources) => {
  const g = new Graph({ directed: true, compound: true, multigraph: true });

  // Self repair bad data
  let m = model;
  if (m.id === undefined || m.groupId === undefined) {
    console.error(
      `PMCData.InitializeModel called with either bad id (${m.id})or bad groupId (${m.groupId})`
    );
  }
  m.data = model.data || {};

  // Load Components/Properties
  m.data.properties = m.data.properties || [];
  m.data.properties.forEach(obj => {
    g.setNode(obj.id, { name: obj.name });
  });

  // Set Parents
  m.data.properties.forEach(obj => {
    if (obj.parent !== undefined) {
      g.setParent(obj.id, obj.parent);
    }
  });

  // Load Mechanisms
  m.data.mechanisms = m.data.mechanisms || [];
  m.data.mechanisms.forEach(mech => {
    g.setEdge(mech.source, mech.target, { name: mech.name });
  });

  // Load Evidence Links
  m.data.evidence = m.data.evidence || [];
  m.data.evidence.forEach(ev => {
    let { id, propId, mechId, rsrcId, number, rating, note, comments } = ev;
    comments = comments || []; // allow empty comments
    a_evidence.push({
      id: String(id), // Model expects string ids
      propId: propId === undefined ? undefined : String(propId),
      mechId: mechId === undefined ? undefined : String(mechId),
      rsrcId: rsrcId === undefined ? undefined : String(rsrcId),
      number,
      rating,
      note,
      comments
    });
  });

  // Comments
  m.data.commentThreads = m.data.commentThreads || [];
  m.data.commentThreads.forEach(cm => {
    let { id, refId, comments } = cm;
    a_commentThreads.push({
      id: String(id),
      refId: String(refId),
      comments
    });
  });

  a_resources = resources || [];

  /***************************************************************************/
  // test serial write out, then serial read back in
  const cleanGraphObj = GraphJSON.write(g);
  const json = JSON.stringify(cleanGraphObj);
  m_graph = GraphJSON.read(JSON.parse(json));
  PMCData.BuildModel();

  return m;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Builds the PROPS, MECHS, COMPONENTS, CHILDREN, and OUTEDGES lists
 *  from the raw GraphLibJS data store.
 */
PMCData.BuildModel = () => {
  // test graphlib
  a_props = m_graph.nodes(); // returns node ids
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
 *  @param {string} nodeId - the nodeId that might have children
 *  @returns {array} - an array of nodeId strings, or empty array
 */
PMCData.Children = nodeId => {
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
  throw Error(`no prop with id '${nodeId}' exists`);
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
 *  @param {object|string} evo - edgeObj {w,v}, pathId, or nodeId string of source
 *  @param {string|undefined} ew - if defined, nodeId string of the target prop
 */
PMCData.Mech = (evo, ew) => {
  const eobj = CoerceToEdgeObj(evo, ew);
  return m_graph.edge(eobj);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_AddProp = node => {
  // FIXME
  // Temporarily insert a random numeric prop id
  // This will get replaced with a server promise once that's implemented
  const propId = Math.trunc(Math.random() * 10000000000).toString();
  m_graph.setNode(propId, { name: `${node}` });
  PMCData.BuildModel();
  UTILS.RLog('PropertyAdd', node);
  return `added node ${node}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_SetPropParent = (node, parent) => {
  m_graph.setParent(node, parent);
  PMCData.BuildModel();
  UTILS.RLog('PropertySetParent', node, parent);
  return `set parent ${parent} to node ${node}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_PropDelete = propid => {
  // Deselect the prop first, otherwise the deleted prop will remain selected
  VM.VM_DeselectAll();
  // Unlink any evidence
  const evlinks = PMCData.PMC_GetEvLinksByPropId(propid);
  if (evlinks)
    evlinks.forEach(evlink => {
      PMCData.SetEvidenceLinkPropId(evlink.id, undefined);
    });
  // Delete any children nodes
  const children = PMCData.Children(propid);
  if (children)
    children.forEach(cid => {
      PMCData.PMC_SetPropParent(cid, undefined);
    });
  // Then remove propid
  m_graph.removeNode(propid);
  PMCData.BuildModel();
  UTILS.RLog('PropertyDelete', propid);
  return `deleted propid ${propid}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_MechAdd = (sourceId, targetId, label) => {
  m_graph.setEdge(sourceId, targetId, { name: label });
  PMCData.BuildModel();
  UTILS.RLog('MechanismAdd', sourceId, targetId, label);
  return `added edge ${sourceId} ${targetId} ${label}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  When a Mech is updated, the mech id changes, since it is made up of the
 *  source and target ids.  This essentially creates a new Mech.
 *  So we have to do a bit of extra work to copy the
 *  assets over from the old mech to the new mech.
 */
PMCData.PMC_MechUpdate = (origMech, newMech) => {
  // If we're only changing the label, then don't do the fancy swap, just update the label.
  if (origMech.sourceId === newMech.sourceId && origMech.targetId === newMech.targetId) {
    // Just change label
    const { sourceId, targetId, label } = newMech;
    m_graph.setEdge(sourceId, targetId, { name: label });
    PMCData.BuildModel();
    UTILS.RLog('MechanismEditLabel', label);
  } else {
    // 1. Add the new mech
    m_graph.setEdge(newMech.sourceId, newMech.targetId, { name: newMech.label });

    // 2. Update the old mech
    const origMechId = `${origMech.sourceId}:${origMech.targetId}`;
    const newMechId = `${newMech.sourceId}:${newMech.targetId}`;

    // 2a. Move assets over
    const evlinks = PMCData.PMC_GetEvLinksByMechId(origMechId);
    // 2a. Move evidence over. Modify in place.
    if (evlinks) {
      evlinks.forEach(evlink => {
        PMCData.SetEvidenceLinkMechId(evlink.id, newMechId);
      });
    }
    // 2b. Move comments over
    const comments = PMCData.GetComments(origMechId);
    PMCData.UpdateComments(newMechId, comments);

    // 2c. Remove the old mech
    PMCData.PMC_MechDelete(origMechId);

    PMCData.BuildModel();
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
  return `updated edge`;
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
  // FIXME / REVIEW: Do we need add a definition for splitting a
  // pathId to v / w ?
  let vw = mechId.split(':');
  m_graph.removeEdge(vw[0], vw[1]);
  PMCData.BuildModel();
  return `deleted edge ${mechId}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_AddEvidenceLink = (rsrcId, note = '') => {
  
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
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Returns the 1-based index of the resource in the resource list.
 *  This is used for numbering evidence links, e.g. "2a"
 */
PMCData.PMC_GetResourceIndex = rsrcId => {
  const index = a_resources.findIndex(r => r.id === rsrcId);
  if (index === -1) console.error(PKG, 'PMC_GetResourceIndex could not find', rsrcId);
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
  // Then delete the link(s)
  let i = a_evidence.findIndex(e => {
    return e.id === evId;
  });
  a_evidence.splice(i, 1);
  PMCData.BuildModel();
  return evId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed evidence ID, returns the EvidenceLink object.
 *  @param {string|undefined} rsrcId - if defined, id string of the resource object
 *  @return {evlink} An evidenceLink object.
 */
PMCData.PMC_GetEvLinkByEvId = evId => {
  return h_evidenceById.get(evId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed propid, returns evidence linked to the prop object.
 *  e.g. { evidenceId: '1', note: 'fish food fish food' }
 *  @param {String} propId - if defined, id of the prop (aka `propId`)
 *  @return [evlinks] An array of evidenceLink objects
 */
PMCData.PMC_GetEvLinksByPropId = propId => {
  return h_evidenceByProp.get(propId);
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
 *  @param {String} evId
 *  @param {String||undefined} propId - Set propId to `undefined` to unlink
 */
PMCData.SetEvidenceLinkPropId = (evId, propId) => {
  let evlink = h_evidenceById.get(evId);
  evlink.propId = propId;
  evlink.mechId = undefined; // clear this in case it was set
  // Call BuildModel to rebuild hash tables since we've added a new propId
  PMCData.BuildModel(); // DATA_UPDATED called by BuildModel()
  if (propId !== undefined)
    // Only log when setting, not when programmatically clearing
    UTILS.RLog('EvidenceSetTarget', `Attaching evidence "${evlink.note}" to Property "${propId}"`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SetEvidenceLinkMechId = (evId, mechId) => {
  let evlink = h_evidenceById.get(evId);
  evlink.mechId = mechId;
  evlink.propId = undefined; // clear this in case it was set
  // Call BuildModel to rebuild hash tables since we've added a new mechId
  PMCData.BuildModel(); // DATA_UPDATED called by BuildModel()
  if (mechId !== undefined)
    // Only log when setting, not when programmatically clearing
    UTILS.RLog('EvidenceSetTarget', `Attaching evidence "${evlink.note}" to Mechanism "${mechId}"`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SetEvidenceLinkNote = (evId, note) => {
  let evlink = h_evidenceById.get(evId);
  evlink.note = note;
  UR.Publish('DATA_UPDATED');
  UTILS.RLog('EvidenceSetNote', `Set evidence note to "${evlink.note}"`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SetEvidenceLinkRating = (evId, rating) => {
  let evlink = h_evidenceById.get(evId);  
  if (evlink) {
    evlink.rating = rating;
    UR.Publish('DATA_UPDATED');
    UTILS.RLog('EvidenceSetRating', `Set evidence "${evlink.note}" to "${rating}"`);
    return;
  }
  throw Error(`no evidence link with evId '${evId}' exists`);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// STICKIES //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * @param {string} refId - id of Property or Mechanism
 * @return [array] Array of comment objects, or [] if none defined.
 */
PMCData.GetComments = refId => {
  const result = a_commentThreads.find(c => {
    return c.refId === refId;
  });
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
    date: new Date(),
    text: '',
    placeholder: sentenceStarter,
    criteriaId: '',
    readBy: []
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Updates the respective data structure (a_commentThreads or a_evidence) with the
 *  updated comment text.
 *  @param {string} parentId - if defined, id string of the resource object
 *                  propId, mechId, or evId
 *  @param [object] comments - Array of comment objects
 *
 *  This is primarily used by the Sticky Notes system to save chagnes to
 *  comment text.
 */
PMCData.UpdateComments = (parentId, comments) => {
  let index;
  let commentThread;
  index = a_commentThreads.findIndex(c => {
    return c.refId === parentId;
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
    commentThread = { id, refId: parentId, comments };
    a_commentThreads.push(commentThread);
  }
  UR.Publish('DATA_UPDATED');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed resource ID, returns array of prop ids linked to the resource object.
 *  @param {string|undefined} rsrcId - if defined, id string of the resource object
 */
PMCData.GetPropIdsByResourceId = rsrcId => {
  return h_propByResource.get(rsrcId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed resource ID, returns array of prop ids linked to the resource object.
 *  @param {string|undefined} rsrcId - if defined, id string of the resource object
 *  @return {array} Array of propery ids
 */
PMCData.GetEvLinksByResourceId = rsrcId => {
  return h_evidenceByResource.get(rsrcId);
};

/// DEBUG UTILS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default PMCData;
