import ADM from './data';
import DATA from './data';
import { cssinfo, cssdraw, csstab, csstab2, cssblue, cssdata } from './console-styles';
import UR from '../../system/ursys';
import DEFAULTS from './defaults';
import { VisualState } from './classes-visual';
import VBadge from './class-vbadge';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { VMECH, COLOR, CoerceToEdgeObj, SVGDEFS } = DEFAULTS;
const m_up = VMECH.UP;
const m_blen = VMECH.BLEN;

const DBG = false;

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// accepts either edgeObj or v,w as parameters
function m_MakeQuadraticDrawingString(p1, p2) {
  // find midpoint
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  // calculate unit vector perpendicular to line
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  const nx = -(p2.y - p1.y) / d;
  const ny = dx / d;
  // caculate nudge along perpendicular scaled by "up" factor
  const offx = nx * m_up * p1.up;
  const offy = ny * m_up * p1.up;
  //
  return `M${p1.x},${p1.y} Q${mx - offx},${my - offy} ${p2.x},${p2.y}`;
}

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * A visual representation of a "mechanism", which is the edge connecting
 * two nodes in a directed graph.
 * @property {string} id - the pathId that this VMech corresponds to
 * @property {object} data - local copy of graph edge data
 * @property {string} sourceId - local copy of source nodeId
 * @property {string} targetId - local copy of target nodeId
 * @property {object} dataDisplayMode - visual-specific mode flags
 * @property {SVGPath} path - SVGJS path object
 * @property {SVGText} pathLabel - SVGJS text object
 * @property {SVGTextPath} textpath - SVGJS text path object
 */
class VMech {
  /**
   * @param {string} pathId
   * @param {SVGElement} svgRoot
   */
  constructor(pathId, svgRoot) {
    if (!DATA.HasMech(pathId)) throw Error(`${pathId} is not in graph data`);
    // basic display props
    this.id = pathId;
    this.data = Object.assign({}, DATA.Mech(pathId)); // copy, not reference
    this.sourceId = 0;
    this.targetId = 0;
    // higher order display properties
    this.dataDisplayMode = {}; // how to display data, what data to show/hide
    this.connectionPoints = []; // array of points available for mechanism connections
    this.highlightMode = {}; // how to display selection, subselection, hover

    // Adding support for VBadge -- Put path/text in a group so that
    // we can attach badges to it.  (Originally no group)
    this.gRoot = svgRoot.group(); // main reference group
    this.path = this.gRoot
      .path()
      .back()
      .fill('none')
      .stroke({ width: 4, color: COLOR.MECH, dasharray: '4 2' });

    this.pathLabel = svgRoot.text(add => {
      add.tspan(this.data.name);
    });
    // HORIZONTAL TEXT ALTERNATIVE
    // For VBadge display, hack in a "normal" text label that will not rotate/follow the path
    // The VBadges will appear next to this text label.
    // However, we still need to place the label for positioning.
    // We're hacking it for VBadge mostly to get a position for the
    // new label (horizText) and VBadges.
    // this.pathLabel = svgRoot.text(add => {
    //   add.tspan('.');
    // });
    // this.horizText = this.gRoot.text(add => {
    //   // don't add horiz text for now -- we probably want to use the regular pathLabel
    //   // add.tspan(this.data.name);
    // });
    // this.horizText.fill(COLOR.MECH);

    // Testing anchor and offsets old value
    //    this.pathLabel.fill(COLOR.MECH).attr('dy', -6);
    // explicitly set offset to 0?
    this.pathLabel
      .fill(COLOR.MECH)
      .attr('dy', -6)
      .attr('dx', 0);
    this.pathLabel.attr('text-anchor', 'end');
    this.textpath = this.pathLabel.path(this.path).attr('startOffset', this.path.length() - m_blen);

    // shared modes
    this.visualState = new VisualState(this.id);
    this.displayMode = {};
    // event hack for may 1
    this.HandleSelect = this.HandleSelect.bind(this);
    this.path.click(this.HandleSelect);
    this.pathLabel.click(this.HandleSelect);

    // add VBadge group
    this.vBadge = VBadge.New(this);
  }

  /**
   * @returns {string} associated nodeId

   */
  Id() {
    return this.id;
  }

  /**
   * cleans up any SVGJS elements that need cleaning up when this instance is destroyed
   */
  Release() {
    if (this.path) this.path.remove();
    this.vBadge.Release();
  }

  /**
   * given source and target nodeIds, get connection points to connect and update SVG paths
   * @param {string} srcId - sourceId of the node to request a connection point **FROM**
   * @param {string} tgtId - targetId of the node to request a connection point **TO**
   */
  Update(srcId, tgtId) {
    const stype = typeof srcId;
    const ttype = typeof tgtId;

    if (srcId === undefined && tgtId === undefined) {
      // update data
      const data = DATA.Mech(this.sourceId, this.targetId);
      this.data.name = data.name;

      // If uisng HORIZONTAL TEXT, Update the VBadge horizText instead of the pathLabel
      this.vBadge.Update(this);

      // no change in srcId or tgtId so return
      return;
    }
    if (stype === 'string' && ttype === 'string') {
      // valid id inputs
      this.sourceId = srcId;
      this.targetId = tgtId;

      // update visual data fields
      const data = DATA.Mech(this.sourceId, this.targetId);
      this.data.name = data.name;

      // update label in case it changed
      this.pathLabel.children()[0].text(this.data.name);

      // Update the VBadge horizText instead of the pathLabel
      this.vBadge.Update(this);

      // update visual paths
      const srcVProp = DATA.VM_VProp(srcId);
      const { pt1: srcPt, pt2: tgtPt } = srcVProp.FindEdgePointConnectionTo(tgtId);
      // pt1 and pt2 contain x,y, and d (distance between pt1 and pt2)
      // pt1 and pt2 also have a source or target property set
      if (srcPt && tgtPt && this.path) {
        this.path.show();
        // we have to flip the starting point so it always draws left-right
        // so text label doesn't draw upside down
        if (srcPt.x < tgtPt.x) {
          // left to right
          this.path.plot(m_MakeQuadraticDrawingString(srcPt, tgtPt));
          this.path.marker('end', SVGDEFS.get('arrowEndHead')).attr('marker-start', '');
          this.pathLabel.attr('text-anchor', 'end');
          this.textpath.attr('startOffset', this.path.length() - m_blen);
        } else {
          // right to left
          this.path.plot(m_MakeQuadraticDrawingString(tgtPt, srcPt));
          this.path.marker('start', SVGDEFS.get('arrowStartHead')).attr('marker-end', '');
          this.pathLabel.attr('text-anchor', 'start');
          this.textpath.attr('startOffset', m_blen);
        }

        // // VBadge hack position of horizText
        // this.horizText.x(this.pathLabel.x());
        // this.horizText.y(this.pathLabel.y());

        return;
      }
      // no srcPt or tgtPt, so hide path if it exists
      if (this.path) this.path.hide();
    }
  }

  HandleSelect(event) {
    console.log(`%c${this.id} clicked`, cssblue);
    DATA.VM_SelectOneMech(this);
    event.stopPropagation();
  }

  /**
   * Handle any post-Update() drawing, such as selection state
   */
  Draw() {
    if (this.visualState.IsSelected()) {
      this.path.stroke({ width: 6, color: COLOR.MECH_SEL, dasharray: '6 3' });
      this.pathLabel.fill(COLOR.MECH_SEL);
    } else {
      this.path.stroke({ width: 4, color: COLOR.MECH, dasharray: '4 2' });
      this.pathLabel.fill(COLOR.MECH);
    }
    this.vBadge.Draw(this);
  }

  DrawBadge() {
    // VMech doesn't seem to call `Draw()`very often,
    // but it does call DrawEdges.
    // Add this DrawBadge() command for use with DrawEdges.
    this.vBadge.Draw(this);
  }
}

/// STATIC CLASS METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Factory method for creating a new managed VMech instance.
 * @param {string} pathId - a PMC pathId of form 'w:v'
 * @param {SVGJSElement} svgRoot - the SVGJS-created root element that should
 * contain the new element.
 * @returns {VMech} - the newly-created VMech instance
 */
VMech.New = (pathId, svgRoot) => {
  if (DATA.VM_VMechExists(pathId)) throw Error(`${pathId} is already allocated`);
  if (svgRoot.constructor.name !== 'Svg') throw Error(`arg2 must be SVGJS draw instance`);
  const vmech = new VMech(pathId, svgRoot);
  if (DBG) console.log('created vmech', vmech.id);
  DATA.VM_VMechSet(vmech, pathId);
  return vmech;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Factory method to de-allocate the VMech associated with the designated edge.
 * Accepts one of three forms:
 * * `sourceNodeId, targetNodeId`
 * * `{ w: sourceNodeId, v: targetNodeId }`
 * * a string of form 'w:v'
 * @param {string|object} vso - a PMC pathId, edgeObj, or source nodeId
 * @param {string} ws - the targetNodeId, if `vso` is also a string
 * contain the new element.
 */
VMech.Release = (vso, ws) => {
  const vmech = DATA.VM_VMech(vso, ws);
  DATA.VM_VMechDelete(vso, ws);
  console.log('released vmech', vmech.id);
  return vmech.Release();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Tells designated VMech to update its appearance from the raw data. It uses
 * its stored id to fetch the data directed from PMCData. Accepts one of three
 * methods for designating which VMech to update:
 * * `sourceNodeId, targetNodeId`
 * * `{ w: sourceNodeId, v: targetNodeId }`
 * * a string of form 'w:v'
 * @param {string|object} vso - a PMC pathId, edgeObj, or source nodeId
 * @param {string} ws - the targetNodeId, if `vso` is also a string contain the
 * new element.
 */
VMech.Update = (vso, ws) => {
  const eobj = CoerceToEdgeObj(vso, ws);
  const vmech = DATA.VM_VMech(eobj);
  vmech.Update(eobj.v, eobj.w);
  return vmech;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Retrieve the VMech by mechanism selector. Accepts one of three
 * methods for designating which VMech to update:
 * * `sourceNodeId, targetNodeId`
 * * `{ w: sourceNodeId, v: targetNodeId }`
 * * a string of form 'w:v'
 * @param {string|object} vso - a PMC pathId, edgeObj, or source nodeId
 * @param {string} ws - the targetNodeId, if `vso` is also a string contain the
 * new element.
 * @returns {VMech} = an instance of the VMech class
 */
VMech.GetVisual = (vso, ws) => {
  return DATA.VM_VMech(vso, ws);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Draw all edges in the model by iterating through them and updating their
 * associated VMech instances. All the VProps should have already been sized and
 * positions before this call.
 */
VMech.DrawEdges = () => {
  // console.group(`%c:drawing ${DATA.VM.map_vmechs.size} edges`, cssinfo);
  let edges = DATA.AllMechs();
  edges.forEach(edgeObj => {
    const { v, w } = edgeObj;
    const vmech = DATA.VM_VMech(edgeObj);
    vmech.Update(v, w);

    // force draw, otherwise Draw is never called
    vmech.DrawBadge();
  });

  // console.groupEnd();
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default VMech;
