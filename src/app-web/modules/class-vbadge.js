import DEFAULTS from './defaults';
import ADM from './data';
import PMC from './data';
import UR from '../../system/ursys';

const { VPROP, COLOR, SVGSYMBOLS } = DEFAULTS;

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const m_minWidth = VPROP.MIN_WIDTH;
const m_minHeight = VPROP.MIN_HEIGHT;
const m_pad = 5; // was PAD.MIN, but that's too big.  5 works better

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'VBadge';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * The visual representation of "a badge" that can represent:
 *   * a link to the evidence Link
 *   * a link to the sticky note comments associated with the parent
 *
 */
class VBadge {
  /** create a VBadge
   * @param {object} vparent Parent component: class-vprop or class-vmech
   */
  constructor(vparent) {
    // Init Data
    this.width = m_minWidth;
    this.height = m_minHeight;
    this.evlinks = [];
    this.comments = [];

    // create our own groups
    /**
     *  vBadge
     *    |
     *    +-- gBadges (group)
     *           |
     *           +- gEvLinkBadges (group)
     *           |
     *           +-- gStickyButtons (group)
     */
    this.gBadges = vparent.GetVBadgeParent().group().attr('id', 'gBadges');
    this.gEvLinkBadges = this.gBadges.group().attr('id', 'gEvLinkBadges');
    this.gStickyButtons = VBadge.SVGStickyButton(vparent, 0, 0);
    this.gBadges.add(this.gStickyButtons);

    this.gBadges.click(e => {
      this.OnClick(e);
    });

    this.Update(vparent);
  }

  /**
   *  gBadges got a custom click event from class-vprop-draggable
   * @param {mouseEvent} event class-vprop or class-vmech
   */
  OnClick(event) {
    const mouseEvent = event.detail.event;
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();

    // Which component got the click?
    const { offsetX, offsetY } = mouseEvent;
    if (this.gStickyButtons && this.gStickyButtons.inside(offsetX, offsetY)) {
      // StickyButton got the click
      // Handle as click and pass to VBadge
      this.gStickyButtons.fire('click', { event: mouseEvent });
    } else if (this.evlinks) {
      // An Evidence Link Badge go tthe click
      // Figure out which badge
      this.gEvLinkBadges.children().forEach(gBadge => {
        if (gBadge.inside(offsetX, offsetY)) {
          gBadge.fire('click', { event: mouseEvent });
        }
      });
    } else {
      console.error(PKG, 'OnClick could not find click object');
    }
  }

  SetDimensionsFromParent(vparent) {
    this.width = vparent.width;
    this.height = vparent.height;
    this.Draw(vparent);
  }

  /**
   *  Update is called by VProp/VMech before Draw
   * @param {*} vparent class-vprop or class-vmech
   */
  Update(vparent) {
    let id = vparent.id;
    if (m_IsVMech(vparent)) {
      // parent is a VMech
      this.evlinks = PMC.PMC_GetEvLinksByMechId(id);
      //console.error('id', id, 'isMech!', vparent, 'evlinks are', this.evlinks);
    } else {
      // parent is VProp
      this.evlinks = PMC.PMC_GetEvLinksByPropId(id);
      //console.log('id', id, 'isProp!',vparent,'evlinks are', this.evlinks);
    }
  }

  /**
   *  Draw is called by VProp or VMech
   * @param {*} vparent class-vprop or class-vmech
   */
  Draw(vparent) {
    // draw badges from left to right

    const isVMech = m_IsVMech(vparent);

    let xOffset;
    let yOffset;
    let x;
    let y;
    let baseX;
    let baseY;
    if (isVMech) {
      // VMech
      x = 0;
      y = 0;
      // xOffset ought to be the text length + padding
      xOffset = vparent.horizText.length();
      yOffset = -8; // hoist badges back up even with text baseline.
      // baseX is the position on the right side of the parent that the badges should start drawing from
      // it draws right-justified, like rtl text.
      baseX = x + xOffset - m_pad * 3;
      baseY = y + yOffset + m_pad * 2;
    } else {
      // VProp
      let baseElement = vparent.visBG; // position of the base prop rectangle
      x = baseElement.x();
      y = baseElement.y();
      xOffset = this.width;
      yOffset = -4;
      baseX = x + xOffset - m_pad;
      baseY = y + yOffset + m_pad * 2;
    }

    // counter offset for each badge
    let xx = 0;

    // draw evidence link badges
    // -- first clear the group in case objects have changed
    this.gEvLinkBadges.clear();
    if (this.evlinks) {
      // First sort evlinks by number
      const evlinks = this.evlinks.sort((a, b) => {
        return a.number > b.number ? 1 : -1;
      });
      // Then draw each badge
      evlinks.forEach(evlink => {
        const badge = VBadge.SVGEvLink(evlink, vparent);
        this.gEvLinkBadges.add(badge);
        if (isVMech) {
          // Draw left-justified
          badge.move(baseX + xx + badge.width(), baseY);
        } else {
          // Draw right-justified
          badge.move(baseX + xx - badge.width() - m_pad, baseY);
        }
        xx += badge.width() + m_pad;
      });
    }

    // Set Current Read/Unreaad status
    let hasNoComments;
    let hasUnreadComments;
    const comments = PMC.GetComments(vparent.id);
    if (comments === undefined) {
      hasNoComments = true;
      hasUnreadComments = false;
    } else {
      hasNoComments = comments.length < 1;
      const author = ADM.GetSelectedStudentId(); // FIXME: This should read from session
      hasUnreadComments = comments.find(comment => {
        return comment.readBy ? !comment.readBy.includes(author) : false;
      });
    }
    if (hasNoComments) {
      this.gStickyButtons.chat.attr('display', 'none');
      this.gStickyButtons.chatBubble.attr('display', 'none');
      this.gStickyButtons.chatBubbleOutline.attr('display', 'none'); // don't show outline ot keep interface clean
    } else if (hasUnreadComments) {
      this.gStickyButtons.chat.attr('display', 'inline');
      this.gStickyButtons.chatBubble.attr('display', 'none');
      this.gStickyButtons.chatBubbleOutline.attr('display', 'none');
    } else {
      // all comments read
      this.gStickyButtons.chat.attr('display', 'none');
      this.gStickyButtons.chatBubble.attr('display', 'inline');
      this.gStickyButtons.chatBubbleOutline.attr('display', 'none');
    }

    // Move gStickyButtons only AFTER setting display state, otherwise, the icon will get drawn at 0,0
    if (isVMech) {
      // left-justified
      this.gStickyButtons.move(baseX + xx + this.gStickyButtons.bbox().w + m_pad, baseY); // always move in case evlink badges change      
    } else {
      // right-justified
      this.gStickyButtons.move(baseX + xx - this.gStickyButtons.bbox().w - m_pad, baseY); // always move in case evlink badges change
    }

    // adjust for width of vprop
    if (!isVMech) {
      let { w: bw } = this.gEvLinkBadges.bbox();
      this.gBadges.move(baseX - bw - this.gStickyButtons.bbox().w - m_pad * 2, baseY);
    }
  }

  /**
   *  Release is called by VProp or VMech
   */
  Release() {
    this.gStickyButtons.remove();
    this.gEvLinkBadges.remove();
    this.gBadges.remove();
  }
}

/// STATIC CLASS METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 *  Allocate VBadge instances through this static method. It maintains
 *  the collection of all allocated visuals through DATA.VM_* calls as well
 */
VBadge.New = vparent => {
  const vbadge = new VBadge(vparent);
  return vbadge;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  De-allocate VProp instance by id.
 */
VBadge.Release = () => {
  console.error('I dont think this is aalled');
  // const vbadge = DATA.VM_VBadge(evId);
  // DATA.VM_VBadgeDelete(evId);
  // return vbadge.Release();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Update instance from associated data id
 */
VBadge.Update = evId => {
  // not updated yet
  // const vbadge = DATA.VM_VBadge(evId);
  // if (vbadge) vbadge.Update();
  // return vbadge;
};

/// SVGEvLink  ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Creates and returns a badge for an evidence link
 */
VBadge.SVGEvLink = (evlink, vparent) => {
  const root = vparent.gRoot;
  const radius = m_minHeight - m_pad / 2;

  const onClick = customEvent => {
    const e = customEvent.detail.event || customEvent; // class-vprop-dragdrop sends custom events, but vmech sends regular mouse events.
    e.preventDefault();
    e.stopPropagation();
    if (DBG) console.log(`${e.target} clicked`);
    UR.Publish('SHOW_EVIDENCE_LINK', { evId: evlink.evId, rsrcId: evlink.rsrcId });
  };

  // create vbadge sub elements
  const gBadge = root.group().click(onClick);
  gBadge.gCircle = gBadge.circle(radius).fill('#4db6ac');

  gBadge.gLabel = gBadge
    .text(evlink.number)
    .font({ fill: '#fff', size: '1em', anchor: 'middle' })
    .move(m_pad, m_pad / 2);

  gBadge.gRating = VBadge.SVGRating(evlink, gBadge).move(
    (3 - Math.max(1, Math.abs(evlink.rating))) * 4, // always shift at least 1 symbol, since no rating is 0
    radius
  );

  return gBadge;
};

/// SVGRating  ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Creates and returns the rating icon for a badge
 */
VBadge.SVGRating = (evlink, gBadge) => {
  const rating = evlink.rating;
  let gRatings = gBadge.gRatings || gBadge.group(); // use existing group if it exists
  gRatings.clear();
  if (rating > 0) {
    // positive
    for (let i = 0; i < rating; i++) {
      gRatings
        .use(SVGSYMBOLS.get('ratingsPositive'))
        .move(i * (5 + m_pad), m_pad)
        .scale(0.4);
    }
  } else if (rating < 0) {
    // negative
    for (let i = 0; i < -rating; i++) {
      gRatings
        .use(SVGSYMBOLS.get('ratingsNegative'))
        .move(i * (5 + m_pad), m_pad)
        .scale(0.4);
    }
  } else {
    // Not Rated
    gRatings
      .use(SVGSYMBOLS.get('ratingsNeutral'))
      .move(m_pad, m_pad)
      .scale(0.4);
  }

  return gRatings;
};

/// SVGStickyButton  //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Creates and returns a sticky button group object with three buttons to turn on/off
 */
VBadge.SVGStickyButton = (vparent, x, y) => {
  const onClick = customEvent => {
    let e = customEvent.detail.event || customEvent; // class-vprop-dragdrop sends custom events, but vmech sends regular mouse events.
    e.preventDefault();
    e.stopPropagation();
    if (DBG) console.log(`${e.target} clicked e=${e}`);
    UR.Publish('STICKY:OPEN', {
      parentId: vparent.id,
      x: e.clientX,
      y: e.clientY
    });
  };

  // create vbadge sub elements
  let gStickyButtons = vparent.gRoot
    .group()
    .move(x, y)
    .click(onClick);

  // Create SVG Icons
  gStickyButtons.chat = gStickyButtons.group().use(SVGSYMBOLS.get('chatIcon'));
  gStickyButtons.chatBubble = gStickyButtons.group().use(SVGSYMBOLS.get('chatBubble'));
  gStickyButtons.chatBubbleOutline = gStickyButtons
    .group()
    .use(SVGSYMBOLS.get('chatBubbleOutline'));

  return gStickyButtons;
};

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_IsVMech(parent) {
  // FIXME: A hacky way to check if the parent is a VMech
  // A VMech by definition has to have a sourceId and targetId defined
  return parent.sourceId !== undefined;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default VBadge;
