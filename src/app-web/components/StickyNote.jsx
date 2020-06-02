/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Sticky Note

    For documentation, see boilerplate/src/app-web/components/StickyNoteCollection.jsx

    NOTE: The text input needs a mouseDown handler to stopProgation of
    the click to the react-draggable component in the parent
    StickyNoteCollection component.  Otherwise, the user won't be able
    to click on the field to enter text.

props

    comment           Comment data passed from the parent StickyNote

    OnStartEdit       prop func called by StickyNote when user clicks "Edit"
                      This sets isBeingEdited mode on the StickyNoteCollection
                      paren, which hides the "Comment" button.

    OnUpdateComment   prop func called by StickyNote when user is
                      finished editing and ready to save.

state

    isBeingEdited     User is editing card, show input field, hide Edit button

    allowedToEdit     User is the comment author or in the same group so allowed
                      to edit the comment.

    allowedToDelete   User is the comment author, so allowed to delete the
                      comment.  NOTE: We might want to restrict this to
                      teachers only.

    showEditButtons   Boolean flag to show edit and delete buttons for the card.

    criteria          The menu for selecting criteria

    comment           A local state copy of the comment text.
                      This is updated/read on the intial construction from
                      this.props.comment.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
// Material UI Icons
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
// Material UI Theming
import { withStyles, MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import UR from '../../system/ursys';
import ADM from '../modules/data';
import PMC from '../modules/pmc-data';
import ASET from '../modules/adm-settings';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class StickyNote extends React.Component {
  constructor(props) {
    super(props);

    // Handle Focus
    // create a ref to store the textInput DOM element
    this.textInput = React.createRef();

    this.DoOpenSticky = this.DoOpenSticky.bind(this);
    this.OnEditClick = this.OnEditClick.bind(this);
    this.DoEditStart = this.DoEditStart.bind(this);
    this.DoSave = this.DoSave.bind(this);
    this.DoDelete = this.DoDelete.bind(this);
    this.FocusTextInput = this.FocusTextInput.bind(this);
    this.OnEditFinished = this.OnEditFinished.bind(this);
    this.OnDeleteClick = this.OnDeleteClick.bind(this);
    this.OnCriteriaSelect = this.OnCriteriaSelect.bind(this);
    this.OnCommentTextChange = this.OnCommentTextChange.bind(this);
    this.OnMouseEnter = this.OnMouseEnter.bind(this);
    this.OnMouseLeave = this.OnMouseLeave.bind(this);
    this.OnClickAway = this.OnClickAway.bind(this);

    this.state = {
      isBeingEdited: false,
      allowedToEdit: false,
      allowedToDelete: false,
      showEditButtons: false,
      criteria: [],
      comment: {}
    };
  }

  componentDidMount() {
    this.DoOpenSticky();
  }

  componentWillUnmount() {}

  DoOpenSticky() {
    const { comment } = this.props;
    const criteria = ADM.GetCriteriaByModel(); // always use the current model's criteria
    const currentGroup = ADM.GetGroupByStudent();
    const authorGroup = ADM.GetGroupByStudent(comment.author);
    const isAuthor = currentGroup === authorGroup;
    const isTeacher = ADM.IsTeacher();
    const isDBReadOnly = ADM.IsDBReadOnly();

    let allowedToEdit = isAuthor && !isDBReadOnly;
    let allowedToDelete = (isAuthor || isTeacher) && !isDBReadOnly; // REVIEW: Only teachers are allowed to delete?
    if (comment.text === '') {
      if (comment.author.toUpperCase() === ADM.GetAuthorId()) { // force UpperCase for backward compatibility
        // automatically turn on editing if this is a new empty comment
        // AND we are the author
        this.DoEditStart();
      } else {
        comment.placeholder = '...'; // show that someone else is writing
        allowedToEdit = false; // you're not allowed to delete someone else's edit
        allowedToDelete = false; // you're not allowed to delete someone else's edit
      }
    }
    this.setState({
      criteria,
      comment,
      // selectedCriteriaId: this.props.comment.criteriaId,
      allowedToEdit,
      allowedToDelete
    });
  }

  DoEditStart() {
    const pmcDataId = ASET.selectedPMCDataId;
    const intCommentId = Number(this.props.comment.id);
    UR.DBTryLock('pmcData.comments', [pmcDataId, intCommentId]).then(rdata => {
      const { success, semaphore, uaddr, lockedBy } = rdata;
      status += success
        ? `${semaphore} lock acquired by ${uaddr} `
        : `failed to acquired ${semaphore} lock `;
      if (rdata.success) {
        console.log('do something here because u-locked!');
        this.setState({ isBeingEdited: true }, () => {
          this.FocusTextInput();
          this.props.OnStartEdit();
        });
      } else {
        console.log('aw, locked by', rdata.lockedBy);
        alert(
          `Sorry, someone else (${rdata.lockedBy}) is editing this Comment right now.  Please try again later.`
        );
      }
    });
  }

  DoSave() {
    if (ADM.IsDBReadOnly()) return;

    // Automatically mark read by author
    const comment = this.state.comment;
    const author = ADM.GetAuthorId();

    if (this.state.isBeingEdited) {
      // save
      PMC.DB_CommentUpdate(this.props.refId, comment, rdata => {
        this.props.OnUpdateComment();
      });
      const pmcDataId = ASET.selectedPMCDataId;
      const intCommentId = Number(this.props.comment.id);
      UR.DBTryRelease('pmcData.comments', [pmcDataId, intCommentId]);
    } else {
      // just mark read
      // but first make sure the comment is valid (has been saved and already established an id)
      if (comment.id === undefined) throw Error('StickyNote.DoSave trying to mark read a comment with no id', comment.text);
      PMC.DB_MarkRead(comment.id, author);
    }
  }

  DoDelete() {
    const pmcDataId = ASET.selectedPMCDataId;
    const intCommentId = Number(this.props.comment.id);
    UR.DBTryLock('pmcData.comments', [pmcDataId, intCommentId]).then(rdata => {
      const { success, semaphore, uaddr, lockedBy } = rdata;
      status += success
        ? `${semaphore} lock acquired by ${uaddr} `
        : `failed to acquired ${semaphore} lock `;
      if (rdata.success) {
        console.log('do something here because u-locked!');
        PMC.DB_CommentDelete(this.state.comment.id);
        this.props.OnUpdateComment(); // tell StickyNoteCollection to exit edit mode
      } else {
        console.log('aw, locked by', rdata.lockedBy);
        alert(
          `Sorry, someone else (${rdata.lockedBy}) is editing this Comment right now.  Please try again later.`
        );
      }
    });
  }

  OnEditClick(e) {
    e.preventDefault();
    this.DoEditStart();
  }

  FocusTextInput() {
    // Explicitly focus the text input using the raw DOM API
    // Note: we're accessing "current" to get the DOM node
    // https://reactjs.org/docs/refs-and-the-dom.html#adding-a-ref-to-a-dom-element
    // https://stackoverflow.com/questions/52222988/how-to-focus-a-material-ui-textfield-on-button-click/52223078
    this.textInput.current.focus();
    // Set cursor to end of text.
    const pos = this.textInput.current.value.length;
    this.textInput.current.setSelectionRange(pos, pos);
  }

  OnEditFinished() {
    this.DoSave();
    // stop editing and close
    this.setState({
      isBeingEdited: false
    });
  }

  OnDeleteClick() {
    this.DoDelete();
    // stop editing and close
    this.setState({
      isBeingEdited: false
    });
  }

  OnCriteriaSelect(e) {
    let criteriaId = parseInt(e.target.value);
    this.setState(state => {
      let comment = state.comment;
      comment.criteriaId = criteriaId;
      return { comment };
    });
  }

  OnCommentTextChange(text) {
    this.setState(state => {
      const comment = state.comment;
      comment.text = text;
      return { comment };
    });
  }

  OnMouseEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    // Show Edit Buttons
    this.setState({
      showEditButtons: true
    });
  }

  OnMouseLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    // Hide Edit Buttons
    this.setState({
      showEditButtons: false
    });
  }

  OnClickAway() {
    if (this.state.isBeingEdited) this.OnEditFinished();
  }

  render() {
    // theme overrides
    // See https://github.com/mui-org/material-ui/issues/14905 for details
    const theme = createMuiTheme();
    theme.overrides = {
      MuiInputBase: {
        input: {
          backgroundColor: 'rgba(255,255,255,0.8)',
          // No need to override hover.  This affects ModelTitle.
          // '&:hover': {
          //   backgroundColor: 'rgba(255,255,255,1)'
          // },
          '&:disabled': {
            backgroundColor: 'rgba(255,255,255,0.1)'
          }
        }
      },
      MuiFilledInput: {
        root: {
          paddingTop: '3px'
        },
        multiline: {
          padding: '0'
        }
      }
    };

    const {
      isBeingEdited,
      allowedToEdit,
      allowedToDelete,
      showEditButtons,
      criteria,
      comment
    } = this.state;
    const { classes } = this.props;
    const hasBeenRead = PMC.HasBeenRead(this.props.comment.id, ADM.GetAuthorId());
    const date = new Date(comment.date);
    const timestring = date.toLocaleTimeString('en-Us', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const datestring = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    const showCriteria = isBeingEdited || comment.id !== '';
    const selectedCriteria = criteria.find(crit => crit.id === comment.criteriaId);
    const criteriaDescription = selectedCriteria !== undefined ? selectedCriteria.description : '';
    let criteriaDisplay;
    if (isBeingEdited) {
      criteriaDisplay = (
        <select value={comment.criteriaId} onChange={this.OnCriteriaSelect}>
          <option value="" key="empty">
            Select one...
          </option>
          {criteria.map(crit => (
            <option value={crit.id} key={crit.id} className={classes.criteriaSelectorMenu}>
              {crit.label}
            </option>
          ))}
        </select>
      );
    } else {
      criteriaDisplay = ADM.GetCriteriaLabel(comment.criteriaId);
    }
    return (
      <ClickAwayListener onClickAway={this.OnClickAway}>
        <Paper
          className={hasBeenRead ? classes.stickynoteCardRead : classes.stickynoteCard}
          onMouseEnter={this.OnMouseEnter}
          onMouseLeave={this.OnMouseLeave}
        >
          <Grid container>
            <Grid item xs={3}>
              <Typography variant="subtitle2" className={classes.stickynoteCardAuthor}>
                {`${ADM.GetStudentName(comment.author)} ${ADM.GetGroupNameByStudent(comment.author)}`}
              </Typography>
              <Typography variant="caption" className={classes.stickynoteCardLabel}>
                {`${timestring}`}
                <br />
                {`${datestring}`}
              </Typography>
            </Grid>
            <Grid item xs={9}>
              <div hidden={!showCriteria}>
                <InputLabel className={classes.stickynoteCardLabel}>CRITERIA:&nbsp;</InputLabel>
                <div className={classes.stickynoteCardCriteria} title={criteriaDescription}>
                  {criteriaDisplay}
                </div>
                <div hidden={!isBeingEdited} className={classes.stickynoteCardCriteriaDescription}>
                  {criteriaDescription}
                </div>
              </div>
              <MuiThemeProvider theme={theme}>
                <Input
                  className={classes.stickynoteCardInput}
                  value={comment.text}
                  placeholder={comment.placeholder}
                  onChange={e => this.OnCommentTextChange(e.target.value)}
                  onMouseDown={e => e.stopPropagation()}
                  variant="filled"
                  rowsMax="4"
                  multiline
                  disableUnderline
                  inputProps={{
                    readOnly: !(allowedToEdit && isBeingEdited),
                    disabled: !(allowedToEdit && isBeingEdited)
                  }}
                  inputRef={this.textInput}
                />
              </MuiThemeProvider>
            </Grid>
          </Grid>
          <Grid container style={{ alignItems: 'flex-end', marginTop: '3px', height: '20px' }}>
            <Grid item style={{ flexGrow: '1' }}>
              <IconButton
                size="small"
                hidden={!showEditButtons || !allowedToDelete}
                onClick={this.OnDeleteClick}
                className={classes.stickynoteCardEditBtn}
              >
                <DeleteIcon fontSize="small" className={classes.stickynoteCardAuthor} />
              </IconButton>
            </Grid>
            <Grid item xs={1}>
              <IconButton
                size="small"
                hidden={!showEditButtons || (!allowedToEdit || isBeingEdited)}
                onClick={this.OnEditClick}
                className={classes.stickynoteCardEditBtn}
              >
                <EditIcon fontSize="small" className={classes.stickynoteCardAuthor} />
              </IconButton>
            </Grid>
          </Grid>
        </Paper>
      </ClickAwayListener>
    );
  }
}

StickyNote.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  comment: PropTypes.object,
  refId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  OnStartEdit: PropTypes.func,
  OnUpdateComment: PropTypes.func
};

StickyNote.defaultProps = {
  classes: {},
  comment: {
    id: -1,
    author: '',
    date: new Date(),
    text: '',
    criteriaId: ''
  },
  refId: '',
  OnStartEdit: () => {
    console.error('StickyNote: OnStartEdit prop was not defined!');
  },
  OnUpdateComment: () => {
    console.error('StickyNote: OnUpdateComment prop was not defined!');
  }
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(StickyNote);
