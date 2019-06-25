import SVGJS from '@svgdotjs/svg.js/src/svg';
import DATA from './pmc-data';
import VProp from './class-vprop-refactor';
import VMech from './class-vmech';
import { cssinfo, cssalert, csstab } from './console-styles';
import UR from '../../system/ursys';
import DEFAULTS from './defaults';

const { PAD, SVGDEFS, COLOR, UTIL } = DEFAULTS;
console.log('%cWARN: using PMCView Refactor', cssalert);

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @module PMCViewRefactor
 * @desc
 * Manages the SVGJS instance that is contained by SVGView.
 *
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PMCView = {};

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_element;
let m_svgroot;
const DBG = false;

/// REFLECT DUMP
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// console.log(`Reflection test`, UTIL.DumpObj(DATA));

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.Sub('PROP:MOVED', data => {
  VMech.DrawEdges();
});

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * API: Create an SVGJS-wrapped <svg> child element of `container`.
 * @param {HTMLElement} container - Where to add SVGJS <svg> root element
 */
PMCView.InitializeViewgraph = container => {
  m_element = container;
  m_svgroot = SVGJS(m_element);
  m_svgroot.mousedown(() => {
    DATA.VM_DeselectAll();
  });
  PMCView.DefineDefs(m_svgroot);
  PMCView.DefineSymbols(m_svgroot);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * PRIVATE: Define named svg "defs" for reuse in the view. For example, arrowheads.
 * It shouldn't be called externally.
 * @param {SVGJSinstance} svg - SVGJS instance to add DEFs to
 */
PMCView.DefineDefs = svg => {
  SVGDEFS.set(
    'arrowEndHead',
    svg
      .marker(4, 4, add => {
        add.path('M0,0 L0,4 L4,2 Z').fill(COLOR.MECH);
      })
      .attr({ id: 'arrowEndHead', orient: 'auto', refX: 4 })
  );
  SVGDEFS.set(
    'arrowStartHead',
    svg
      .marker(4, 4, add => {
        add.path('M4,4 L4,0 L0,2 Z').fill(COLOR.MECH);
      })
      .attr({ id: 'arrowStartHead', orient: 'auto', refX: 0 })
  );
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * PRIVATE: Define named svg "symbols" for reuse in the view.
 * It shouldn't be called externally.
 * @param {SVGJSinstance} svg - SVGJS instance to add DEFs to
 */
PMCView.DefineSymbols = svg => { };


/// LIFECYCLE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * LIFECYCLE: Get user inputs (external buttons, clcks, keypresses) and
 * convert physical controls like "up arrow" into app-domain intentions
 * (for example, a queued "move piece up" command)
 */
PMCView.GetIntent = () => {
  console.log('GetIntent() unimplemented');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * LIFECYCLE: Application mode settings, which might be set by the previous
 * lifecycle, are processed by adjusting whatever data structures will affect
 * subsequent mode-related processing (e.g. setting spacing before layout)
 */
PMCView.SyncModeSettings = () => {
  console.log('SyncModeSettings() unimplemented');
};
/**
 * LIFECYCLE: Synchs PMC property changes from model to the
 * viewmodel. In other words, the pure data (model) is processed and the data
 * structures that are used to *display* the data (viewmodel) is updated.
 */
PMCView.SyncPropsFromGraphData = () => {
  if (DBG) console.groupCollapsed(`%c:SyncPropsFromGraphData()`, cssinfo);
  const { added, removed, updated } = DATA.VM_GetVPropChanges();
  removed.forEach(id => {
    VProp.Release(id);
  });
  added.forEach(id => {
    const vprop = VProp.New(id, m_svgroot);
  });
  updated.forEach(id => {
    VProp.Update(id);
  });
  if (DBG) {
    if (removed.length) console.log(`%c:Removing ${removed.length} dead nodes`, csstab);
    if (added.length) console.log(`%c:Adding ${added.length} new nodes`, csstab);
    if (updated.length) console.log(`%c:Updating ${updated.length} nodes`, csstab);
    console.groupEnd();
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * LIFECYCLE: Syncs PMC mechanism changes from model to the viewmodel. In other
 * words, the pure mechanism data (model) is processed and the *display* data
 * structures (the viewmodel) is updated to reflect it.
 */
PMCView.SyncMechsFromGraphData = () => {
  if (DBG) console.groupCollapsed(`%c:SyncMechsFromGraphData()`, cssinfo);
  // the following arrays contain pathIds
  const { added, removed, updated } = DATA.VM_GetVMechChanges();
  removed.forEach(pathId => {
    VMech.Release(pathId);
    DATA.VM_VMechDelete(pathId);
  });
  added.forEach(pathId => {
    const vmech = VMech.New(pathId, m_svgroot);
    DATA.VM_VMechSet(vmech, pathId);
  });
  updated.forEach(pathId => {
    VMech.Update(pathId);
  });
  if (DBG) {
    if (removed.length) console.log(`%c:Removing ${removed.length} dead edgeObjs`, csstab);
    if (added.length) console.log(`%c:Adding ${added.length} new edgeObjs`, csstab);
    if (updated.length) console.log(`%c:Updating ${updated.length} edgeObjs`, csstab);
    console.groupEnd();
  }
};
/**
 * LIFECYCLE: Syncs PMC property changes from model to the
 * viewmodel. In other words, the pure data (model) is processed and the data
 * structures that are used to *display* the data (viewmodel) is updated.
 */
PMCView.SyncBadgesFromEvLinkData = () => {
  if (DBG) console.groupCollapsed(`%c:SyncBadgesFromEvLinkData()`, cssinfo);
  const { added, removed, updated } = DATA.VM_GetVBadgeChanges();
  removed.forEach(id => {
    VProp.ReleaseBadge(id);
  });
  added.forEach(id => {
    const vprop = VProp.NewBadge(id, m_svgroot);
  });
  updated.forEach(id => {
    VProp.UpdateBadge(id);
  });
  if (DBG) {
    if (removed.length) console.log(`%c:Removing ${removed.length} dead badges`, csstab);
    if (added.length) console.log(`%c:Adding ${added.length} new badges`, csstab);
    if (updated.length) console.log(`%c:Updating ${updated.length} badges`, csstab);
    console.groupEnd();
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * LIFECYCLE: Update the model and dependent derived model structures.
 * CURRENTLY NOT USED!!!
 */
PMCView.UpdateModel = () => {
  console.log(`UpdateModel() unimplemented`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * LIFECYCLE: Update the viewmodel based on the model. It walks the component
 * list and calculates how to resize them so they are properly drawn nested.
 */
PMCView.UpdateViewModel = () => {
  if (DBG) console.groupCollapsed(`%c:UpdateViewModel()`, cssinfo);

  // first get the list of component ids to walk through
  const components = DATA.Components();

  // walk through every component
  components.forEach(compId => {
    VProp.MoveToRoot(compId);
    const bbox = u_Recurse(compId);
  });
  if (DBG) console.groupEnd();
};

// given a propId, set dimension data for each property
// set the component directly
// return struct { id, w, h } w/out padding
function u_Recurse(propId) {
  const propVis = VProp.GetVisual(propId);
  const self = propVis.GetDataBBox();
  self.h += PAD.MIN;
  if (DBG) console.group(`${propId} recurse`);
  /* WALK CHILD PROPS */
  const childIds = DATA.Children(propId);
  // if there are no children, break recursion
  if (childIds.length === 0) {
    propVis.SetSize(self);
    propVis.SetKidsBBox({ w: 0, h: 0 });
    if (DBG) console.groupEnd();
    return self;
  }
  // otherwise, let's recurse!
  let sizes = [];
  childIds.forEach(childId => {
    const childVis = VProp.GetVisual(childId);
    childVis.ToParent(propId);
    const size = u_Recurse(childId);
    childVis.SetKidsBBox(size);
    sizes.push(size);
  });
  //
  const pbox = sizes.reduce((accbox, item) => {
    return {
      id: propId,
      w: Math.max(accbox.w, item.w),
      h: accbox.h + item.h
    };
  });
  // adjust size
  const all = {
    id: pbox.id,
    w: Math.max(self.w, pbox.w) + PAD.MIN2,
    h: self.h + pbox.h
  };
  all.h += childIds.length > 1 ? PAD.MIN2 : PAD.MIN;
  propVis.SetSize(all);
  propVis.SetKidsBBox(all);
  if (DBG) console.groupEnd();
  return all;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * LIFECYCLE: Draws the current view from the updated viewmodel. Currently
 * handles layout and edge drawing.
 */
PMCView.UpdateView = () => {
  if (DBG) console.groupCollapsed(`%c:UpdateView()`, cssinfo);
  VProp.LayoutComponents();
  VMech.DrawEdges();
  if (DBG) console.groupEnd();
};

window.PMC = PMCView;

if (window.may1 === undefined) window.may1 = {};
window.may1.Update = () => {
  PMCView.SyncPropsFromGraphData();
  PMCView.SyncMechsFromGraphData();
  PMCView.SyncBadgesFromEvLinkData();
  PMCView.UpdateViewModel();
  PMCView.UpdateView();
}
window.may1.ForceUpdate = () => {
  UR.Publish('FORCE_UPDATE');
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default PMCView;
