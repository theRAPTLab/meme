import { Graph, alg as GraphAlg, json as GraphJSON } from '@dagrejs/graphlib';
import { cssinfo, cssreset, cssdata } from './console-styles';
import DEFAULTS from './defaults';
import UR from '../../system/ursys';
import DataMap from '../../system/common-datamap';

const { CoerceToPathId, CoerceToEdgeObj } = DEFAULTS;

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @module VMData
 * @desc
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const VMData = {};

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'vm-data:';

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
let h_evidenceByEvId = new Map(); /*/
                          Hash table of an array of evidence links for
                          look up by evId.

                          Used by class-vprop when displaying
                          the list of evidenceLink badges for each prop.

                          {evId1: {evId1, propId, rsrcId, note},
                           evId2: {evId, propId, rsrcId, note},
                          ...}
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
/** API.VIEWMODEL:
 *  returns an object containing added, updated, removed arrays
 *  containing nodeId strings
 *  @return {object} - object { added, updated, removed }
 */
VMData.VM_GetVPropChanges = () => {
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
VMData.VM_VPropExists = nodeId => {
  return map_vprops.has(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns the VProp corresponding to nodeId if it exists
 *  @param {string} nodeId - the property with nodeId to retrieve
 *  @return {VProp} - VProp instance, if it exists
 */
VMData.VM_VProp = nodeId => {
  return map_vprops.get(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  deletes the VProp corresponding to nodeId if it exists
 *  @param {string} nodeId - the property with nodeId to delete
 */
VMData.VM_VPropDelete = nodeId => {
  map_vprops.delete(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  sets the VProp corresponding to nodeId
 *  @param {string} nodeId - the property with nodeId to add to viewmodel
 *  @param {VProp} vprop - the property with nodeId to add to viewmodel
 */
VMData.VM_VPropSet = (nodeId, vprop) => {
  map_vprops.set(nodeId, vprop);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns an object containing added, updated, removed string arrays
 *  containing pathIds.
 */
VMData.VM_GetVMechChanges = () => {
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
VMData.VM_VMechExists = (evo, ew) => {
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
VMData.VM_VMech = (evo, ew) => {
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
VMData.VM_VMechDelete = (evo, ew) => {
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
VMData.VM_VMechSet = (vmech, evo, ew) => {
  const pathId = CoerceToPathId(evo, ew);
  map_vmechs.set(pathId, vmech);
};

/// SELECTION MANAGER TEMPORARY HOME //////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function u_DumpSelection(prompt) {
  if (prompt) console.log(prompt);
  console.table(VMData.VM_SelectedPropsIds());
}
/** API.VIEWMODEL:
 * add the vprop to the selection set. The vprop will be
 * updated in its appearance to reflect its new state.
 * @param {object} vprop - VProp instance with id property.
 */
VMData.VM_SelectAddProp = vprop => {
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
VMData.VM_SelectProp = vprop => {
  // set appropriate vprop flags
  vprop.visualState.Select();
  vprop.Draw();
  // update viewmodel
  selected_vprops.forEach(id => {
    const vp = VMData.VM_VProp(id);
    vp.visualState.Deselect();
  });
  selected_vprops.clear();
  selected_vprops.add(vprop.id);
  UR.Publish('SELECTION_CHANGED');
  if (DBG) u_DumpSelection('SelectProp');
};

/* API.VIEWMODEL: Tracking Rollovers */
VMData.VM_PropMouseEnter = vprop => {
  map_rollover.set(vprop.Id());
  const topPropId = VMData.VM_PropsMouseOver().pop();
  if (vprop.Id() === topPropId) vprop.HoverState(true);
};
VMData.VM_PropMouseExit = vprop => {
  if (vprop.posMode.isDragging) return;
  map_rollover.delete(vprop.Id());
  vprop.HoverState(false);
};
/**
 * Return the array of targets that are "hovered" over
 * @returns {array} propId array
 */
VMData.VM_PropsMouseOver = () => {
  return [...map_rollover.keys()];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Remove the passed vprop from the selection set, if set. The vprop will be
 * updated in its appearance to reflect its new state.
 * @param {object} vprop - VProp instance with id property
 */
VMData.VM_DeselectProp = vprop => {
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
VMData.VM_ToggleProp = vprop => {
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
VMData.VM_DeselectAllProps = () => {
  // tell all vprops to clear themselves
  selected_vprops.forEach(vpid => {
    const vprop = VMData.VM_VProp(vpid);
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
VMData.VM_DeselectAllMechs = () => {
  // tell all vprops to clear themselves
  selected_vmechs.forEach(vmid => {
    const vmech = VMData.VM_VMech(vmid);
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
VMData.VM_DeselectAll = () => {
  console.warn(`VM_DeselectAll() is deprecated. Use more specific selection manager calls.`);
  VMData.VM_DeselectAllProps();
  VMData.VM_DeselectAllMechs();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Select a single mechanism, clearing the existing selection.
 */
VMData.VM_SelectOneMech = vmech => {
  // set appropriate vprop flags
  VMData.VM_DeselectAllMechs();
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
VMData.VM_ToggleMech = vmech => {
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
VMData.VM_SelectedPropsIds = () => {
  return Array.from(selected_vprops.values());
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 return array of all string ids that are currently selected MECHANISMS
 in order of insertion. Unlike the Props version of this call, the selection
 is not tagged with any other meta data (e.g. 'first')
 @returns {string[]} mechIds - array of string ids of properties
 */
VMData.VM_SelectedMechIds = () => {
  return Array.from(selected_vmechs.values());
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VMData.PMC_AddProp = node => {
  m_graph.setNode(node, { name: `${node}` });
  VMData.BuildModel();
  return `added node ${node}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VMData.PMC_SetPropParent = (node, parent) => {
  m_graph.setParent(node, parent);
  VMData.BuildModel();
  return `set parent ${parent} to node ${node}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VMData.PMC_PropDelete = (propid = 'a') => {
  // Deselect the prop first, otherwise the deleted prop will remain selected
  VMData.VM_DeselectAll();
  // Unlink any evidence
  const evlinks = VMData.PropEvidence(propid);
  if (evlinks)
    evlinks.forEach(evlink => {
      VMData.VM_MarkBadgeForDeletion(evlink.evId);
      VMData.SetEvidenceLinkPropId(evlink.evId, undefined);
    });
  // Delete any children nodes
  const children = VMData.Children(propid);
  if (children)
    children.forEach(cid => {
      VMData.PMC_SetPropParent(cid, undefined);
    });
  // Then remove propid
  m_graph.removeNode(propid);
  VMData.BuildModel();
  return `deleted propid ${propid}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VMData.PMC_AddMech = (sourceId, targetId, label) => {
  m_graph.setEdge(sourceId, targetId, { name: label });
  VMData.BuildModel();
  return `added edge ${sourceId} ${targetId} ${label}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VMData.PMC_MechDelete = mechId => {
  // mechId is of form "v:w"
  // Deselect the mech first, otherwise the deleted mech will remain selected
  VMData.VM_DeselectAll();
  // Unlink any evidence
  const evlinks = VMData.MechEvidence(mechId);
  if (evlinks)
    evlinks.forEach(evlink => {
      VMData.VM_MarkBadgeForDeletion(evlink.evId);
      VMData.SetEvidenceLinkMechId(evlink.evId, undefined);
    });
  // Then remove mech
  // FIXME / REVIEW : Do we need to use `name` to distinguish between
  // multiple edges between the same source target?
  // FIXME / REVIEW: Do we need add a definition for splitting a
  // pathId to v / w ?
  let vw = mechId.split(':');
  m_graph.removeEdge(vw[0], vw[1]);
  VMData.BuildModel();
  return `deleted edge ${mechId}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VMData.PMC_AddEvidenceLink = (rsrcId, note = '') => {
  // HACK!  FIXME!  Need to properly generate a unique ID.
  let evId = `ev${Math.trunc(Math.random() * 10000)}`;

  // Construct number, e.g. "2c"
  // 1. Ordinal value of resource in resource library, e.g. "2"
  const prefix = VMData.PMC_GetResourceIndex(rsrcId);
  // 2. Ordinal value of evlink in evlink list, e.g. "c"
  const evlinks = VMData.GetEvLinksByResourceId(rsrcId);
  const numberOfEvLinks = evlinks.length;
  const count = String.fromCharCode(97 + numberOfEvLinks); // lower case for smaller footprint

  const number = String(prefix) + count;
  a_evidence.push({ evId, propId: undefined, rsrcId, number, note });
  VMData.BuildModel();
  return evId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Returns the 1-based index of the resource in the resource list.
 *  This is used for numbering evidence links, e.g. "2a"
 */
VMData.PMC_GetResourceIndex = rsrcId => {
  const index = a_resources.findIndex(r => r.id === rsrcId);
  if (index === -1) console.error(PKG, 'PMC_GetResourceIndex could not find', rsrcId);
  return index + 1;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 * @returns {string} EvId of the duplicated EvidenceLink object
 */
VMData.PMC_DuplicateEvidenceLink = evId => {
  // First get the old link
  const oldlink = VMData.EvidenceLinkByEvidenceId(evId);
  // Create new evlink
  let newEvId = VMData.PMC_AddEvidenceLink(oldlink.rsrcId, oldlink.note);
  return newEvId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VMData.PMC_DeleteEvidenceLink = evId => {
  // Delete badges first
  VMData.VM_MarkBadgeForDeletion(evId);
  // Then delete the link(s)
  let i = a_evidence.findIndex(e => {
    return e.evId === evId;
  });
  a_evidence.splice(i, 1);
  VMData.BuildModel();
  return evId;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed propid (prop data object), returns evidence linked to the prop object.
 *  e.g. { evidenceId: '1', note: 'fish food fish food' }
 *  @param {string|undefined} nodeId - if defined, nodeId string of the prop (aka `propId`)
 *  @return [evlinks] evidenceLink objects
 */
VMData.PropEvidence = propid => {
  return h_evidenceByProp.get(propid);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed evidence ID, returns the EvidenceLink object.
 *  @param {string|undefined} rsrcId - if defined, id string of the resource object
 */
VMData.EvidenceLinkByEvidenceId = evId => {
  return h_evidenceByEvId.get(evId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Set propId to `undefined` to unlink
VMData.SetEvidenceLinkPropId = (evId, propId) => {
  let evlink = a_evidence.find(item => {
    return item.evId === evId;
  });
  evlink.propId = propId;
  // Call BuildModel to rebuild hash tables since we've added a new propId
  VMData.BuildModel(); // DATA_UPDATED called by BuildModel()
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VMData.SetEvidenceLinkMechId = (evId, mechId) => {
  let evlink = a_evidence.find(item => {
    return item.evId === evId;
  });
  evlink.mechId = mechId;
  // Call BuildModel to rebuild hash tables since we've added a new mechId
  VMData.BuildModel(); // DATA_UPDATED called by BuildModel()
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VMData.SetEvidenceLinkNote = (evId, note) => {
  let evlink = a_evidence.find(item => {
    return item.evId === evId;
  });
  evlink.note = note;
  UR.Publish('DATA_UPDATED');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VMData.SetEvidenceLinkRating = (evId, rating) => {
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
/// STICKIES //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * @param {string} id - id of Property or Mechanism
 * @return [array] Array of comment objects, or [] if none defined.
 */
VMData.GetComments = id => {
  const result = a_commentThreads.find(c => {
    return c.id === id;
  });
  return result ? result.comments : [];
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
VMData.GetParent = (parentId, parentType) => {
  let parent = {};
  switch (parentType) {
    case 'evidence':
      parent = VMData.EvidenceLinkByEvidenceId(parentId);
      break;
    default:
      console.error(PKG, 'GetParent parentType', parentType, 'not found');
  }
  return parent;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Returns an empty sticky with the current student info
 *  @param {string} author - author's studentId
 *  @param {string} sentenceStarter - placeholder text for a new comment
 * */
VMData.NewComment = (author, sentenceStarter) => {
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
 *  @param {string} parentType - if defined, type of the resource object
 *                  'evidence', 'property', 'mechanism'
 *  @param [object] comments - Array of comment objects
 *
 *  This is primarily used by the Sticky Notes system to save chagnes to
 *  comment text.
 */
VMData.UpdateComments = (parentId, parentType, comments) => {
  let parent;
  let index;
  let comment;
  switch (parentType) {
    case 'evidence':
      parent = VMData.GetParent(parentId, parentType);
      parent.comments = comments;
      break;
    case 'propmech':
      // Update existing comment
      index = a_commentThreads.findIndex(c => {
        return c.id === parentId;
      });
      if (index > -1) {
        comment = a_commentThreads[index];
        comment.comments = comments;
        a_commentThreads.splice(index, 1, comment);
      } else {
        comment = { id: parentId, comments }; // new comment
        a_commentThreads.push(comment);
      }
      break;
    default:
      console.error(PKG, 'UpdateComments could not match parent type', parentType);
  }
  UR.Publish('DATA_UPDATED');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed resource ID, returns array of prop ids linked to the resource object.
 *  @param {string|undefined} rsrcId - if defined, id string of the resource object
 */
VMData.GetPropIdsByResourceId = rsrcId => {
  return h_propByResource.get(rsrcId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed resource ID, returns array of prop ids linked to the resource object.
 *  @param {string|undefined} rsrcId - if defined, id string of the resource object
 *  @return {array} Array of propery ids
 */
VMData.GetEvLinksByResourceId = rsrcId => {
  return h_evlinkByResource.get(rsrcId);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed mechId (mech object), returns evidence linked to the mech object.
 *  e.g. { evidenceId: '1', note: 'fish food fish food' }
 *  @param {string|undefined} mechId - if defined, mechId string of the prop (aka `propId`)
 */
VMData.MechEvidence = mechId => {
  return h_evidenceByMech.get(mechId);
};

/// DEBUG UTILS //////////////////////////////////////////////////////////////
if (window.may1 === undefined) window.may1 = {};
window.may1.PCM_Mech = VMData.Mech;
window.may1.PMC_AddProp = VMData.PMC_AddProp;
window.may1.PMC_AddMech = VMData.PMC_AddMech;
window.may1.PMC_AddEvidenceLink = VMData.PMC_AddEvidenceLink;
window.may1.VM_GetVEvLinkChanges = VMData.VM_GetVEvLinkChanges;
window.may1.BuildModel = VMData.BuildModel;
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

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VMData.VM = { map_vprops, map_vmechs };
export default VMData;
