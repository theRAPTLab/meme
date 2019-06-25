/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

EvidenceLinks are used to display individual pieces of evidence created by
students to link an information resource item (e.g. simulation, report) to
a component, property, or mechanism.

They are controlled components.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import ClassNames from 'classnames';
// Material UI Elements
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
// Material UI Icons
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import DATA from '../modules/pmc-data';
import UR from '../../system/ursys';
import RatingButton from './RatingButton';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'EvidenceLink:';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class EvidenceLink extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      note: this.props.note,
      rating: this.props.rating,
      canBeEdited: false,
      isBeingEdited: false,
      isExpanded: false,
      listenForSourceSelection: false,
    };
    this.HandleDataUpdate = this.HandleDataUpdate.bind(this);
    this.HandleRatingUpdate = this.HandleRatingUpdate.bind(this);
    this.HandleCancelButtonClick = this.HandleCancelButtonClick.bind(this);
    this.HandleDeleteButtonClick = this.HandleDeleteButtonClick.bind(this);
    this.handleEditButtonClick = this.handleEditButtonClick.bind(this);
    this.handleSaveButtonClick = this.handleSaveButtonClick.bind(this);
    this.handleEvidenceLinkOpen = this.handleEvidenceLinkOpen.bind(this);
    this.handleNoteChange = this.handleNoteChange.bind(this);
    this.HandleSourceSelectClick = this.HandleSourceSelectClick.bind(this);
    this.EnableSourceSelect = this.EnableSourceSelect.bind(this);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.toggleExpanded = this.toggleExpanded.bind(this);
    UR.Sub('DATA_UPDATED', this.HandleDataUpdate);
    UR.Sub('SHOW_EVIDENCE_LINK_SECONDARY', this.handleEvidenceLinkOpen);
    UR.Sub('EVLINK:ENABLE_SOURCE_SELECT', this.EnableSourceSelect);
    UR.Sub('SELECTION_CHANGED', this.handleSelectionChange);
  }

  componentDidMount() { }

  componentWillUnmount() {
    UR.Unsub('DATA_UPDATED', this.HandleDataUpdate);
    UR.Unsub('SHOW_EVIDENCE_LINK_SECONDARY', this.handleEvidenceLinkOpen);
    UR.Unsub('EVLINK:ENABLE_SOURCE_SELECT', this.EnableSourceSelect);
    UR.Unsub('SELECTION_CHANGED', this.handleSelectionChange);
  }

  HandleDataUpdate() {
    // The same EvidenceLink can be displayed in both the Resource Library
    // and a Resource View.  If one is updated, the other needs to update itself
    // via the DATA_UPDATED call because `note` is only set by props
    // during construction.

    let evlink = DATA.EvidenceLinkByEvidenceId(this.props.evId);
    if (evlink) {
      this.setState({
        note: evlink.note,
        rating: evlink.rating
      });
    }
    // Don't throw an error here
    // If the EvidenceLink has been deleted, the deletion event triggers
    // DATA_UPDATED, so this EvidenceLink may receive the event before
    // it's been unmounted.  Just ignore missing EvidenceLink.
    // throw Error(`no evidence link with evId '${this.props.evId}' exists`);
  }

  /**
   * Called by the Rating widget when the user clicks on a star.
   * Sets the rating on the evidence link data.
   *
   * @param {integer} rating - number of stars selected
   */
  HandleRatingUpdate(rating) {
    DATA.SetEvidenceLinkRating(this.props.evId, rating);
  }

  HandleCancelButtonClick() {
    this.setState({
      isBeingEdited: false
    });
  }

  HandleDeleteButtonClick() {
    DATA.PMC_DeleteEvidenceLink(this.props.evId);
  }

  handleEditButtonClick() {
    this.setState({
      isBeingEdited: true
    });
  }

  handleSaveButtonClick() {
    // FIXME May 1 Hack
    // How do we handle draftValue vs committedValue?
    this.setState({
      isBeingEdited: false
    });
  }

  handleEvidenceLinkOpen(data) {
    if (this.props.evId === data.evId) {
      if (DBG) console.log(PKG, 'Expanding', data.evId);

      // If we're being opened for the first time, notes is empty
      // and no links have been set, so automatically go into edit mode
      let activateEditState = false;
      if (
        this.props.note === '' ||
        (this.props.propId === undefined && this.props.mechId === undefined)
      ) {
        activateEditState = true;
      }

      this.setState({
        isExpanded: true,
        isBeingEdited: activateEditState
      });
    } else {
      // Always contract if someone else is expanding
      // This is only called when an evidence link is opened
      // programmaticaly either when creating a new evidence link
      // or expanding one via a badge.
      // A user can still directly expand two simultaneously.
      this.setState({ isExpanded: false });
    }
  }

  handleNoteChange(e) {
    if (DBG) console.log(PKG, 'Note Change:', e.target.value);
    this.setState({ note: e.target.value });
    DATA.SetEvidenceLinkNote(this.props.evId, e.target.value);
  }

  /* User has clicked on the 'link' button, so we want to
     send the request to ViewMain, which will handle
     the sequence of closing the resource view (so that the
     user can see the components for selection) and opening up
     the evLink
  */
  HandleSourceSelectClick(evId, rsrcId) {
    // Deselect the prop first, otherwise the deleted prop will remain selected
    DATA.VM_DeselectAll();
    // Remove any existing evidence links
    DATA.VM_MarkBadgeForDeletion(evId);
    DATA.SetEvidenceLinkPropId(evId, undefined);
    DATA.SetEvidenceLinkMechId(evId, undefined);
    DATA.BuildModel();
    // Then trigger editing
    if (this.state.isBeingEdited) {
      UR.Publish('REQUEST_SELECT_EVLINK_SOURCE', { evId, rsrcId });
    }
  }

  EnableSourceSelect(data) {
    if (data.evId === this.props.evId) {
      this.setState({ listenForSourceSelection: true });
    }
  }

  handleSelectionChange() {
    if (this.state.listenForSourceSelection) {
      let sourceId;
      // Assume mechs are harder to select so check for them first.
      // REVIEW: Does this work well?
      let selectedMechIds = DATA.VM_SelectedMechs();
      if (DBG) console.log(PKG, 'selection changed mechsIds:', selectedMechIds);
      if (selectedMechIds.length > 0) {
        // Get the last selection
        sourceId = selectedMechIds[selectedMechIds.length - 1];
        DATA.SetEvidenceLinkMechId(this.props.evId, sourceId);
        // Clear the PropId in case it was set previously
        DATA.SetEvidenceLinkPropId(this.props.evId, undefined);
        // leave it in a waiting state?  This allows you to change your mind?
        // REVIEW may want another way to exit / confirm the selection?
        // For May 1, exit as soon as something is selected to prevent
        // subsequent source selections from being applied to ALL open
        // evlinks.
        this.setState({ listenForSourceSelection: false });
        return;
      }

      let selectedPropIds = DATA.VM_SelectedProps();
      if (DBG) console.log(PKG, 'selection changed propIds:', selectedPropIds);
      if (selectedPropIds.length > 0) {
        // Get the last selection
        sourceId = selectedPropIds[selectedPropIds.length - 1];
        DATA.SetEvidenceLinkPropId(this.props.evId, sourceId);
        // Clear the PropId in case it was set previously
        DATA.SetEvidenceLinkMechId(this.props.evId, undefined);
        // leave it in a waiting state?  This allows you to change your mind?
        // REVIEW may want another way to exit / confirm the selection?
        // For May 1, exit as soon as something is selected to prevent
        // subsequent source selections from being applied to ALL open
        // evlinks.
        this.setState({ listenForSourceSelection: false });
      }
    }
  }

  toggleExpanded() {
    if (DBG) console.log(PKG, 'evidence link clicked');
    if (this.state.isExpanded) {
      this.setState({
        isExpanded: false,
        isBeingEdited: false
      });
    } else {
      this.setState({
        isExpanded: true
      });
    }
  }

  render() {
    // evidenceLinks is an array of arrays because there might be more than one?!?
    const { evId, rsrcId, propId, mechId, classes } = this.props;
    const { note, rating, isBeingEdited, isExpanded, listenForSourceSelection } = this.state;
    if (evId === '') return '';
    let sourceLabel;
    let evidenceLinkSelectButtonClass;
    if (listenForSourceSelection) {
      sourceLabel = 'Select';
      evidenceLinkSelectButtonClass = classes.evidenceLinkSourceAvatarWaiting;
    } else if (propId !== undefined) {
      sourceLabel = DATA.Prop(propId).name;
      evidenceLinkSelectButtonClass = classes.evidenceLinkSourcePropAvatarSelected;
    } else if (mechId !== undefined) {
      sourceLabel = DATA.Mech(mechId).name || 'no label mechanism';
      evidenceLinkSelectButtonClass = classes.evidenceLinkSourceMechAvatarSelected;
    } else {
      sourceLabel = 'Link';
      evidenceLinkSelectButtonClass = classes.evidenceLinkSelectButton;
    }
    return (
      <Paper
        className={ClassNames(
          classes.evidenceLinkPaper,
          isExpanded ? classes.evidenceLinkPaperExpanded : ''
        )}
        key={`${rsrcId}`}
      >
        <Button className={classes.evidenceExpandButton} onClick={this.toggleExpanded}>
          <ExpandMoreIcon className={isExpanded ? classes.iconExpanded : ''} />
        </Button>
        {/* Title Bar */}
        <Typography className={classes.evidenceWindowLabel}>EVIDENCE LINK</Typography>
        <Typography className={classes.evidencePrompt} hidden={!isExpanded}>
          How does this resource support this component / property / mechanism?
        </Typography>
        {/* Body */}
        <Grid container className={classes.evidenceBody} spacing={8}>
          {/* Source */}
          <Grid item xs={isExpanded ? 12 : 3}>
            <Grid
              container
              spacing={8}
              className={isExpanded ? classes.evidenceBodyRow : classes.evidenceBodyRowCollapsed}
            >
              <Grid item xs={4} hidden={!isExpanded}>
                <Typography variant="caption" align="right">
                  SOURCE:
                </Typography>
              </Grid>
              <Grid item xs>
                <div className={classes.evidenceLinkAvatar}>
                  <Button
                    onClick={() => {
                      this.HandleSourceSelectClick(evId, rsrcId);
                    }}
                    className={evidenceLinkSelectButtonClass}
                    disabled={!isBeingEdited}
                    size="small"
                  >
                    {sourceLabel}
                  </Button>
                </div>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={isExpanded ? 12 : 9}>
            <Grid
              container
              spacing={8}
              className={isExpanded ? classes.evidenceBodyRow : classes.evidenceBodyRowCollapsed}
            >
              <Grid item xs={4} hidden={!isExpanded}>
                <Typography variant="caption" align="right">
                  DESCRIPTION:
                </Typography>
              </Grid>
              <Grid item xs>
                {isExpanded ? (
                  <TextField
                    className={ClassNames(
                      classes.evidenceLabelField,
                      classes.evidenceLabelFieldExpanded
                    )}
                    value={note}
                    placeholder="Click to add label..."
                    autoFocus
                    multiline
                    onChange={this.handleNoteChange}
                    InputProps={{
                      readOnly: !isBeingEdited
                    }}
                  />
                ) : (
                    <div className={classes.evidenceLabelField}>{note}</div>
                  )}
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={isExpanded ? 12 : 3}>
            <Grid
              container
              spacing={8}
              className={isExpanded ? classes.evidenceBodyRow : classes.evidenceBodyRatingCollapsed}
            >
              <Grid item xs={4} hidden={!isExpanded}>
                <Typography variant="caption" align="right">
                  RATING:
                </Typography>
              </Grid>
              <Grid item xs>
                <RatingButton
                  rating={rating}
                  isExpanded={isExpanded}
                  ratingLabel=''
                  UpdateRating={this.HandleRatingUpdate}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid container spacing={8} hidden={!isExpanded} className={classes.evidenceBodyRowTop}>
            <Grid item xs={4}>
              <Typography variant="caption" align="right">
                SCREENSHOT:
              </Typography>
            </Grid>
            <Grid item xs>
              <Button className={classes.evidenceScreenshotButton}>
                <img
                  src="../static/screenshot_sim.png"
                  alt="screenshot"
                  className={classes.evidenceScreenshot}
                />
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Divider />
        <div style={{ display: 'flex', margin: '10px 10px 5px 0' }}>
          <Button
            hidden={!isExpanded || isBeingEdited}
            size="small"
            onClick={this.HandleDeleteButtonClick}
          >
            delete
          </Button>
          <Button
            hidden={!isExpanded || !isBeingEdited}
            size="small"
            onClick={this.HandleCancelButtonClick}
          >
            cancel
          </Button>
          <div style={{ flexGrow: '1' }} />
          <Button
            variant="contained"
            onClick={this.handleEditButtonClick}
            hidden={!isExpanded || isBeingEdited}
            size="small"
          >
            Edit
          </Button>
          <Button
            variant="contained"
            onClick={this.handleSaveButtonClick}
            hidden={!isExpanded || !isBeingEdited}
            size="small"
          >
            Save
          </Button>
        </div>
      </Paper>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(EvidenceLink);
