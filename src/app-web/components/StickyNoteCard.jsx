/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Sticky Note Card

    For documentation, see boilerplate/src/app-web/components/StickyNote.jsx
    
props

    comment           Comment data passed from the parent StickyNote
    
    onStartEdit       prop func called by StickyNoteCard when user clicks "Edit"
    
    onUpdateComment   prop func called by STickyNoteCard when user is
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
    selectedCriteriaId
    
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
import FilledInput from '@material-ui/core/FilledInput';
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
import ADM from '../modules/adm-data';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class StickyNoteCard extends React.Component {
  constructor(props) {
    super(props);

    // Handle Focus
    // create a ref to store the textInput DOM element
    this.textInput = React.createRef();

    this.DoOpenSticky = this.DoOpenSticky.bind(this);
    this.OnEditClick = this.OnEditClick.bind(this);
    this.DoEditStart = this.DoEditStart.bind(this);
    this.FocusTextInput = this.FocusTextInput.bind(this);
    this.OnEditFinished = this.OnEditFinished.bind(this);
    this.OnDeleteClick = this.OnDeleteClick.bind(this);
    this.OnCriteriaSelect = this.OnCriteriaSelect.bind(this);
    this.OnCommentTextChange = this.OnCommentTextChange.bind(this);
    this.OnShowEditButtons = this.OnShowEditButtons.bind(this);
    this.OnHideEditButtons = this.OnHideEditButtons.bind(this);
    this.OnClickAway = this.OnClickAway.bind(this);

    this.state = {
      isBeingEdited: false,
      allowedToEdit: false,
      allowedToDelete: false,
      showEditButtons: false,
      criteria: [],
      selectedCriteriaId: '',
      comment: this.props.comment
    };
  }

  componentDidMount() {
    this.DoOpenSticky();
  }

  componentWillUnmount() {
    // Save data just in case?
    this.OnEditFinished();
  }

  DoOpenSticky() {
    const criteria = ADM.GetCriteriaByClassroom();
    const currentGroup = ADM.GetGroupByStudent();
    const authorGroup = ADM.GetGroupByStudent(this.props.comment.author);
    const isAuthor = currentGroup === authorGroup;
    this.setState({
      criteria,
      selectedCriteriaId: this.props.comment.criteriaId,
      allowedToEdit: isAuthor,
      allowedToDelete: isAuthor // REVIEW: Only teachers are allowed to delete?
    });
    if (this.props.comment.text === '') {
      // automatically turn on editing if this is a new empty comment
      this.DoEditStart();
    }
  }

  DoEditStart() {
    this.setState({ isBeingEdited: true }, () => {
      this.FocusTextInput();
      this.props.onStartEdit();
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
    // Automatically mark read by author
    const author = ADM.GetSelectedStudentId();
    let comment = this.props.comment;
    if (!comment.readBy.includes(author)) {
      comment.readBy.push(author);
    }
    this.props.onUpdateComment();
    // stop editing and close
    this.setState({
      isBeingEdited: false
    });
  }

  OnDeleteClick() {
    
  }

  OnCriteriaSelect(e) {
    let criteriaId = e.target.value;
    this.setState(state => {
      let comment = state.comment;
      comment.criteriaId = criteriaId;
      return {
        selectedCriteriaId: criteriaId,
        comment
      };
    });
  }

  OnCommentTextChange(e) {
    const text = e.target.value;
    this.setState(state => {
      let comment = state.comment;
      comment.text = text;
      return { comment };
    });
  }

  OnShowEditButtons() {
    this.setState({
      showEditButtons: true
    });
  }

  OnHideEditButtons() {
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
      MuiFilledInput: {
        root: {
          backgroundColor: 'rgba(250,255,178,0.3)',
          paddingTop: '3px',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.5)'
          },
          '&$focused': {
            backgroundColor: '#fff'
          }
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
      selectedCriteriaId,
      comment
    } = this.state;
    const { classes } = this.props;
    const hasBeenRead = this.props.comment.readBy
      ? this.props.comment.readBy.includes(ADM.GetSelectedStudentId())
      : false;
    const date = new Date(comment.date);
    const timestring = date.toLocaleTimeString('en-Us', {
      hour: '2-digit', minute: '2-digit'
    });
    const datestring = date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });

    let showCriteria = isBeingEdited || selectedCriteriaId !== '';
    let criteriaDisplay = ADM.GetCriteriaLabel(selectedCriteriaId);
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
    }

    return (
      <ClickAwayListener onClickAway={this.OnClickAway}>
        <Paper
          className={hasBeenRead ? classes.stickynoteCardRead : classes.stickynoteCard}
          onMouseEnter={this.OnShowEditButtons}
          onMouseLeave={this.OnHideEditButtons}
        >
          <Grid container>
            <Grid item xs={3}>
              <Typography variant="subtitle2" className={classes.stickynoteCardAuthor}>
                {`${comment.author} ${ADM.GetGroupNameByStudent(comment.author)}`}
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
                <div className={classes.stickynoteCardCriteria}>{criteriaDisplay}</div>
              </div>
              <MuiThemeProvider theme={theme}>
                <FilledInput
                  className={classes.stickynoteCardInput}
                  value={comment.text}
                  placeholder={comment.placeholder}
                  onChange={this.OnCommentTextChange}
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
                <DeleteIcon fontSize="small" className={classes.stickynoteCardAuthor}/>
              </IconButton>
            </Grid>
            <Grid item xs={1}>
              <IconButton
                size="small"
                hidden={!showEditButtons || (!allowedToEdit || isBeingEdited)}
                onClick={this.OnEditClick}
                className={classes.stickynoteCardEditBtn}
              >
                <EditIcon fontSize="small" className={classes.stickynoteCardAuthor}/>
              </IconButton>
            </Grid>
          </Grid>
        </Paper>
      </ClickAwayListener>
    );
  }
}

StickyNoteCard.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  comment: PropTypes.object,
  onStartEdit: PropTypes.func,
  onUpdateComment: PropTypes.func
};

StickyNoteCard.defaultProps = {
  classes: {},
  comment: {
    id: -1,
    author: '',
    date: new Date(),
    text: '',
    criteriaId: ''
  },
  onStartEdit: () => {
    console.error('StickyNoteCard: onStartEdit prop was not defined!');
  },
  onUpdateComment: () => {
    console.error('StickyNoteCard: onUpdateComment prop was not defined!');
  }
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(StickyNoteCard);
