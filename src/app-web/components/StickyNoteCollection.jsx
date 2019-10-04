/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Sticky Note Collection

state
    parent      We don't update the parent object directly, 
                we call PMC to do the update.
                The parent object is just used to retrieve comments
                and the parentId.

props
    classes     MEMEStyles MaterialUI styles implementation.
    
    
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


ABOUT THE STICKY NOTE SYSTEM

    There are four components to the Sticky Note System:
    
    1. StickyNoteButton
    2. VBadge
    3. StickyNoteCollection
    4. StickyNote
    
StickyNoteButton
    
    StickyNoteButtons serve two functions:
    1. Display the read/unread/blank status of a sticky note
    2. Clicking on the button will open up the sticky note display
    
    StickyNoteButtons are designed to be attachable to any React component
    (including Evidence and the model itself).
    
    They retain only a minimal amount of data (parentId) and
    retrieve status updates directly from PMCData.
    
    When they open a StickyNoteCollection, they use an URSYS.Publish call.
    
VBadge

    VBadges play the role of StickyNoteButtons for VProps and VMechs
    i.e. SVG objects (StickyNoteButton is used for React Components).
    
    VBadges independently display the read/unread status of comments,
    creating new comments, and updating existing comments.
    
    They trigger StickyNoteColleciton via the same STICKY:OPEN call.
    
    VBadges also maintain an array of Evidence Link badges.

StickyNoteCollection
    
    A StickyNoteCollection is the container component for StickyNotes.
    Each StickyNoteCollection can contain any number of StickyNotes.
    StickyNotes display individual comments from different authors.
    
    There is only a single StickyNoteCollection object in ViewMain.  It gets 
    repurposed for each note that is opened.
    
    StickNotes are opened via an URSYS.Publish('STICKY:OPEN') call.
    
    StickyNotes handle all the data for the StickyNotes, passing
    individual comments as props: onStartEdit, onUpdateComment.
    
    Updates to the comment data are sent directly to PMCData via a
    PMC.UpdateComments() call.
    
StickyNote

    StickyNotes display individual comments from different authors.
    
    Text changes on the text input field are updated locally via the 
    props reference to the StickyNoteCollection's comment object.  We
    then trigger onUpdateComment to tell StickyNoteCollection to 
    send the updated comment info to PMCData.

    props
      
      comment -- This is the comment data (id, text, etc.) that will be displayed
      by the StickNote.
      
      onStartEdit -- This is called whenever the user clicks on the edit button. 
      This is passed to StickyNoteCollection so that StickyNoteCollection can hide 
      buttons that shouldn't be shown during edit (e.g. Reply)
      
      onUpdateComment -- This is called whenever the user edits the comment text
      field or when the user is finished editing and ready to close the sticky.  

    




\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
// Material UI components
import Button from '@material-ui/core/Button';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
// Material UI Icons
import CloseIcon from '@material-ui/icons/Close';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import UR from '../../system/ursys';
import ADM from '../modules/data';
import PMC from '../modules/data';
import UTILS from '../modules/utils';
import StickyNote from './StickyNote';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'StickyNoteCollection:';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class StickyNoteCollection extends React.Component {
  constructor(props) {
    super(props);

    this.DoOpenSticky = this.DoOpenSticky.bind(this);
    this.DoStickyUpdate = this.DoStickyUpdate.bind(this);
    this.DoAddComment = this.DoAddComment.bind(this);
    this.DoCloseSticky = this.DoCloseSticky.bind(this);
    this.OnReplyClick = this.OnReplyClick.bind(this);
    this.OnStartEdit = this.OnStartEdit.bind(this);
    this.OnUpdateComment = this.OnUpdateComment.bind(this);
    this.OnCloseClick = this.OnCloseClick.bind(this);
    this.OnClickAway = this.OnClickAway.bind(this);

    this.state = {
      isHidden: true,
      isBeingEdited: false,
      comments: [],
      top: 0,
      left: 0,
      parentId: ''
    };

    UR.Subscribe('STICKY:OPEN', this.DoOpenSticky);
    UR.Subscribe('DATA_UPDATED', this.DoStickyUpdate);
  }

  componentDidMount() {}

  componentWillUnmount() {
    UR.Unsubscribe('STICKY:OPEN', this.DoOpenSticky);
    UR.Unsubscribe('DATA_UPDATED', this.DoStickyUpdate);
  }

  DoOpenSticky(data) {
    if (DBG) console.log(PKG, 'DoOpenSticky', data);
    const { parentId, x, y } = data;
    let comments = PMC.GetComments(parentId);
    let isBeingEdited = false;
    // if no comments yet, add an empty comment automatically
    if (comments === undefined || comments.length === 0) {
      const author = ADM.GetSelectedStudentId();
      const starter = ADM.GetSentenceStartersByClassroom().sentences;
      comments = [PMC.NewComment(author, starter)];
      isBeingEdited = true;
    }
    this.setState({
      isHidden: false,
      isBeingEdited,
      comments,
      top: y,
      left: x - 375, // width of stickyonotecard HACK!!!
      parentId
    });
  }

  DoAddComment() {
    const author = ADM.GetSelectedStudentId();
    const starter = ADM.GetSentenceStartersByClassroom().sentences;
    let comment = PMC.NewComment(author, starter);
    this.setState(state => {
      return { comments: state.comments.concat([comment]) };
    });
  }

  // PMC has updated sticky data, usually unread status
  // Update our existing data directly from PMC.
  DoStickyUpdate() {
    const { parentId } = this.state;
    let comments = PMC.GetComments(parentId);
    if (DBG) console.log(PKG, 'DoStickyUpdate with comments', comments);
    if (DBG) console.table(comments);
    this.setState({
      comments
    });
  }

  DoSaveSticky() {
    const { parentId, comments } = this.state;
    PMC.UpdateComments(parentId, comments);
  }

  DoCloseSticky() {
    if (DBG) console.log(PKG, 'DoCloseSticky');
    
    UR.Publish('STICKY_CLOSED');

    // Mark all comments read, then update comments
    this.setState(state => {
      // Cull empty comments
      const comments = state.comments.filter(c => {
        return String(c.text).trim() !== '';
      });
      const author = ADM.GetSelectedStudentId();
      comments.forEach(comment => {
        if (comment.readBy.includes(author)) return;
        comment.readBy.push(author);
        UTILS.RLog('CommentMarkRead', `"${comment.text}" read by "${author}"`);
      });
      if (DBG) console.log(PKG, 'DoCloseSticky: comments should be:');
      if (DBG) console.table(comments);
      return {
        comments,
        isHidden: true
      };
    }, this.DoSaveSticky);
  }

  OnReplyClick(e) {
    if (DBG) console.log(PKG, 'OnReplyClick');
    e.preventDefault();
    this.setState({ isBeingEdited: true }, () => {
      this.DoAddComment();
    });
  }

  OnStartEdit() {
    if (DBG) console.log(PKG, 'OnStartEdit');
    this.setState({
      isBeingEdited: true
    });
  }

  /**
   * StickyNote has finished editing and ready to send updated data to PMCData
   * The optional `action` key is used to request comment deletion.
   * @param {Object} data - {comment} [action] - `action` is used for delete
   */
  OnUpdateComment(data) {
    if (DBG) console.log(PKG, 'OnUpdateComment: comments', data);
    let { comments } = this.state;
    if (data === undefined) {
      console.error(PKG, "OnUpdateComment got undefined data.  This should'nt happen");
    } else if (data.action && data.action === 'delete') {
      // Handle Delete Request
      comments = comments.filter(co => {
        return co.id !== data.comment.id;
      });
      UTILS.RLog('CommentDelete', `"${data.comment.text}" from "${this.state.parentId}"`);
    } else {
      // Regular data update
      const index = comments.findIndex(co => co.id === data.comment.id);
      if (index > -1) comments.splice(index, 1, data.comment); // ignore if it's been culled
      UTILS.RLog(
        'CommentUpdate',
        `"${data.comment.text}" with criteria "${data.comment.criteriaId}" on "${this.state.parentId}"`
      );
    }
    this.setState(
      {
        comments,
        isBeingEdited: false
      },
      this.DoSaveSticky
    );
  }

  OnCloseClick() {
    this.DoCloseSticky();
  }

  OnClickAway() {
    // Disable OnClickAway for now because when the user clicks on a StickyButton on a prop,
    // the ClickAwayListener seems to get a click event well after DoOpenSticky is called
    // so the StickyNoteCollection is closed immediately after opening.
    //
    // The ClickAway listener should be placed directly on StickyNote instead.
    //
    // console.log(PKG, 'OnClickAway isHidden', this.state.isHidden, 'isBeingEdited', this.state.isBeingEdited, 'close?', (!this.state.isHidden && !this.state.isBeingEdited))
    // if (!this.state.isHidden && !this.state.isBeingEdited) {
    //   this.DoCloseSticky();
    // } else {
    //   // don't do anything if the user is still editing comment
    // }
  }

  render() {
    const { classes } = this.props;
    const { comments, isHidden, isBeingEdited, top, left, parentId } = this.state;

    return (
      <Draggable>
        <Paper className={classes.stickynotePaper} hidden={isHidden} style={{ top, left }}>
          {/* <IconButton
            size="small"
            style={{ position: 'absolute', right: '-25px', top: '-25px' }}
            onClick={this.OnCloseClick}
          >
            <CloseIcon />
          </IconButton> */}
          {comments.map(comment => {
            return (
              <StickyNote
                comment={comment}
                key={parentId + comment.id}
                OnStartEdit={this.OnStartEdit}
                OnUpdateComment={this.OnUpdateComment}
              />
            );
          })}
          <Button
            size="small"
            style={{ margin: '5px' }}
            variant="outlined"
            hidden={isBeingEdited}
            onClick={this.OnReplyClick}
          >
            Comment
          </Button>
          <Button
            size="small"
            style={{ float: 'right', margin: '5px' }}
            variant="outlined"
            onClick={this.OnCloseClick}
          >
            <CloseIcon /> Close
          </Button>
        </Paper>
      </Draggable>
    );
  }
}

StickyNoteCollection.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object
};

StickyNoteCollection.defaultProps = {
  classes: {}
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(StickyNoteCollection);
