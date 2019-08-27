import { yellow, green, red } from '@material-ui/core/colors';
import SVGJS from '@svgdotjs/svg.js/src/svg';
import DATA from './pmc-data';
import VProp from './class-vprop';
import VMech from './class-vmech';
import { cssinfo, cssalert, csstab, cssdraw } from './console-styles';
import UR from '../../system/ursys';
import DEFAULTS from './defaults';

const { SVGDEFS, SVGSYMBOLS, COLOR } = DEFAULTS;

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @module PMCView
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
//
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
    DATA.VM_DeselectAllProps();
    DATA.VM_DeselectAllMechs();
    UR.Publish('SELECTION_CHANGED');
  });
  PMCView.DefineDefs(m_svgroot);
  PMCView.DefineSymbols(m_svgroot);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCView.TestGroups = () => {
  m_svgroot.clear();
  const gt = m_svgroot.group(); // 0,0
  const gm = m_svgroot.group(); // 0,0
  const gr = m_svgroot.group(); // 0,0
  const DIM = 1000;
  const stroke = { color: 'black', width: 1, opacity: 0.1 };
  for (let i = 0; i < DIM; i += DIM / 10) m_svgroot.line(i, 0, i, DIM).stroke(stroke);
  for (let j = 0; j < DIM; j += DIM / 10) m_svgroot.line(0, j, DIM, j).stroke(stroke);

  console.group('%cTEST GROUP TRANSFORMS', cssdraw);
  /* TEST TRANSFORM on GROUP, MOVE on ELEMENTS */
  gt.text(add => {
    add.tspan('move then add element test').newLine();
    add.tspan('group using transform').newLine();
    add.tspan('start at 0,0 -> end at 100,200').newLine();
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
  gt.transform({ translateX: 100, translateY: 200 });
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
    add.tspan('move then add element test').newLine();
    add.tspan('group using move').newLine();
    add.tspan('start at 0,0 -> end at 300,100').newLine();
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
  gm.move(300, 100);
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

  /* TEST MOVE on GROUP, MOVE on ELEMENTS */
  gr.text(add => {
    add.tspan('move then add element test').newLine();
    add.tspan('group using move+offset').newLine();
    add.tspan('start at 0,0 -> end at 300,300').newLine();
  }).move(0, 110);
  // create a rect at 0,0 with width 100,100
  gr.rect(100, 100).fill({ color: '#000055' });
  /* MOVE GROUP */
  gr.move(200, 150);
  // add another small rect at 0,0, size 10, transform to 10,10
  let grx = gr.x(); /* EXTRA */
  let gry = gr.y(); /* EXTRA */
  gr.rect(10, 10)
    .fill({ color: 'blue' })
    .move(grx + 10, gry + 10);
  /* MOVE GROUP AGAIN */
  gr.move(300, 300);
  // add a circle on root svg at 0,0 radius 20, centered at 50,50
  // then add to group
  grx = gr.x(); /* EXTRA */
  gry = gr.y(); /* EXTRA */
  const grc = m_svgroot
    .circle(20, 20)
    .fill({ color: 'blue' })
    .center(grx + 50, gry + 50);
  gr.add(grc);

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
  const chatColor = yellow[800];
  SVGSYMBOLS.set(
    'chatIcon',
    (() => {
      const icon = svg.symbol();
      // from https://material.io/resources/icons/?icon=chat&style=baseline
      icon
        .path(
          'M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z'
        )
        .fill(chatColor);
      icon.path('M0 0h24v24H0z').fill('none');
      return icon;
    })()
  );
  SVGSYMBOLS.set(
    'chatBubble',
    (() => {
      const icon = svg.symbol();
      // from https://material.io/resources/icons/static/icons/baseline-chat_bubble-24px.svg
      icon
        .path('M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z')
        .fill(chatColor);
      icon.path('M0 0h24v24H0z').fill('none');
      return icon;
    })()
  );
  SVGSYMBOLS.set(
    'chatBubbleOutline',
    (() => {
      const icon = svg.symbol();
      // from https://material.io/resources/icons/static/icons/baseline-chat_bubble_outline-24px.svg
      icon.path('M0 0h24v24H0V0z').fill('none');
      icon
        .path(
          'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z'
        )
        .fill(chatColor);
      return icon;
    })()
  );
  SVGSYMBOLS.set(
    'ratingsPositive',
    (() => {
      const icon = svg.symbol();
      // from https://fonts.gstatic.com/s/i/materialicons/add/v1/24px.svg
      icon.path('M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z').fill(green[600]);
      icon.path('M0 0h24v24H0z').fill('none');
      return icon;
    })()
  );
  SVGSYMBOLS.set(
    'ratingsNegative',
    (() => {
      const icon = svg.symbol();
      // from https://fonts.gstatic.com/s/i/materialicons/clear/v1/24px.svg?download=true
      icon.path('M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z').fill(red[600]);
      icon.path('M0 0h24v24H0z').fill('none');
      return icon;
    })()
  );
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
  // if (DBG) console.groupCollapsed(`%c:SyncPropsFromGraphData()`, cssinfo);
  const { added, removed, updated } = DATA.VM_GetVPropChanges();
  removed.forEach(id => VProp.Release(id));
  added.forEach(id => VProp.New(id, m_svgroot)); // returns vprop instance but not using
  updated.forEach(id => VProp.Update(id));
  if (DBG) {
    if (removed.length) console.log(`%c:Removing ${removed.length} dead nodes`, csstab);
    if (added.length) console.log(`%c:Adding ${added.length} new nodes`, csstab);
    if (updated.length) console.log(`%c:Updating ${updated.length} nodes`, csstab);
  }
  // if (DBG) console.groupEnd();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * LIFECYCLE: Syncs PMC mechanism changes from model to the viewmodel. In other
 * words, the pure mechanism data (model) is processed and the *display* data
 * structures (the viewmodel) is updated to reflect it.
 */
PMCView.SyncMechsFromGraphData = () => {
  // if (DBG) console.groupCollapsed(`%c:SyncMechsFromGraphData()`, cssinfo);
  // the following arrays contain pathIds
  const { added, removed, updated } = DATA.VM_GetVMechChanges();
  removed.forEach(pathId => VMech.Release(pathId));
  added.forEach(pathId => VMech.New(pathId, m_svgroot));
  updated.forEach(pathId => VMech.Update(pathId));
  if (DBG) {
    if (removed.length) console.log(`%c:Removing ${removed.length} dead edgeObjs`, csstab);
    if (added.length) console.log(`%c:Adding ${added.length} new edgeObjs`, csstab);
    if (updated.length) console.log(`%c:Updating ${updated.length} edgeObjs`, csstab);
  }
  // if (DBG) console.groupEnd();
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
  // if (DBG) console.groupCollapsed(`%c:UpdateViewModel()`, cssinfo);
  VProp.SizeComponents();
  // if (DBG) console.groupEnd();
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * LIFECYCLE: Draws the current view from the updated viewmodel. Currently
 * handles layout and edge drawing.
 */
PMCView.UpdateView = () => {
  // if (DBG) console.groupCollapsed(`%c:UpdateView()`, cssinfo);
  VProp.LayoutComponents();
  VMech.DrawEdges();
  // if (DBG) console.groupEnd();
};

/*/ DEBUG OBJECT /*/
window.PMC = PMCView;

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default PMCView;
