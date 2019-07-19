import DATA from './pmc-data';
import { cssinfo, cssalert, cssdata } from './console-styles';
import DEFAULTS from './defaults';
import UR from '../../system/ursys';
import { VisualState } from './classes-visual';

const { VPROP, PAD, COLOR } = DEFAULTS;

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const m_minWidth = VPROP.MIN_WIDTH;
const m_minHeight = VPROP.MIN_HEIGHT;
const m_pad = PAD.MIN;
const COL_BG = COLOR.PROP;
const DIM_RADIUS = 3;
//
const DBG = false;

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
   * @param {SVGJSElement} svg root element
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
    this.gData = this.gRoot.group(); // main data properties
    this.gKids = this.gRoot.group(); // child components group
    this.gDataName = this.gData.text(this.data.name.toUpperCase()); // label
    // other default properties
    this.fill = COL_BG;
    this.width = m_minWidth;
    this.height = m_minHeight;
    this.kidsWidth = 0;
    this.kidsHeight = 0;
    // shared modes
    this.visualState = new VisualState(this.id);
    this.displayMode = {};
    this.mechPoints = []; // array of points available for mechanism connections
    // hacked items
    this.hack = { wasMoved: false };
    // hacked vbadge support
    this.badgesCount = 0; // number of badges attached to this prop

    // higher order display properties
    this.gRoot.draggable();
    this.gRoot.on('dragstart.propmove', event => {
      event.preventDefault();
      // console.log(`dragstart.propmove ${this.id}`);
      this.dragStartBox = event.detail.box;
    });
    this.gRoot.on('dragmove.propmove', event => {
      event.preventDefault();
      const { handler, box } = event.detail;
      const { x, y } = box;
      this.dragMoveBox = box;
      handler.move(x, y);
      UR.Publish('PROP:MOVED', { prop: this.id });
    });
    this.gRoot.on('dragend.propmove', event => {
      event.stopPropagation();
      // console.log(`dragend.propmove ${this.id}`);
      const { x: x1, y: y1 } = this.dragStartBox;
      const { x: x2, y: y2 } = this.dragMoveBox;
      if (Math.abs(x1 - x2) < 5 && Math.abs(y1 - y2) < 5) {
        DATA.VM_ToggleProp(this);
      } else {
        console.log(`${this.id} was moved, setting 'dont move' hack flag`);
        this.HackSetMoved(true);
      }
    });
    // initial drawing
    this.Draw();
  }

  /** return associated nodeId
   * @returns {string} nodeId string
   */
  Id() {
    return this.id;
  }

  /** was moved */
  HackWasMoved() {
    return this.hack.wasMoved;
  }

  /** set was moved */
  HackSetMoved(flag = true) {
    this.hack.wasMoved = flag;
  }

  /** return upper-left X coordinate */
  X() {
    return this.gRoot.x();
  }

  /** return upper-left y coordinate */
  Y() {
    return this.gRoot.y();
  }

  /** return width of element */
  Width() {
    return this.width;
  }

  Height() {
    return this.height;
  }

  DataHeight() {
    return this.GetDataBBox().h;
  }

  //
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

  // this is the size of the entire component
  SetSize(wObj, h) {
    if (typeof wObj === 'object') {
      this.width = wObj.w;
      this.height = wObj.h;
    } else {
      this.width = wObj;
      this.height = h;
    }
    // set the background size
    this.visBG.size(this.width, this.height);
  }

  //
  GetCenter() {
    return {
      id: this.id,
      x: this.visBG.cx(),
      y: this.visBG.cy()
    };
  }

  //
  GetSize() {
    return {
      width: this.width,
      height: this.height
    };
  }

  // return the size requirment of the layout
  // minium size, but no additional padding
  GetDataBBox() {
    let { w, h } = this.gDataName.rbox();
    if (w < m_minWidth) w = m_minWidth;
    if (h < m_minHeight) h = m_minHeight;
    return {
      id: this.id,
      w: Math.ceil(w),
      h: Math.ceil(h)
    };
  }

  // return position bbox in screen coordinardinates
  // x,y,x2,y2,w,h,cx,cy
  GetScreenBBox() {
    return this.visBG.bbox();
  }

  // return a point to connect to
  GetEdgePoint(loc = 'c') {
    const { x, y, x2, y2, cx, cy } = this.visBG.bbox();
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

  // figures out what points to return
  // returns empty object if no path is possible (e.g. completely contained paths
  // returns { pt1: {x,y}, pt2:{x,y} } if possible
  GetEdgeConnectionPoints(targetId) {
    const target = DATA.VM_VProp(targetId);
    if (!target) throw Error(`VProp with targetId '${targetId}' doesn't exist`);
    const { x: Aleft, y: Atop, x2: Aright, y2: Abot, cx: Acx, cy: Acy } = this.GetScreenBBox();
    const { x: Bleft, y: Btop, x2: Bright, y2: Bbot, cx: Bcx, cy: Bcy } = target.GetScreenBBox();
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
    if (DBG) {
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

  SetKidsBBox(wObj, h) {
    if (typeof wObj === 'object') {
      const { w: ww, h: hh } = wObj;
      if (typeof ww !== 'number') throw Error(`x ${ww} is not an number`, ww);
      if (typeof hh !== 'number') throw Error(`y ${hh} is not an number`, hh);
      this.kidsWidth = ww;
      this.kidsHeight = hh;
      return;
    }
    const w = wObj;
    if (typeof w !== 'number') throw Error(`x ${w} is not an number`, w);
    if (typeof h !== 'number') throw Error(`y ${h} is not an number`, h);
    this.kidsWidth = w;
    this.kidsHeight = h;
  }

  GetKidsBBox() {
    return { id: this.id, w: this.kidsWidth, h: this.kidsHeight };
  }

  /**
   * Redraw svg elements from properties that may have been updated by
   * Update().
   * @param {object} point { x, y } coordinate
   */
  Draw(point) {
    // draw box
    this.visBG.fill({ color: this.fill, opacity: 0.1 }).radius(DIM_RADIUS);
    let sw = this.visualState.IsSelected() ? 2 : 0;
    if (this.visualState.IsSelected('first')) sw *= 2;
    this.visBG.stroke({ color: this.fill, width: sw });
    // draw label
    this.gDataName.transform({ translateX: m_pad, translateY: m_pad / 2 });
    // move
    if (point) this.gRoot.move(point.x, point.y);
  }

  // "destructor"
  Release() {
    return this.gRoot.remove();
  }

  //
  ToParent(id) {
    const vparent = DATA.VM_VProp(id);
    if (DBG) console.log(`${id} <- ${this.id}`);
    this.gRoot.toParent(vparent.gKids);
  }

  AddTo(id) {
    const vparent = DATA.VM_VProp(id);
    if (DBG) console.log(`${id} ++ ${this.id}`);
    this.gRoot.addTo(vparent.gKids);
  }

  //
  ToRoot() {
    if (DBG) console.log(`%croot <- ${this.id}`, `font-weight:bold`);
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
  components.forEach(id => {
    // get the Visual
    if (DBG) console.groupCollapsed(`%c:layout component ${id}`, cssinfo);
    recurseLayout({ x: xCounter, y: yCounter }, id);
    const compVis = DATA.VM_VProp(id);
    const compHeight = compVis.Height();
    rowHeight = Math.max(compHeight, rowHeight);
    xCounter += compVis.GetSize().width + PAD.MIN2;
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
  let { x, y } = pos;
  if (DBG) console.group(`${id} draw at (${x},${y})`);
  const compVis = DATA.VM_VProp(id);
  if (!compVis.HackWasMoved()) {
    if (DBG) console.log(`moving ${compVis.id}`);
    compVis.Move(pos.x, pos.y); // draw compVis where it should go in screen space
    if (DBG) console.log('compVis is at', compVis.X(), compVis.X());
    y += compVis.DataHeight() + PAD.MIN;
    x += PAD.MIN;
    const children = DATA.Children(id);
    let widest = 0;
    children.forEach(cid => {
      const childVis = DATA.VM_VProp(cid);
      widest = Math.max(widest, childVis.GetKidsBBox()).w;
      recurseLayout({ x, y }, cid);
      const addH = childVis.Height() + PAD.MIN;
      y += addH;
      if (DBG) console.log(`y + ${addH} = ${y}`);
      childVis.ToParent(id); // nest child in parent
    });
  } else if (DBG) {
    console.log(`skipping layout of ${compVis.id}`);
  }
  if (DBG) console.groupEnd();
}

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (!window.meme) window.meme = {};
window.meme.vprops = () => {
  console.log(`%cattaching props to window by [id]`, cssdata);
  let props = DATA.AllProps();
  props.forEach(propId => {
    window[propId] = DATA.VM_VProp(propId);
  });
  return `${props} attached to window object`;
};
window.meme.comps = () => {
  console.log(`%cshowing components`, cssdata);
  let comps = DATA.Components();
  comps.forEach(id => {
    console.log(`[${id}]`);
  });
  return `${comps.length} components listed`;
};
window.meme.dumpid = id => {
  console.log(`%cdumping id [${id}] child hierarchy`, cssdata);
  recurse(id);
  /* helper */
  function recurse(propId) {
    const vis = DATA.VM_VProp(propId);
    const visHeight = vis.Height();
    console.group(`[${propId}] y=${visHeight} (${visHeight})`);
    const kids = DATA.Children(propId);
    kids.forEach(kid => {
      recurse(kid);
    });
    console.groupEnd();
  }
  return `finished dumping id [${id}]`;
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default VProp;