import { Graph, alg as GraphAlg, json as GraphJSON } from '@dagrejs/graphlib';
import { cssinfo, cssreset, cssdata } from './console-styles';
import DEFAULTS from './defaults';
import UR from '../../system/ursys';

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
const PKG = 'pmc-data:';

/// MODEL /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_graph; // dagresjs/graphlib instance
let a_props = []; // all properties (strings)
let a_mechs = []; // all mechanisms (pathId strings)
//
let a_components = []; // top-level props with no parents
let h_children = new Map(); // children hash of each prop by id
let h_outedges = new Map(); // outedges hash of each prop by id
//
let a_resources = []; /*/ all resource objects to be displayed in InformationList
                         a_resource = [
                            {
                              rsrcId: '1',
                              label: 'Food Rot Simulation',
                              notes: ['water quality', 'food rotting'],
                              type: 'simulation',
                              url: '../static/dlc/FishSpawn_Sim_5_SEEDS_v7.html',
                              links: 0
                            }
                          ]
                      /*/
let a_evidence = []; /*/ An array of prop-related evidence links.
                          This is the master list of evidence links.

                          [ evidenceLink,... ]
                          [ {eid, propId, rsrcId, note},... ]

                          a_evidence.push({ eid: '1', propId: 'a', rsrcId: '1', note: 'fish need food' });

                      /*/
let h_evidenceByProp = new Map(); /*/
                          Hash table of an array of evidence links related
                          to a property id, and grouped by property id.

                          Used by class-vprop when displaying
                          the list of evidenceLink badges for each prop.

                          {propId: [{evId, propId, rsrcId, note},
                                    {evId, propId, rsrcId, note},
                                ...],
                          ...}
                      /*/
let h_evlinkByResource = new Map(); /*/
                          Used by EvidenceList to look up all evidence related to a resource
                      /*/
let h_evidenceByMech = new Map(); // links to evidence by mechanism id
let h_propByResource = new Map(); /*/
                          Hash table to look up an array of property IDs related to
                          a specific resource.

                          Used by InformationList to show props related to each resource.

                          {rsrcId: [propId1, propId2,...],... }
                      /*/
let h_mechByResource = new Map(); // calculated links to mechanisms by evidence id

/// VIEWMODEL /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const map_vprops = new Map(); // our property viewmodel data stored by id
const map_vmechs = new Map(); // our mechanism viewmodel data stored by pathid
const map_vbadges = new Map(); // our evidence badge viewmodel data stored by evId
const selected_vprops = new Set();
const selected_vmechs = new Set();
const map_rollover = new Map();

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
/**
 *  Loads a graph from model data and saves a local copy.  Replaces PMCData.LoadGraph.
 *  This will self repair bad data, but model.id and model.groupID MUST be defined.
 *  This should be only be called by ADMData.LoadModel. Never call this direcly.
 */
PMCData.LoadModel = (model, resources) => {
  const g = new Graph({ directed: true, compound: true, multigraph: true });

  // Self repair bad data
  let m = model;
  if (m.id === undefined || m.groupId === undefined) {
    console.error(
      `PMCData.LoadModel called with either bad id (${m.id})or bad groupId (${m.groupId})`
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
    let { evId, propId, mechId, rsrcId, note, comments } = ev;
    comments = comments || []; // allow empty comments
    a_evidence.push({
      evId,
      propId,
      mechId,
      rsrcId,
      note,
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
  h_evlinkByResource = new Map();
  a_resources.forEach(resource => {
    let evlinkArray = a_evidence.filter(evlink => evlink.rsrcId === resource.rsrcId);
    if (evlinkArray === undefined) evlinkArray = [];
    h_evlinkByResource.set(resource.rsrcId, evlinkArray);
  });

  /*/
   *  Now update all evidence link counts
  /*/
  a_resources.forEach(resource => {
    let props = h_propByResource.get(resource.rsrcId);
    if (props) {
      resource.links = props.length;
    } else {
      resource.links = 0;
    }
    let mechs = h_mechByResource.get(resource.rsrcId);
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
/** API.VIEWMODEL:
 *  returns an object containing added, updated, removed arrays
 *  containing nodeId strings
 *  @return {object} - object { added, updated, removed }
 */
PMCData.VM_GetVPropChanges = () => {
  // remember that a_props is an array of string ids, not objects
  // therefore the returned arrays have values, not references! yay!
  const added = [];
  const updated = [];
  const removed = [];
  // find what matches and what is new
  a_props.forEach(id => {
    if (map_vprops.has(id)) updated.push(id);
    else added.push(id);
  });
  // removed ids exist in viewmodelPropMap but not in updated props
  map_vprops.forEach((val, id) => {
    if (!updated.includes(id)) removed.push(id);
  });
  return { added, removed, updated };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns TRUE if a VProp corresponding to nodeId exists
 *  @param {string} nodeId - the property with nodeId to test
 *  @return {boolean} - true if the nodeId exists
 */
PMCData.VM_VPropExists = nodeId => {
  return map_vprops.has(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns the VProp corresponding to nodeId if it exists
 *  @param {string} nodeId - the property with nodeId to retrieve
 *  @return {VProp} - VProp instance, if it exists
 */
PMCData.VM_VProp = nodeId => {
  return map_vprops.get(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  deletes the VProp corresponding to nodeId if it exists
 *  @param {string} nodeId - the property with nodeId to delete
 */
PMCData.VM_VPropDelete = nodeId => {
  map_vprops.delete(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  sets the VProp corresponding to nodeId
 *  @param {string} nodeId - the property with nodeId to add to viewmodel
 *  @param {VProp} vprop - the property with nodeId to add to viewmodel
 */
PMCData.VM_VPropSet = (nodeId, vprop) => {
  map_vprops.set(nodeId, vprop);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns an object containing added, updated, removed string arrays
 *  containing pathIds.
 */
PMCData.VM_GetVMechChanges = () => {
  // remember that a_mechs is an array of { v, w } edgeObjects.
  const added = [];
  const updated = [];
  const removed = [];
  // find what matches and what is new by pathid
  a_mechs.forEach(edgeObj => {
    const pathId = CoerceToPathId(edgeObj);
    if (map_vmechs.has(pathId)) {
      updated.push(pathId);
      if (DBG) console.log('updated', pathId);
    } else {
      added.push(pathId);
      if (DBG) console.log('added', pathId);
    }
  });
  // removed
  map_vmechs.forEach((val_vmech, key_pathId) => {
    if (!updated.includes(key_pathId)) {
      removed.push(key_pathId);
      if (DBG) console.log('removed', key_pathId);
    }
  });
  return { added, removed, updated };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns TRUE if the designated edge exists.
 *
 *  This function can accept one of three formats: an edgeObject, a pathId,
 *  or a source/target pair of nodeId strings.
 *  @param {object|string} evo - edgeObj {w,v}, pathId, or nodeId string of source
 *  @param {string|undefined} ew - if defined, nodeId string of the target prop */
PMCData.VM_VMechExists = (evo, ew) => {
  const pathId = CoerceToPathId(evo, ew);
  return map_vmechs.has(pathId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns the VMech corresponding to the designated edge if it exists
 *
 *  This function can accept one of three formats: an edgeObject, a pathId,
 *  or a source/target pair of nodeId strings.
 *  @param {object|string} evo - edgeObj {w,v}, pathId, or nodeId string of source
 *  @param {string|undefined} ew - if defined, nodeId string of the target prop
 */
PMCData.VM_VMech = (evo, ew) => {
  const pathId = CoerceToPathId(evo, ew);
  return map_vmechs.get(pathId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  deletes the VMech corresponding to designated edge if it exists
 *
 *  This function can accept one of three formats: an edgeObject, a pathId,
 *  or a source/target pair of nodeId strings.
 *  @param {object|string} evo - edgeObj {w,v}, pathId, or nodeId string of source
 *  @param {string|undefined} ew - if defined, nodeId string of the target prop
 */
PMCData.VM_VMechDelete = (evo, ew) => {
  const pathId = CoerceToPathId(evo, ew);
  map_vmechs.delete(pathId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  sets the VMech corresponding to the designated edge
 *
 *  This function can accept one of three formats: an edgeObject, a pathId,
 *  or a source/target pair of nodeId strings.
 *  @param {VMech} vmech - the VMech instance
 *  @param {object|string} evo - edgeObj {w,v}, pathId, or nodeId string of source
 *  @param {string|undefined} ew - if defined, nodeId string of the target prop
 */
PMCData.VM_VMechSet = (vmech, evo, ew) => {
  const pathId = CoerceToPathId(evo, ew);
  map_vmechs.set(pathId, vmech);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns an object containing added, updated, removed string arrays
 *  containing evIds.
 */
PMCData.VM_GetVBadgeChanges = () => {
  const added = [];
  const updated = [];
  const removed = [];
  // removed
  map_vbadges.forEach((val_badge, key_evId) => {
    // if both propId and mechId are undefined, then this evidenceLink
    // is not linking to any prop or mech, so delete the badge.
    if (val_badge.propId === undefined && val_badge.mechId === undefined) {
      removed.push(key_evId);
      if (DBG) console.log('removed', key_evId);
    }
  });
  // find what matches and what is new by pathid
  a_evidence.forEach(evLink => {
    const evId = evLink.evId;
    if (map_vbadges.has(evId)) {
      updated.push(evId);
      if (DBG) console.log('updated', evId);
    } else {
      added.push(evId);
      if (DBG) console.log('added', evId);
    }
  });
  return { added, removed, updated };
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns an object containing added, updated, removed string arrays
 *  containing evIds.
 */
PMCData.VM_GetVBadgeChangesRefactor = () => {
  /*\
    is there something wrong with this detecting code?

    * map_vbadges maps evId to vbadge
    * a_evidence contains { evId, propId: undefined, rsrcId, note }
    * resources and pmc elements are linked by evidence
    * any change in a piece of evidence potentially changes the vbadge
    * vbadges are associated with a vprop currently, holding a reference to its id

    vbadge update: this is a rating change or a vpropid change
    evidence deleted: vbadge should be removed
    evidence added: vbadge should be added
  \*/
  const added = [];
  const updated = [];
  const removed = [];
  // removed
  map_vbadges.forEach((val_badge, key_evId) => {
    // if both propId and mechId are undefined, then this evidenceLink
    // is not linking to any prop or mech, so delete the badge.
    if (val_badge.evlink.propId === undefined && val_badge.evlink.mechId === undefined) {
      removed.push(key_evId);
      if (DBG) console.log('removed', key_evId);
    }
  });
  // find what matches and what is new by pathid
  a_evidence.forEach(evLink => {
    const evId = evLink.evId;
    if (map_vbadges.has(evId)) {
      updated.push(evId);
      if (DBG) console.log('updated', evId);
    } else {
      added.push(evId);
      if (DBG) console.log('added', evId);
    }
  });
  return { added, removed, updated };
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns the VBadge corresponding to evId if it exists
 *  @param {string} evId - the property with evId to retrieve
 *  @return {VBadge} - VBadge instance, if it exists
 */
PMCData.VM_VBadge = evId => {
  return map_vbadges.get(evId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  deletes the VBadge corresponding to evId if it exists
 *  @param {string} evId - the property with evId to delete
 */
PMCData.VM_VBadgeDelete = evId => {
  map_vbadges.delete(evId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  Marks the VBadge for deletion with the next update loop.
 *  We mark it by setting the propId and mechId to undefined,
 *  since that is the link from the EvidenceLink object to the
 *  prop/mech object.  In VM_GetVBadgeChanges, if it finds
 *  both propId and mechId are undefined, it marks the badge
 *  for removal.
 *  The actual deletion happens with class_vprop / class_vmech
 *  @param {string} evId - the property/mech with evId to delete
 */
PMCData.VM_MarkBadgeForDeletion = evId => {
  let badge = PMCData.VM_VBadge(evId);
  if (badge) {
    badge.propId = undefined;
    badge.mechId = undefined;
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  sets the vobj (either a vprop or a vmech) corresponding to the designated
 *  evidenceLink id
 *
 *  Unlike vmech and vprop, evidence badges are drawn directly on the source
 *
 *  map_vbadges
 *      key: evId
 *      value: vbadge
 *
 *  @param {string} evId - the property with evId to add to viewmodel
 *  @param {VBadge} vbadge - the VBadge instance
 */
PMCData.VM_VBadgeSet = (evId, vbadge) => {
  map_vbadges.set(evId, vbadge);
};

/// SELECTION MANAGER TEMPORARY HOME //////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function u_DumpSelection(prompt) {
  if (prompt) console.log(prompt);
  console.table(PMCData.VM_SelectedProps());
}
/** API.VIEWMODEL:
 * add the vprop to the selection set. The vprop will be
 * updated in its appearance to reflect its new state.
 * @param {object} vprop - VProp instance with id property.
 */
PMCData.VM_SelectAddProp = vprop => {
  // set appropriate vprop flags
  vprop.visualState.Select();
  vprop.Draw();
  // update viewmodel
  selected_vprops.add(vprop.id);
  UR.Publish('SELECTION_CHANGED');
  if (DBG) u_DumpSelection('SelectAddProp');
};

/** API.VIEWMODEL:
 * set the vprop to the selection set. The vprop will be
 * updated in its appearance to reflect its new state.
 * @param {object} vprop - VProp instance with id property.
 */
PMCData.VM_SelectProp = vprop => {
  // set appropriate vprop flags
  vprop.visualState.Select();
  vprop.Draw();
  // update viewmodel
  selected_vprops.forEach(id => {
    const vp = PMCData.VM_VProp(id);
    vp.visualState.Deselect();
  });
  selected_vprops.clear();
  selected_vprops.add(vprop.id);
  UR.Publish('SELECTION_CHANGED');
  if (DBG) u_DumpSelection('SelectProp');
};

/* API.VIEWMODEL: Tracking Rollovers */
PMCData.VM_PropMouseEnter = vprop => {
  map_rollover.set(vprop.Id());
  const topPropId = PMCData.VM_PropsMouseOver().pop();
  if (vprop.Id() === topPropId) vprop.HoverState(true);
};
PMCData.VM_PropMouseExit = vprop => {
  if (vprop.posMode.isDragging) return;
  map_rollover.delete(vprop.Id());
  vprop.HoverState(false);
};
/**
 * Return the array of targets that are "hovered" over
 * @returns {array} propId array
 */
PMCData.VM_PropsMouseOver = () => {
  return [...map_rollover.keys()];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Remove the passed vprop from the selection set, if set. The vprop will be
 * updated in its appearance to reflect its new state.
 * @param {object} vprop - VProp instance with id property
 */
PMCData.VM_DeselectProp = vprop => {
  // set appropriate vprop flags
  vprop.visualState.Deselect();
  vprop.Draw();
  // update viewmodel
  selected_vprops.delete(vprop.id);
  UR.Publish('SELECTION_CHANGED');
  if (DBG) u_DumpSelection('DeselectProp');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Select or deselect the passed vprop.  The vprop will be
 * updated in its appearance to reflect its new state.
 * @param {object} vprop - VProp instance with id property
 */
PMCData.VM_ToggleProp = vprop => {
  // set appropriate vprop flags
  vprop.visualState.ToggleSelect();
  // update viewmodel
  if (vprop.visualState.IsSelected()) {
    selected_vprops.add(vprop.id);
    if (selected_vprops.size === 1) {
      vprop.visualState.Select('first');
    }
    vprop.Draw();
  } else {
    selected_vprops.delete(vprop.id);
    vprop.Draw();
  }
  UR.Publish('SELECTION_CHANGED');
  if (DBG) u_DumpSelection('ToggleProp');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * erase the selected properties set. Also calls affected vprops to
 * handle deselection update
 */
PMCData.VM_DeselectAllProps = () => {
  // tell all vprops to clear themselves
  selected_vprops.forEach(vpid => {
    const vprop = PMCData.VM_VProp(vpid);
    vprop.visualState.Deselect();
    vprop.Draw();
  });
  // clear selection viewmodel
  selected_vprops.clear();
  UR.Publish('SELECTION_CHANGED');
  if (DBG) u_DumpSelection('DeselectAllProps');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Deselect all vmechs. The vmechs will be updated in its
 * appearance to reflect its new state
 */
PMCData.VM_DeselectAllMechs = () => {
  // tell all vprops to clear themselves
  selected_vmechs.forEach(vmid => {
    const vmech = PMCData.VM_VMech(vmid);
    vmech.visualState.Deselect();
    vmech.Draw();
  });
  // clear selection viewmodel
  selected_vmechs.clear();
  if (DBG) console.log(`global selection`, selected_vmechs);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL
 * Delect all props and mechs. WARNING this is a method that is overly
 * broad.
 */
PMCData.VM_DeselectAll = () => {
  console.warn(`VM_DeselectAll() is deprecated. Use more specific selection manager calls.`);
  PMCData.VM_DeselectAllProps();
  PMCData.VM_DeselectAllMechs();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Select a single mechanism, clearing the existing selection.
 */
PMCData.VM_SelectOneMech = vmech => {
  // set appropriate vprop flags
  PMCData.VM_DeselectAllMechs();
  vmech.visualState.Select();
  vmech.Draw();
  // update viewmodel
  selected_vmechs.add(vmech.id);
  UR.Publish('SELECTION_CHANGED');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Select/deselect the passed vmech. The vmech will be updated in its
 * appearance to reflect its new state
 */
PMCData.VM_ToggleMech = vmech => {
  // set appropriate vprop flags
  vmech.visualState.ToggleSelect();
  // update viewmodel
  if (vmech.visualState.IsSelected()) {
    selected_vmechs.add(vmech.id);
    vmech.Draw();
  } else {
    selected_vmechs.delete(vmech.id);
    vmech.Draw();
  }
  if (DBG) console.log(`vmech selection`, selected_vmechs);
  UR.Publish('SELECTION_CHANGED');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 return array of all string ids that are currently selected PROPERTIES
 in order of insertion.
 Use VProp.visualState.IsSelected('first') to determine what the first
 selection is
 @returns {string[]} propIds - array of string ids of properties
 */
PMCData.VM_SelectedProps = () => {
  return Array.from(selected_vprops.values());
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 return array of all string ids that are currently selected MECHANISMS
 in order of insertion. Unlike the Props version of this call, the selection
 is not tagged with any other meta data (e.g. 'first')
 @returns {string[]} mechIds - array of string ids of properties
 */
PMCData.VM_SelectedMechs = () => {
  return Array.from(selected_vmechs.values());
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_AddProp = node => {
  m_graph.setNode(node, { name: `${node}` });
  PMCData.BuildModel();
  return `added node ${node}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_SetPropParent = (node, parent) => {
  m_graph.setParent(node, parent);
  PMCData.BuildModel();
  return `set parent ${parent} to node ${node}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_PropDelete = (propid = 'a') => {
  // Deselect the prop first, otherwise the deleted prop will remain selected
  PMCData.VM_DeselectAll();
  // Unlink any evidence
  const evlinks = PMCData.PropEvidence(propid);
  if (evlinks)
    evlinks.forEach(evlink => {
      PMCData.VM_MarkBadgeForDeletion(evlink.evId);
      PMCData.SetEvidenceLinkPropId(evlink.evId, undefined);
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
  return `deleted propid ${propid}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_AddMech = (sourceId, targetId, label) => {
  m_graph.setEdge(sourceId, targetId, { name: label });
  PMCData.BuildModel();
  return `added edge ${sourceId} ${targetId} ${label}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_MechDelete = mechId => {
  // mechId is of form "v:w"
  // Deselect the mech first, otherwise the deleted mech will remain selected
  PMCData.VM_DeselectAll();
  // Unlink any evidence
  const evlinks = PMCData.MechEvidence(mechId);
  if (evlinks)
    evlinks.forEach(evlink => {
      PMCData.VM_MarkBadgeForDeletion(evlink.evId);
      PMCData.SetEvidenceLinkMechId(evlink.evId, undefined);
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
  // HACK!  FIXME!  Need to properly generate a unique ID.
  let evId = `ev${Math.trunc(Math.random() * 10000)}`;
  a_evidence.push({ evId, propId: undefined, rsrcId, note });
  PMCData.BuildModel();
  return evId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_DeleteEvidenceLink = evId => {
  // Delete badges first
  PMCData.VM_MarkBadgeForDeletion(evId);
  // Then delete the link(s)
  let i = a_evidence.findIndex(e => {
    return e.evId === evId;
  });
  a_evidence.splice(i, 1);
  PMCData.BuildModel();
  return evId;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed propid (prop data object), returns evidence linked to the prop object.
 *  e.g. { evidenceId: '1', note: 'fish food fish food' }
 *  @param {string|undefined} nodeId - if defined, nodeId string of the prop (aka `propId`)
 */
PMCData.PropEvidence = propid => {
  return h_evidenceByProp.get(propid);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed evidence ID, returns the EvidenceLink object.
 *  @param {string|undefined} rsrcId - if defined, id string of the resource object
 */
PMCData.EvidenceLinkByEvidenceId = evId => {
  const evlink = a_evidence.find(item => {
    return item.evId === evId;
  });
  return evlink;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Set propId to `undefined` to unlink
PMCData.SetEvidenceLinkPropId = (evId, propId) => {
  let evlink = a_evidence.find(item => {
    return item.evId === evId;
  });
  evlink.propId = propId;
  // Call BuildModel to rebuild hash tables since we've added a new propId
  PMCData.BuildModel(); // DATA_UPDATED called by BuildModel()
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SetEvidenceLinkMechId = (evId, mechId) => {
  let evlink = a_evidence.find(item => {
    return item.evId === evId;
  });
  evlink.mechId = mechId;
  // Call BuildModel to rebuild hash tables since we've added a new mechId
  PMCData.BuildModel(); // DATA_UPDATED called by BuildModel()
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SetEvidenceLinkNote = (evId, note) => {
  let evlink = a_evidence.find(item => {
    return item.evId === evId;
  });
  evlink.note = note;
  UR.Publish('DATA_UPDATED');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SetEvidenceLinkRating = (evId, rating) => {
  let evlink = a_evidence.find(item => {
    return item.evId === evId;
  });
  if (evlink) {
    evlink.rating = rating;
    UR.Publish('DATA_UPDATED');
    return;
  }
  throw Error(`no evidence link with evId '${evId}' exists`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed parentId and parentType, returns the matching data object
 *  e.g. a property, mechanism, or evidence link
 *  @param {string} parentId - if defined, id string of the resource object
 *  @param {string} parentType - if defined, type of the resource object
 *                  'evidence', 'property', 'mechanism'
 *
 *  This is primarily used by the Sticky Notes system to look up the parent
 *  components that sticky notes belong to.
 */
PMCData.GetParent = (parentId, parentType) => {
  let parent = {};
  switch (parentType) {
    case 'evidence':
      parent = PMCData.EvidenceLinkByEvidenceId(parentId);
      break;
    default:
      console.error(PKG, 'GetParent parentType', parentType, 'not found');
  }
  return parent;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// STICKIES
///
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
 *  Given the passed parentId and parentType, returns the matching data object
 *  e.g. a property, mechanism, or evidence link
 *  @param {string} parentId - if defined, id string of the resource object
 *  @param {string} parentType - if defined, type of the resource object
 *                  'evidence', 'property', 'mechanism'
 *
 *  This is primarily used by the Sticky Notes system to look up the parent
 *  components that sticky notes belong to.
 */
PMCData.UpdateComments = (parentId, parentType, comments) => {
  let parent = PMCData.GetParent(parentId, parentType);
  parent.comments = comments;
  UR.Publish('STICKY:UPDATED');
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
 */
PMCData.GetEvLinkByResourceId = rsrcId => {
  return h_evlinkByResource.get(rsrcId);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed mechId (mech object), returns evidence linked to the mech object.
 *  e.g. { evidenceId: '1', note: 'fish food fish food' }
 *  @param {string|undefined} mechId - if defined, mechId string of the prop (aka `propId`)
 */
PMCData.MechEvidence = mechId => {
  return h_evidenceByMech.get(mechId);
};

/// DEBUG UTILS //////////////////////////////////////////////////////////////
if (window.may1 === undefined) window.may1 = {};
window.may1.PCM_Mech = PMCData.Mech;
window.may1.PMC_AddProp = PMCData.PMC_AddProp;
window.may1.PMC_AddMech = PMCData.PMC_AddMech;
window.may1.PMC_AddEvidenceLink = PMCData.PMC_AddEvidenceLink;
window.may1.VM_GetVEvLinkChanges = PMCData.VM_GetVEvLinkChanges;
window.may1.BuildModel = PMCData.BuildModel;
window.may1.OpenSticky = () => {
  UR.Publish('STICKY:OPEN', {
    targetType: 'component',
    targetId: 'tank',
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
  });
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 */
/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.VM = { map_vprops, map_vmechs };
export default PMCData;
