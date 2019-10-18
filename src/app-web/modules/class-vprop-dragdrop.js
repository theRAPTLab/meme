/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Extended VProp Manager Tools
  NOTE: functions are defined as const arrow functions because arrow
  functions are implicitly bound to their scope, unlike regular function
  declarations that require functionName = functionName.bind(this).

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/* eslint-disable no-param-reassign */

/**
 * @module VProp-DragDrop
 */

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import DATA from './data';
import UR from '../../system/ursys';
import UTILS from './utils';
// import { cssinfo } from './console-styles';

/// PRIVATE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Utility to retrieve coordinate from an event
 * @memberof VProp-DragDrop
 * @param {object} event - event object from mouse/touch handler
 */
const SaveEventCoordsToBox = (ev, box) => {
  if (ev.changedTouches) {
    // eslint-disable-next-line no-param-reassign
    ev = ev.changedTouches[0];
  }
  if (box.x === undefined || box.y === undefined) {
    throw Error(`arg2 box has undefined x or y prop`);
  }
  // eslint-disable-next-line no-param-reassign
  box.x = ev.detail.event.clientX;
  // eslint-disable-next-line no-param-reassign
  box.y = ev.detail.event.clientY;
};
/**
 * Utility to find the distance of the drag operation
 * @memberof VProp-DragDrop
 * @returns {object} { x1, y1, x2, y2, dx, dy, d }
 */
const DragMetrics = vprop => {
  const boxes = DragState(vprop);
  if (!boxes) throw Error(`VProp ${vprop.Id()} doesn't implement VEX.DragDrop`);
  let { x: x1, y: y1 } = boxes.startPt;
  let { x: x2, y: y2 } = boxes.endPt;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.sqrt(dx * dx + dy * dy);
  return { x1, x2, y1, y2, dx, dy, d };
};

/**
 * Utility to inspect the vprop 'dragging' state, which is inferred by
 * looking at the state of the pointer-events state. If none, then
 * it's not receiving pointer events so it doesn't block other
 * vprops that are beneath it in the SVG element stacking order.
 * @memberof VProp-DragDrop
 */
const IsDragging = vprop => {
  return vprop.gRoot.attr('pointer-events') === 'none';
};

/**
 * Utility to access stored values
 * @memberof VProp-DragDrop
 */
const DragState = vprop => {
  return vprop._extend.dragdrop;
};

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Adds VEX.DragDrop features to a VProp, which adds ViewModel state and
 * highlighting support. If VProp has DragStart, DragMove, or DragEnd methods
 * defined, they will be called after internal management is done
 * @memberof VProp-DragDrop
 * @param {VProp} - VProp instance
 */
const AddDragDropHandlers = vprop => {
  if (!vprop.gRoot.root()) throw Error('arg1 must be a VProp');
  /* add storage */
  if (!vprop._extend) vprop._extend = {};
  if (vprop._extend.dragdrop) throw Error(`vprop ${vprop.Id()} already has been extended`);
  vprop._extend.dragdrop = {
    startPt: { x: 0, y: 0 },
    movePt: { x: 0, y: 0 },
    endPt: { x: 0, y: 0 }
  };

  /* attach mouse/touch events for testing selection hover/highlighting */
  vprop.visBG.mouseenter(event => {
    event.stopPropagation();
    DATA.VM_PropMouseEnter(vprop);
  });
  vprop.visBG.mouseleave(event => {
    event.stopPropagation();
    DATA.VM_PropMouseExit(vprop);
  });

  /* attach draggable library to gRoot */
  vprop.gRoot.draggable();

  // handle start of drag
  vprop.gRoot.on('dragstart.propmove', event => {
    event.stopPropagation();
    vprop.gRoot.attr('pointer-events', 'none');
    DATA.VM_PropMouseExit(vprop);
    SaveEventCoordsToBox(event, vprop._extend.dragdrop.startPt);
    DragState(vprop).gRootXY = {
      x: vprop.gRoot.x(),
      y: vprop.gRoot.y()
    };
    if (vprop.DragStart) vprop.DragStart(event);
  });

  // handle drag while moving
  vprop.gRoot.on('dragmove.propmove', event => {
    // do not stopPropagation because mouse events need to update drop targets
    SaveEventCoordsToBox(event, vprop._extend.dragdrop.movePt);
    UR.Publish('PROP_MOVED', { prop: vprop.id });
  });

  // handle end of drag
  vprop.gRoot.on('dragend.propmove', event => {
    event.detail.event.preventDefault();
    event.detail.event.stopPropagation();

    vprop.gRoot.attr('pointer-events', 'all');
    SaveEventCoordsToBox(event, vprop._extend.dragdrop.endPt);
    if (vprop.DragEnd) vprop.DragEnd(event);

    const { d, dx, dy } = DragMetrics(vprop);
    // NOTE: vpropid always mirrors propid, though a prop is
    // not the same as a vprop
    const vpropId = vprop.Id();

    // see if the prop moved by a minimum amount (10 pixels)
    // if it didn't move much, then it's a click
    if (d < 10) {
      if (DBG) console.log(`[${vpropId}] didn't move enough, so snapping back`);

      // check children
      // and pass click to children
      const gStickyButton = vprop.vBadge.gStickyButtons;
      const mouseEvent = event.detail.event; // mouseEvent has clientX and clientY

      // Convert click's screen coordinates to svg coordinates (zoomed and panned)
      // https://www.sitepoint.com/how-to-translate-from-dom-to-svg-coordinates-and-back-again/
      let svg = document.getElementById('modelSVG');
      let pt = svg.createSVGPoint();
      pt.x = mouseEvent.clientX;
      pt.y = mouseEvent.clientY;
      let svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
      if (DBG) console.log('Clicked at screen', pt, ' / SVG coordinate', svgPt);
      
      // gStickyNoteButton is actually just a group object
      // but it does have a bbox with the right coordinates.
      // NOTE testing for 'inside' with the chat/chatBubble/chatOutline svg icons doesn't work
      // because their bbox is at 0,0 if they're not visible.
      if (gStickyButton.inside(svgPt.x, svgPt.y)) {
        // Handle as click and pass to VBadge
        gStickyButton.fire('click', { event: mouseEvent });
      } else {
        // Handle as selection
        DATA.VM_ToggleProp(vprop);
        vprop.Move(DragState(vprop).gRootXY);
      }

      return;
    }

    // for every move, move vprop back to root to 'reset' it
    // before subsequent reparenting
    vprop.ToRoot();

    // it did move, so do drop target magic
    const dropId = DATA.VM_PropsMouseOver().pop();
    
    const dropXY = `(${DragState(vprop).gRootXY.x},${DragState(vprop).gRootXY.y})`;

    if (dropId) {
      // there is a drop target
      const vparent = DATA.VM_VProp(dropId);
      vparent.LayoutDisabled(true);
      vprop.LayoutDisabled(true);
      // this has to come last because this automatically fires layout
      DATA.PMC_SetPropParent(vpropId, dropId);
      if (DBG) console.log(`[${vpropId}] moved to [${dropId}]`);
      UTILS.RLog('PropertyDrag', `Drag property id=${vprop.id} onto id=${dropId} at ${dropXY}`);
    } else {
      // dropped on the desktop, no parent
      const parent = DATA.PropParent(vpropId);
      if (parent) {
        if (DBG) console.log(`[${vpropId}] moved from [${parent}]`);
        vprop.LayoutDisabled(true);
        const { x, y } = DragState(vprop).gRootXY;
        vprop.Move(x + dx, y + dy);
        UTILS.RLog('PropertyDrag', `Drag property id=${vprop.id} from id=${parent} to ${dropXY}`);
      } else {
        if (DBG) console.log(`[${vpropId}] moved on desktop`);
        vprop.LayoutDisabled(true);
        const { x, y } = DragState(vprop).gRootXY;
        vprop.Move(x + dx, y + dy);
        UTILS.RLog('PropertyDrag', `Drag property id=${vprop.id} to ${dropXY}`);
      }
      // this has to come last because this automatically fires layout
      DATA.PMC_SetPropParent(vpropId, undefined);
      DATA.VM_SaveVPropPosition(vprop);
    }
  });
  //
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// example usage:
/// import {DragMetrics} from '/.modules/extend-vprop.js'
export { AddDragDropHandlers, DragMetrics, IsDragging };
