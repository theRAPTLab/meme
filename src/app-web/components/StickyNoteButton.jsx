/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Sticky Note Icon Button

    For documentation, see boilerplate/src/app-web/components/StickyNote.jsx

props

    parentId    This is used to load the parent object. 
                e.g. if the parent object is an evidence link, this
                points to the evId.
                
    parentType  Sticky Notes need to tknow the type of parentId 
                that is being passed.  We (StickyNoteButton) don't use
                this information directly but it is passed to StickyNote
                when we publish the STICKIES:OPEN event.

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
import ADM from '../modules/adm-data';
import PMC from '../modules/pmc-data';

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
    this.DoStickiesUpdate = this.DoStickiesUpdate.bind(this);
    this.OnCommentClick = this.OnCommentClick.bind(this);

    this.state = {
      hasNoComments: true,
      hasUnreadComments: false
    };

    UR.Sub('DATA_UPDATED', this.DoDataUpdate); // Update sticky button when model is first loaded
    UR.Sub('STICKY:UPDATED', this.DoStickiesUpdate); // Broadcast when a group is added.
  }

  componentDidMount() {
    this.OnUpdateReadStatus();
  }

  componentWillUnmount() {
    UR.Unsub('DATA_UPDATED', this.DoDataUpdate);
    UR.Unsub('STICKY:UPDATED', this.DoStickiesUpdate);
  }

  DoDataUpdate() {
    this.OnUpdateReadStatus();
  }

  DoStickiesUpdate() {
    // Update read status?
    this.OnUpdateReadStatus();
  }

  OnUpdateReadStatus() {
    const parent = PMC.GetParent(this.props.parentId, this.props.parentType);
    const comments = parent.comments || [];
    const author = ADM.GetSelectedStudentId();
    this.setState({
      hasNoComments: comments.length < 1,
      hasUnreadComments: comments.find(comment => {
        return comment.readBy ? !comment.readBy.includes(author) : false;
      })
    });
  }

  OnCommentClick(e) {
    e.preventDefault();
    e.stopPropagation();

    UR.Publish('STICKY:OPEN', {
      parentId: this.props.parentId,
      parentType: this.props.parentType,
      x: e.clientX,
      y: e.clientY
      // windowWidth: e.view.window.innerWidth, // not used
      // windowHeight: e.view.window.innerHeight // not used
    });
  }

  render() {
    const { hasNoComments, hasUnreadComments } = this.state;
    const { classes } = this.props;

    // Figure out which icon to show
    // Has comments, all read
    let icon = <ChatBubbleIcon className={classes.stickynoteIcon} />;
    if (hasNoComments) {
      if (DBG) console.log(PKG,'setting icon to chat empty');
      icon = <ChatBubbleOutlineIcon className={classes.stickynoteIcon} />;
    } else if (hasUnreadComments) {
      if (DBG) console.log(PKG,'setting icon to chat + text');
      icon = <ChatIcon className={classes.stickynoteIcon} />;
    } else {
      // eslint-disable-next-line no-lonely-if
      if (DBG) console.log(PKG,'setting icon to chat cleared');
    }

    return <Button onClick={this.OnCommentClick}>{icon}</Button>;
  }
}

StickyNoteButton.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object,
  parentId: PropTypes.string,
  parentType: PropTypes.string
};

StickyNoteButton.defaultProps = {
  classes: {},
  parentId: '',
  parentType: ''
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(StickyNoteButton);
