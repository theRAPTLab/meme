import DATA from './data';
import { cssinfo, cssblue, cssred, cssmark, cssreset } from './console-styles';
import DEFAULTS from './defaults';
import { AddDragDropHandlers } from './class-vprop-dragdrop';
import { VisualState } from './classes-visual';
import VBadge from './class-vbadge';

// testing mousedown
import UR from '../../system/ursys';

const { VPROP, PAD, COLOR } = DEFAULTS;

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const m_minWidth = VPROP.MIN_WIDTH;
const m_minHeight = VPROP.MIN_HEIGHT;
const m_pad = PAD.MIN;
const COL_HOVER = COLOR.PROP_HOV;
const COL_HOVER_OPACITY = 0.3;
const COL_BG = COLOR.PROP;
const COL_BG_OPACITY = 0.1;
const DIM_RADIUS = 3;
//
const DBG = {
  edges: false,
  layout: false,
  hierarchy: false,
  plugin: false
};

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * The visual representation of "a property that has a name and associated data,
 * and may contain nested properties". It works with string ids (nodeId) that corresponds
 * to the pure data model nodeId.
 */
class VProp {
  /** create a VProp
   * @param {number} propId
   * @param {SVGjsElement} svgRoot root element
   */
  constructor(propId, svgRoot) {
    if (typeof propId !== 'string') throw Error(`require string id`);
    if (!DATA.HasProp(propId)) throw Error(`${propId} is not in graph data`);
    // basic display props
    this.id = propId;
    this.data = Object.assign({}, DATA.Prop(propId)); // copy, not reference
    this.gRoot = svgRoot.group(); // main reference group
    // this order is important
    this.visBG = this.gRoot.rect(this.width, this.height); // background
    this.visBG.attr({ cursor: 'pointer' });
    this.gData = this.gRoot.group(); // main data properties
    this.gDataName = this.gData.text(this.data.name.toUpperCase()); // label
    this.gDataName.attr('pointer-events', 'none');
    this.gKids = this.gRoot.group(); // child components group
    // other default properties
    this.width = m_minWidth;
    this.height = m_minHeight;
    this.kidsWidth = 0;
    this.kidsHeight = 0;
    // shared modes
    this.visualState = new VisualState(this.id);
    this.visualStyle = {
      stroke: { color: COL_BG, width: 1 },
      fill: { color: COL_BG, opacity: COL_BG_OPACITY },
      radius: DIM_RADIUS
    };
    this.mechPoints = []; // array of points available for mechanism connections
    // hacked items
    this.posMode = { wasMoved: false };
    this.dragStartBox = { x: 0, y: 0 };
    this.dragMoveBox = { x: 0, y: 0 };
    this.dragEndBox = { x: 0, y: 0 };

    // add VBadge group
    this.vBadge = VBadge.New(this);

    // add VProp extensions
    VProp.AddDragDropHandlers(this);

    this.HoverStart = this.HoverStart.bind(this);
    this.HoverEnd = this.HoverEnd.bind(this);
    UR.Subscribe('PROP_HOVER_START', this.HoverStart);
    UR.Subscribe('PROP_HOVER_END', this.HoverEnd);

    // initial drawing
    this.Draw();
  }

  /**
   * Remove  gRoot svg element and all its children
   */
  Release() {
    this.vBadge.Release();
    UR.Unsubscribe('PROP_HOVER_START', this.HoverStart);
    UR.Unsubscribe('PROP_HOVER_END', this.HoverEnd);
    return this.gRoot.remove();
  }

  /** return associated nodeId
   * @returns {string} nodeId string
   */
  Id() {
    return this.id;
  }

  /** was moved */
  LayoutDisabled(flag) {
    if (flag !== undefined) this.posMode.wasMoved = flag;
    return this.posMode.wasMoved;
  }

  HoverStart(data) {
    const publishEvent = false;
    if (data.propId === this.id) this.HoverState(true, publishEvent);
  }

  HoverEnd() {
    this.HoverState(false, false);
  }

  HoverState(visible, publishEvent = true) {
    if (typeof visible !== 'boolean') throw Error('must specific true or false');

    if (visible) {
      this.visualState.Select('hover');
      this.visualStyle.fill.color = COL_HOVER;
      this.visualStyle.fill.opacity = COL_HOVER_OPACITY;
      if (publishEvent) UR.Publish('PROP_HOVER_START', { propId: this.id });
    } else {
      this.visualState.Deselect('hover');
      this.visualStyle.fill.color = COL_BG;
      this.visualStyle.fill.opacity = COL_BG_OPACITY;
      if (publishEvent) UR.Publish('PROP_HOVER_END', { propId: this.id });
    }
    this.Draw();
  }

  /**
   * Return upper-left X coordinate
   */
  X() {
    return this.gRoot.x();
  }

  /**
   * Return the upper-left Y coordinate
   */
  Y() {
    return this.gRoot.y();
  }

  /**
   * @returns {SVG.Container} - The SVG Container object that the badge should attach to 
   */
  GetVBadgeParent() {
    return this.gRoot;
  }

  /**
   * Move to coordinate
   * @param {pt | x,y} - {x,y} or x,y
   */
  Move(xObj, y) {
    if (typeof xObj === 'object') {
      const { x: xx, y: yy } = xObj;
      if (typeof xx !== 'number') throw Error(`x ${xx} is not an number`, xx);
      if (typeof yy !== 'number') throw Error(`y ${yy} is not an number`, yy);
      this.gRoot.move(xx, yy);
      return;
    }
    const x = xObj;
    if (typeof x !== 'number') throw Error(`x ${x} is not an number`, x);
    if (typeof y !== 'number') throw Error(`y ${y} is not an number`, y);
    this.gRoot.move(x, y);
  }

  /**
   * Utility to get or set the VProp overall size
   * @param { sizeObj | w, h} - { w, h } or w,h
   * @returns { id, w, h }
   */
  PropSize(wObj, h) {
    // return it
    if (wObj === undefined)
      return {
        id: this.id,
        w: this.width,
        h: this.height
      };
    // set it
    if (typeof wObj === 'object') {
      this.width = wObj.w;
      this.height = wObj.h;
    } else {
      this.width = wObj;
      this.height = h;
    }
    // set the background size
    this.visBG.size(this.width, this.height);

    // update vBadge size
    this.vBadge.SetDimensionsFromParent(this);

    return { id: this.id, w: this.width, h: this.height };
  }

  /**
   * Return the calculated size of the DATA area of the VProp
   * with no additional padding
   * @returns { id, w, h }
   */
  DataSize() {
    let { w, h } = this.gDataName.rbox();
    if (w < m_minWidth) w = m_minWidth;
    if (h < m_minHeight) h = m_minHeight;
    return {
      id: this.id,
      w: Math.ceil(w),
      h: Math.ceil(h)
    };
  }

  /**
   * Utility to get or set the size of the descendent children vprops of this vprop.
   * @param {sizeObj | w,h} - { w, h } or w,h
   * @returns { id, w, h }
   */
  KidsSize(wObj, h) {
    if (wObj === undefined) return { id: this.id, w: this.kidsWidth, h: this.kidsHeight };
    if (typeof wObj === 'object') {
      const { w: ww, h: hh } = wObj;
      if (typeof ww !== 'number') throw Error(`x ${ww} is not an number`, ww);
      if (typeof hh !== 'number') throw Error(`y ${hh} is not an number`, hh);
      this.kidsWidth = ww;
      this.kidsHeight = hh;
      return { id: this.id, w: ww, h: hh };
    }
    const w = wObj;
    if (typeof w !== 'number') throw Error(`x ${w} is not an number`, w);
    if (typeof h !== 'number') throw Error(`y ${h} is not an number`, h);
    this.kidsWidth = w;
    this.kidsHeight = h;
    return { id: this.id, w, h };
  }

  /**
   * Utility to get the bounding box of the vprop
   * by measuring sound of visBG rect
   * @returns { x, y, x2, y2, w, h, cx, cy }
   */
  ScreenBBox() {
    return this.visBG.bbox();
  }

  /**
   * Return a specified point on the edge of the vprop
   * c = center, t = top, r = right, b = bottom, l = left
   * @param { string } location - string c, t, r, b, or l
   */
  RequestEdgePoint(loc = 'c') {
    const { x, y, x2, y2, cx, cy } = this.ScreenBBox();
    switch (loc) {
      case 'c':
        return { x: cx, y: cy };
      case 't':
        return { x: cx, y };
      case 'r':
        return { x: x2, y: cy };
      case 'b':
        return { x: cx, y: y2 };
      case 'l':
        return { x, y: cy };
      default:
        throw Error(`unexpected location '${loc}'. Valid valus c t r b l`);
    }
  }

  /**
   * Finds closest edges between this vprop and the target vprop. If found, returns the points
   * @param { string } targetId - target of remote VProp to connect to
   * @returns { object } - a points object {pt1:{x,y,d,up}, pt2:{x,y,d,up}}
   */
  FindEdgePointConnectionTo(targetId) {
    const target = DATA.VM_VProp(targetId);
    if (!target) throw Error(`VProp with targetId '${targetId}' doesn't exist`);
    const { x: Aleft, y: Atop, x2: Aright, y2: Abot, cx: Acx, cy: Acy } = this.ScreenBBox();
    const { x: Bleft, y: Btop, x2: Bright, y2: Bbot, cx: Bcx, cy: Bcy } = target.ScreenBBox();
    // find shortest distance between THIS and TARGET
    // eliminate negative values
    const distances = [
      { side: 't', d: Atop - Bbot },
      { side: 'r', d: Bleft - Aright },
      { side: 'b', d: Btop - Abot },
      { side: 'l', d: Aleft - Bright }
    ].filter(item => {
      return item.d > 0;
    });
    // sort by ascending distance
    distances.sort((foo, bar) => {
      if (foo.d < bar.d) return -1;
      if (foo.d > bar.d) return 1;
      return 0;
    });
    if (DBG.edges) {
      const out = `${this.Id()} sees ${distances.length} potential outedges to ${targetId}`;
      console.log(out, distances);
    }

    // if no drawable line (e.g. overlapping) then return no line
    if (distances.length === 0) return {}; // no drawable line

    // let's make a helper function to create an object
    // return { pt1:{ x,y,d, up }, pt2:{ x,y,d, up } }
    function makePtObj(side, x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const d = Math.sqrt(dx * dx + dy * dy);
      const up = Math.min(1000, d) / 1000; // should be based on viewport size
      return {
        pt1: { x: x1, y: y1, d, up },
        pt2: { x: x2, y: y2, d, up }
      };
    }

    // return the points from source (x1,y1) to target (x2,y2)
    const longest = distances[distances.length - 1];
    switch (longest.side) {
      case 't':
        return makePtObj('t', Acx, Atop, Bcx, Bbot);
      case 'r':
        return makePtObj('r', Aright, Acy, Bleft, Bcy);
      case 'b':
        return makePtObj('b', Acx, Abot, Bcx, Btop);
      case 'l':
        return makePtObj('l', Aleft, Acy, Bright, Bcy);
      default:
        throw Error(`unxpected side value ${longest.side}`);
    }
  }

  /**
   * Redraw svg elements from properties that may have been updated by
   * Update().
   * @param {object} point { x, y } coordinate
   */
  Draw(point) {
    const { stroke, fill, radius } = this.visualStyle;
    // draw box
    this.visBG.fill(fill).radius(radius);
    stroke.width = this.visualState.IsSelected() ? 2 : 0;
    if (this.visualState.IsSelected('first')) stroke.width *= 2;
    this.visBG.stroke(stroke);
    // draw label
    this.gDataName.transform({ translateX: m_pad, translateY: m_pad / 2 });
    // draw badge
    this.vBadge.Draw(this);
    // move
    if (point) this.gRoot.move(point.x, point.y);
  }

  /**
   * Make this VProp a child of another VProp
   */
  ToParent(id) {
    if (DBG.hierarchy) console.log(`${id} <- ${this.id}`);
    const vparent = DATA.VM_VProp(id);
    if (!vparent) throw Error(`${id} does not have a matching VProp`);
    this.gRoot.toParent(vparent.gKids);
  }

  /**
   * Make this VProp a child of the main svg element
   */
  ToRoot() {
    if (DBG.hierarchy) console.log(`%croot <- ${this.id}`, `font-weight:bold`);
    this.gRoot.toRoot();
  }

  /**
   * Update instance properties from model, then call Draw() to update svg elements
   */
  Update() {
    // update data by copying
    const data = DATA.Prop(this.id);
    this.data.name = data.name;

    // Update the text in case it changed
    this.gDataName.text(this.data.name.toUpperCase());

    this.vBadge.Update(this);

    // preserve layout
    const x = this.gRoot.x();
    const y = this.gRoot.y();

    this.Draw({ x, y });
  }
}

/// STATIC CLASS METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Allocate VProp instances through this static method. It maintains
 *  the collection of all allocated visuals
 */
VProp.New = (id, svgRoot) => {
  if (DATA.VM_VProp(id)) throw Error(`${id} is already allocated`);
  if (svgRoot.constructor.name !== 'Svg') throw Error(`arg2 must be SVGJS draw instance`);
  const vprop = new VProp(id, svgRoot);
  DATA.VM_VPropSet(id, vprop);
  return vprop;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  De-allocate VProp instance by id.
 */
VProp.Release = id => {
  const vprop = DATA.VM_VProp(id);
  DATA.VM_VPropDelete(id);
  return vprop.Release();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Update instance from associated data id
 */
VProp.Update = id => {
  const vprop = DATA.VM_VProp(id);
  vprop.Update();
  return vprop;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  LIFECYCLE: Sizes all the properties to fit their contained props
 *  based on their display state
 */
VProp.SizeComponents = () => {
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
    const databbox = vprop.DataSize();
    databbox.h += PAD.MIN; // add vertical padding
    /*** WALK CHILD PROPS ***/
    const childIds = DATA.Children(propId);
    /*** CASE 1: THERE ARE NO CHILDREN */
    if (childIds.length === 0) {
      // terminal nodes have no children
      // so the calculation of size is easy
      databbox.w += PAD.MIN2; // add horizontal padding
      vprop.PropSize(databbox); // store calculated overall size
      vprop.KidsSize({ w: 0, h: 0 }); // no children, so no dimension
      return databbox; // end recursion by returning known value
    }
    /*** CASE 2: THERE ARE CHILDREN */
    let childSizes = []; // collect sizes of each child
    childIds.forEach(childId => {
      const cvprop = DATA.VM_VProp(childId);
      const csize = recursePropSize(childId);
      cvprop.KidsSize(csize);
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
    vprop.KidsSize(kidsbbox); // set size of children area
    // compute minimum bounding box of vprop including child area
    const bbox = {
      id: propId,
      w: Math.max(databbox.w, kidsbbox.w) + PAD.MIN2,
      h: databbox.h + kidsbbox.h
    };
    // add additional vertical padding
    bbox.h += childIds.length > 1 ? childIds.length * PAD.MIN : PAD.MIN;
    vprop.PropSize(bbox);
    return bbox;
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  LIFECYCLE: Draws properties into layout. Assumes they have been sized
 *  already based on their display state
 */
VProp.LayoutComponents = () => {
  const components = DATA.Components();
  // then dp ;aupit
  let xCounter = PAD.MIN2;
  let yCounter = PAD.MIN2;
  let rowHeight = 0;

  // walk through all components
  // for each component, get the size of all children
  // set background size to it
  if (DBG.layout) console.log(`%cNEW LAYOUT`, cssmark);
  components.forEach(id => {
    // get the Visual
    if (DBG.layout) console.group(`%clayout: component ${id}`, cssinfo);
    const compVis = DATA.VM_VProp(id);
    if (compVis.LayoutDisabled()) {
      if (DBG.layout) console.log(`%c${id} is using layout`, cssred);
      // use existing X,Y
      recurseLayout({ x: compVis.X(), y: compVis.Y() }, id);
    } else {
      // use layout X,Y
      if (DBG.layout)
        console.log(`%c${id} drawn in default layout at ${xCounter},${yCounter}`, cssblue);
      recurseLayout({ x: xCounter, y: yCounter }, id);
    }
    const compHeight = compVis.PropSize().h;
    rowHeight = Math.max(compHeight, rowHeight);
    xCounter += compVis.PropSize().w + PAD.MIN2;
    if (xCounter > 700) {
      yCounter += rowHeight + PAD.MIN2;
      xCounter = PAD.MIN2;
      rowHeight = 0;
    }
    DATA.VM_VProp(id).ToRoot(); // components are always on the root svg

    if (DBG) console.groupEnd();
  });
};

/// RECURSION ///////////////////////////////////////////////////////////////
/// given a propId and starting x,y, draw the components spread on the
/// screen
function recurseLayout(pos, id) {
  let { x, y } = pos; // x-y is the location to draw the component
  const LDBG = DBG.layout;
  const compVis = DATA.VM_VProp(id);
  if (LDBG) console.group(`moving ${compVis.id} from ${compVis.X()},${compVis.Y()} to ${x},${y}`);
  compVis.Move(x, y); // draw compVis where it should go in screen space
  y += compVis.DataSize().h + PAD.MIN;
  x += PAD.MIN;
  const children = DATA.Children(id);
  let widest = 0;
  children.forEach(cid => {
    const childVis = DATA.VM_VProp(cid);
    widest = Math.max(widest, childVis.KidsSize()).w;
    recurseLayout({ x, y }, cid);
    const addH = childVis.PropSize().h + PAD.MIN;
    y += addH;
    if (LDBG) console.log(`y + ${addH} = ${y}`);
    childVis.ToParent(id); // nest child in parent
  });
  if (LDBG) console.groupEnd();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VProp.StaticMethod = (method, methodName) => {
  /* CHECK FOR BAD PARAMETERS */
  if (typeof method !== 'function') throw Error('arg1 must be a function');
  if (methodName) {
    if (typeof methodName !== 'string') throw Error('arg2 must be a string');
    const firstChar = methodName.charAt(0);
    if (firstChar.toUpperCase() !== firstChar.toLowerCase())
      throw Error('arg2 function name must begin with a letter');
  }
  /* eslint-disable-next-line no-param-reassign */
  methodName = methodName || method.name;
  if (VProp[methodName]) throw Error(`VProp already has static method '${methodName}'`);

  /* IF WE GOT THIS FAR LET'S DO IT */
  VProp[methodName] = method;
  if (DBG.plugin) console.log(`%cVPropPlugin%c ${methodName}`, cssinfo, cssreset);
};

/// LINK EXTENSIONS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VProp.StaticMethod(AddDragDropHandlers);

/// DEBUG /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (!window.ur) window.ur = {};
window.ur.VPROP = VProp;

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default VProp;
