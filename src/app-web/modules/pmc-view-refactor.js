import SVGJS from '@svgdotjs/svg.js/src/svg';
import DATA from './pmc-data';
import VProp from './class-vprop-refactor';
import VMech from './class-vmech';
import { cssinfo, cssalert, csstab, cssdraw } from './console-styles';
import UR from '../../system/ursys';
import DEFAULTS from './defaults';

const { PAD, SVGDEFS, COLOR } = DEFAULTS;
console.log('%cWARN: using PMCView Refactor', cssalert);

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @module PMCViewRefactor
 * @desc
 * Manages the SVGJS instance that is contained by SVGView.
 * It also maintains the list of
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PMCView = {};

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_element;
let m_svgroot;
const DBG = false;

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.Sub('PROP:MOVED', data => {
  if (data) {
    VMech.DrawEdges();
  }
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
PMCView.TestGroups = () => {
  m_svgroot.clear();
  const gt = m_svgroot.group();
  const gm = m_svgroot.group();

  console.group('%cTEST GROUP TRANSFORMS', cssdraw);
  /* TEST TRANSFORM on GROUP, MOVE on ELEMENTS */
  gt.text(add => {
    add.tspan('group using transform').newLine();
    add.tspan('added elements using move').newLine();
  }).move(0, 110);
  // create a rect at 0,0 with width 100,100
  gt.rect(100, 100).fill({ color: `#550000` });
  /* TRANSFORM GROUP */
  gt.transform({ translateX: 50, translateY: 100 });
  // add another small rect at 0,0, size 10, transform to 10,10
  gt.rect(10, 10)
    .fill({ color: 'red' })
    .transform({ translateX: 10, translateY: 10 });
  /* TRANSFORM GROUP AGAIN */
  gt.transform({ translateX: 50, translateY: 200 });
  // add a circle on root svg at 0,0 radius 20, centered at 50,50
  // then add to group
  const gtc = m_svgroot
    .circle(20, 20)
    .fill({ color: 'red' })
    .center(50, 50);
  gt.add(gtc);
  /* BECAUSE TRANSFORM IS ADDED TO GROUP, ALL CHILDREN INHERIT */

  /* TEST MOVE on GROUP, MOVE on ELEMENTS */
  gm.text(add => {
    add.tspan('group using move').newLine();
    add.tspan('added elements using move').newLine();
  }).move(0, 110);
  // create a rect at 0,0 with width 100,100
  gm.rect(100, 100).fill({ color: '#005500' });
  /* MOVE GROUP */
  gm.move(200, 50);
  // add another small rect at 0,0, size 10, transform to 10,10
  gm.rect(10, 10)
    .fill({ color: 'green' })
    .move(10, 10);
  /* MOVE GROUP AGAIN */
  gm.move(300, 50);
  // add a circle on root svg at 0,0 radius 20, centered at 50,50
  // then add to group
  const gmc = m_svgroot
    .circle(20, 20)
    .fill({ color: 'green' })
    .center(50, 50);
  gm.add(gmc);
  /* BECAUSE GROUP IS MOVED BUT TRANSFORM ISN'T SHARED, ALL CHILDREN
     ARE DRAWN RELATIVE TO ORIGIN
  */

  console.groupEnd();
  /* GLOBALS */
  window.gt = gt;
  window.gm = gm;
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
PMCView.DefineSymbols = svg => {
  console.log('no symbols to add to', svg);
};

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
  removed.forEach(id => VProp.Release(id));
  added.forEach(id => VProp.New(id, m_svgroot)); // returns vprop instance but not using
  updated.forEach(id => VProp.Update(id));
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
  removed.forEach(pathId => VMech.Release(pathId));
  added.forEach(pathId => VMech.New(pathId, m_svgroot));
  updated.forEach(pathId => VMech.Update(pathId));
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
    VProp.NewBadge(id, m_svgroot); // returns vbadge but not using
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
    recursePropSize(compId); // note: returns bbox, but we're not using it here
  });
  if (DBG) console.groupEnd();

  /// RECURSION ///////////////////////////////////////////////////////////////
  /// given a propId, updates dimension data for each VProp so they are sized
  /// to contain their data and child VProps
  /// return struct { id, w, h } w/out padding
  function recursePropSize(propId) {
    const vprop = DATA.VM_VProp(propId);
    // first get base size of vprop's data
    const databbox = vprop.GetDataBBox();
    databbox.h += PAD.MIN; // add vertical padding
    /*** WALK CHILD PROPS ***/
    const childIds = DATA.Children(propId);
    /*** CASE 1: THERE ARE NO CHILDREN */
    if (childIds.length === 0) {
      // terminal nodes have no children
      // so the calculation of size is easy
      databbox.w += PAD.MIN2; // add horizontal padding
      vprop.SetSize(databbox); // store calculated overall size
      vprop.SetKidsBBox({ w: 0, h: 0 }); // no children, so no dimension
      return databbox; // end recursion by returning known value
    }
    /*** CASE 2: THERE ARE CHILDREN */
    let childSizes = []; // collect sizes of each child
    childIds.forEach(childId => {
      const cvprop = DATA.VM_VProp(childId);
      const csize = recursePropSize(childId);
      cvprop.SetKidsBBox(csize);
      childSizes.push(csize);
    });
    // find the widest box while adding all the heights of children
    // note: returned widths have MINx2 padding, heights have MIN
    const kidsbbox = childSizes.reduce((accbox, item) => {
      return {
        w: Math.max(accbox.w, item.w),
        h: accbox.h + item.h
      };
    });
    vprop.SetKidsBBox(kidsbbox); // set size of children area
    // compute minimum bounding box of vprop including child area
    const bbox = {
      id: propId,
      w: Math.max(databbox.w, kidsbbox.w) + PAD.MIN2,
      h: databbox.h + kidsbbox.h
    };
    // add additional vertical padding
    bbox.h += childIds.length > 1 ? PAD.MIN2 : PAD.MIN;
    vprop.SetSize(bbox);
    return bbox;
  }
};

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

/*/ DEBUG OBJECT /*/
window.PMC = PMCView;

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default PMCView;
