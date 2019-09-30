import { cssinfo, cssreset, cssdata } from './console-styles';
import DEFAULTS from './defaults';
import UR from '../../system/ursys';
import UTILS from './utils';

/// VIEWMODEL /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const map_vprops = new Map(); // our property viewmodel data stored by id
const map_vmechs = new Map(); // our mechanism viewmodel data stored by pathid
const selected_vprops = new Set();
const selected_vmechs = new Set();
const map_rollover = new Map();

let max_selections = 1; // Limit the number of objects that can be selected simultaneously

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'VMDATA';
const { CoerceToPathId, CoerceToEdgeObj } = DEFAULTS;
const MOD = {};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns an object containing added, updated, removed arrays
 *  containing nodeId strings
 *  @return {object} - object { added, updated, removed }
 */
MOD.VM_GetVPropChanges = all_props => {
  // remember that all_props is an array of string ids, not objects
  // therefore the returned arrays have values, not references! yay!
  const added = [];
  const updated = [];
  const removed = [];
  // find what matches and what is new
  all_props.forEach(id => {
    if (map_vprops.has(id)) {
      updated.push(id);
      // if (DBG) console.log('updated prop', id);
    } else {
      added.push(id);
      if (DBG) console.log('added prop', id);
    }
  });
  // removed ids exist in viewmodelPropMap but not in updated props
  map_vprops.forEach((val, id) => {
    if (!updated.includes(id)) {
      removed.push(id);
      if (DBG) console.log('removed prop', id);
    }
  });
  return { added, removed, updated };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns TRUE if a VProp corresponding to nodeId exists
 *  @param {string} nodeId - the property with nodeId to test
 *  @return {boolean} - true if the nodeId exists
 */
MOD.VM_VPropExists = nodeId => {
  return map_vprops.has(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns the VProp corresponding to nodeId if it exists
 *  @param {string} nodeId - the property with nodeId to retrieve
 *  @return {VProp} - VProp instance, if it exists
 */
MOD.VM_VProp = nodeId => {
  return map_vprops.get(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  deletes the VProp corresponding to nodeId if it exists
 *  @param {string} nodeId - the property with nodeId to delete
 */
MOD.VM_VPropDelete = nodeId => {
  map_vprops.delete(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  sets the VProp corresponding to nodeId
 *  @param {string} nodeId - the property with nodeId to add to viewmodel
 *  @param {VProp} vprop - the property with nodeId to add to viewmodel
 */
MOD.VM_VPropSet = (nodeId, vprop) => {
  map_vprops.set(nodeId, vprop);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns an object containing added, updated, removed string arrays
 *  containing pathIds.
 */
MOD.VM_GetVMechChanges = all_mechs => {
  // remember that all_mechs is an array of { v, w } edgeObjects.
  const added = [];
  const updated = [];
  const removed = [];
  // find what matches and what is new by pathid
  all_mechs.forEach(edgeObj => {
    const pathId = CoerceToPathId(edgeObj);
    if (map_vmechs.has(pathId)) {
      updated.push(pathId);
      // if (DBG) console.log('updated mech', pathId);
    } else {
      added.push(pathId);
      if (DBG) console.log('added mech', pathId);
    }
  });
  // removed
  map_vmechs.forEach((val_vmech, key_pathId) => {
    if (!updated.includes(key_pathId)) {
      removed.push(key_pathId);
      if (DBG) console.log('removed mech', key_pathId);
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
MOD.VM_VMechExists = (evo, ew) => {
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
MOD.VM_VMech = (evo, ew) => {
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
MOD.VM_VMechDelete = (evo, ew) => {
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
MOD.VM_VMechSet = (vmech, evo, ew) => {
  const pathId = CoerceToPathId(evo, ew);
  map_vmechs.set(pathId, vmech);
};

/// SELECTION MANAGER TEMPORARY HOME //////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function vm_DumpSelection(prompt) {
  if (prompt) console.log(prompt);
  console.table(MOD.VM_SelectedPropsIds());
}
/** API.VIEWMODEL:
 * add the vprop to the selection set. The vprop will be
 * updated in its appearance to reflect its new state.
 * @param {object} vprop - VProp instance with id property.
 */
MOD.VM_SelectAddProp = vprop => {
  // set appropriate vprop flags
  vprop.visualState.Select();
  vprop.Draw();
  // update viewmodel
  selected_vprops.add(vprop.id);
  UR.Publish('SELECTION_CHANGED');
  if (DBG) vm_DumpSelection('SelectAddProp');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * set the vprop to the selection set. The vprop will be
 * updated in its appearance to reflect its new state.
 * @param {object} vprop - VProp instance with id property.
 */
MOD.VM_SelectProp = vprop => {
  // set appropriate vprop flags
  vprop.visualState.Select();
  vprop.Draw();
  // update viewmodel
  selected_vprops.forEach(id => {
    const vp = MOD.VM_VProp(id);
    vp.visualState.Deselect();
  });
  selected_vprops.clear();
  selected_vprops.add(vprop.id);
  UR.Publish('SELECTION_CHANGED');
  if (DBG) vm_DumpSelection('SelectProp');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** internal function:
 * Called by drag/drop when a mouseenter event occurs
 */
MOD.VM_PropMouseEnter = vprop => {
  map_rollover.set(vprop.Id());
  const topPropId = MOD.VM_PropsMouseOver().pop();
  if (vprop.Id() === topPropId) vprop.HoverState(true);
};
/** internal function:
 * Called by drag/drop when a mouseexit event occurs
 */
MOD.VM_PropMouseExit = vprop => {
  if (vprop.posMode.isDragging) return;
  map_rollover.delete(vprop.Id());
  vprop.HoverState(false);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.UI:
 * Return the array of targets that are currently "hovered" over
 * @returns {array} propId array
 */
MOD.VM_PropsMouseOver = () => {
  return [...map_rollover.keys()];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Set the maximum number of objects the user can select.
 * After the limit is reached, users can not select any additional objects
 * though they can still toggle existing objects.
 * @oaram {integer} max - Maximum number of selected objects allowed.
 */
MOD.VM_SetSelectionLimit = max => {
  max_selections = max;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Remove the passed vprop from the selection set, if set. The vprop will be
 * updated in its appearance to reflect its new state.
 * @param {object} vprop - VProp instance with id property
 */
MOD.VM_DeselectProp = vprop => {
  // set appropriate vprop flags
  vprop.visualState.Deselect();
  vprop.Draw();
  // update viewmodel
  selected_vprops.delete(vprop.id);
  UR.Publish('SELECTION_CHANGED');
  if (DBG) vm_DumpSelection('DeselectProp');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Select or deselect the passed vprop.  The vprop will be
 * updated in its appearance to reflect its new state.
 * @param {object} vprop - VProp instance with id property
 */
MOD.VM_ToggleProp = vprop => {
  // limit the number of selections, but allow toggle
  if (selected_vprops.size >= max_selections) {
    // If we hit the limit...
    if (max_selections === 1) {
      // ...and the limit is 1, deselect all and select this one
      DeselectAllProps();
    } else {
      // ...and the limit is more than one, don't alow any more selections
      return;
    }
  }

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
  if (DBG) vm_DumpSelection('ToggleProp');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Utility function
 * This is so we can deselect without triggering a UR event.
 */
function DeselectAllProps() {
  // tell all vprops to clear themselves
  selected_vprops.forEach(vpid => {
    const vprop = MOD.VM_VProp(vpid);
    vprop.visualState.Deselect();
    vprop.Draw();
  });
  // clear selection viewmodel
  selected_vprops.clear();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * erase the selected properties set. Also calls affected vprops to
 * handle deselection update
 */
MOD.VM_DeselectAllProps = () => {
  DeselectAllProps();
  UR.Publish('SELECTION_CHANGED');
  if (DBG) vm_DumpSelection('DeselectAllProps');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Deselect all vmechs. The vmechs will be updated in its
 * appearance to reflect its new state
 */
MOD.VM_DeselectAllMechs = () => {
  // tell all vprops to clear themselves
  selected_vmechs.forEach(vmid => {
    const vmech = MOD.VM_VMech(vmid);
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
MOD.VM_DeselectAll = () => {
  console.warn(`VM_DeselectAll() is deprecated. Use more specific selection manager calls.`);
  MOD.VM_DeselectAllProps();
  MOD.VM_DeselectAllMechs();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Select a single mechanism, clearing the existing selection.
 */
MOD.VM_SelectOneMech = vmech => {
  // set appropriate vprop flags
  MOD.VM_DeselectAllMechs();
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
MOD.VM_ToggleMech = vmech => {
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
MOD.VM_SelectedPropsIds = () => {
  return Array.from(selected_vprops.values());
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 return array of all string ids that are currently selected MECHANISMS
 in order of insertion. Unlike the Props version of this call, the selection
 is not tagged with any other meta data (e.g. 'first')
 @returns {string[]} mechIds - array of string ids of properties
 */
MOD.VM_SelectedMechIds = () => {
  return Array.from(selected_vmechs.values());
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default MOD;
