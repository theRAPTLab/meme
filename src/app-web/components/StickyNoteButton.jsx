/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Sticky Note Icon Button

    For documentation, see boilerplate/src/app-web/components/StickyNote.jsx

props

    refId       This is used to load the parent object.
                e.g. if the parent object is an evidence link, this
                points to the evId.

state

    parent      We need to load and keep a local copy of the parent object
                in order to look up the comments when setting the read/unread
                state of the button

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
// Material UI components
import Button from '@material-ui/core/Button';
// Material UI Icons
import ChatIcon from '@material-ui/icons/Chat';
import ChatBubbleIcon from '@material-ui/icons/ChatBubble';
import ChatBubbleOutlineIcon from '@material-ui/icons/ChatBubbleOutline';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import UR from '../../system/ursys';
import ADM from '../modules/data';
import PMC from '../modules/data';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'StickyNoteButton:';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class StickyNoteButton extends React.Component {
  constructor(props) {
    super(props);
    this.DoDataUpdate = this.DoDataUpdate.bind(this);
    this.DoSetClosed = this.DoSetClosed.bind(this);
    this.OnCommentClick = this.OnCommentClick.bind(this);

    this.state = {
      hasNoComments: true,
      hasUnreadComments: false,
      isOpen: false
    };

    UR.Subscribe('DATA_UPDATED', this.DoDataUpdate); // Update sticky button when model is first loaded
    UR.Subscribe('STICKY_CLOSED', this.DoSetClosed); // StickyNoteCollection has been closed
  }

  componentDidMount() {
    this.OnUpdateReadStatus();
  }

  componentWillUnmount() {
    UR.Unsubscribe('DATA_UPDATED', this.DoDataUpdate);
    UR.Unsubscribe('STICKY_CLOSED', this.DoSetClosed);
  }

  DoDataUpdate() {
    this.OnUpdateReadStatus();
  }

  /**
   * When the StickyNoteCollection closes, we update our color to show that we're no longer
   * the selected comment.
   */
  DoSetClosed() {
    this.setState({ isOpen: false });
  }
  
  /**
   * When Stickynote data is updated, we take a look at comments and figure out
   * if there are unread comments, new comments, or whatever, and set state of
   * the button based on that information. Invoked from DATA_UPDATED.
   */
  OnUpdateReadStatus() {
    let comments;
    comments = PMC.GetComments(this.props.refId);
    const author = ADM.GetAuthorId();
    const hasNoComments = comments ? comments.length < 1 : true;
    const hasUnreadComments = PMC.HasUnreadComments(comments, author);
    this.setState({
      hasNoComments,
      hasUnreadComments
    });
  }

  OnCommentClick(e) {
    e.preventDefault();
    e.stopPropagation();

    this.setState({ isOpen: true });
    
    UR.Publish('STICKY:OPEN', {
      refId: this.props.refId,
      x: e.clientX,
      y: e.clientY
      // windowWidth: e.view.window.innerWidth, // not used
      // windowHeight: e.view.window.innerHeight // not used
    });
  }

  render() {
    const { hasNoComments, hasUnreadComments, isOpen } = this.state;
    const { classes } = this.props;
    const iconCSS = isOpen ? classes.stickynoteIconOpen : classes.stickynoteIcon;
    
    // Figure out which icon to show
    let icon;
    if (hasNoComments) {
      if (DBG) console.log(PKG, 'setting icon to chat empty');
      icon = <ChatBubbleOutlineIcon className={iconCSS} />; // No comments
    } else if (hasUnreadComments) {
      if (DBG) console.log(PKG, 'setting icon to chat + text');
      icon = <ChatIcon className={iconCSS} />; // Has comments, unread
    } else {
      if (DBG) console.log(PKG, 'setting icon to chat cleared');
      icon = <ChatBubbleIcon className={iconCSS} />; // Has comments, all read
    }

    return <Button onClick={this.OnCommentClick}>{icon}</Button>;
  }
}

StickyNoteButton.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object,
};

StickyNoteButton.defaultProps = {
  classes: {},
  refId: undefined
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(StickyNoteButton);
