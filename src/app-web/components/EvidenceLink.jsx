/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

EvidenceLinks are used to display individual pieces of evidence created by
students to link an information resource item (e.g. simulation, report) to
a component, property, or mechanism.

They are controlled components.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
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
import StickyNoteButton from './StickyNoteButton';
import RatingButton from './RatingButton';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'EvidenceLink:';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @class
 */
class EvidenceLink extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      note: this.props.evlink.note,
      rating: this.props.evlink.rating,
      isBeingEdited: false,
      isExpanded: false,
      listenForSourceSelection: false
    };

    // Handle Focus
    // create a ref to store the textInput DOM element
    this.textInput = React.createRef();

    this.DoDataUpdate = this.DoDataUpdate.bind(this);
    this.DoRatingUpdate = this.DoRatingUpdate.bind(this);
    this.OnCancelButtonClick = this.OnCancelButtonClick.bind(this);
    this.OnDeleteButtonClick = this.OnDeleteButtonClick.bind(this);
    this.OnDuplicateButtonClick = this.OnDuplicateButtonClick.bind(this);
    this.OnEditButtonClick = this.OnEditButtonClick.bind(this);
    this.OnSaveButtonClick = this.OnSaveButtonClick.bind(this);
    this.DoEvidenceLinkOpen = this.DoEvidenceLinkOpen.bind(this);
    this.OnScreenShotClick = this.OnScreenShotClick.bind(this)
    this.OnNoteChange = this.OnNoteChange.bind(this);
    this.OnSourceSelectClick = this.OnSourceSelectClick.bind(this);
    this.DoEnableSourceSelect = this.DoEnableSourceSelect.bind(this);
    this.DoSelectionChange = this.DoSelectionChange.bind(this);
    this.DoToggleExpanded = this.DoToggleExpanded.bind(this);
    this.OnRatingButtonClick = this.OnRatingButtonClick.bind(this);

    UR.Subscribe('DATA_UPDATED', this.DoDataUpdate);
    UR.Subscribe('SHOW_EVIDENCE_LINK_SECONDARY', this.DoEvidenceLinkOpen);
    UR.Subscribe('EVLINK:ENABLE_SOURCE_SELECT', this.DoEnableSourceSelect);
    UR.Subscribe('SELECTION_CHANGED', this.DoSelectionChange);
  }

  componentDidMount() { }

  componentWillUnmount() {
    UR.Unsubscribe('DATA_UPDATED', this.DoDataUpdate);
    UR.Unsubscribe('SHOW_EVIDENCE_LINK_SECONDARY', this.DoEvidenceLinkOpen);
    UR.Unsubscribe('EVLINK:ENABLE_SOURCE_SELECT', this.DoEnableSourceSelect);
    UR.Unsubscribe('SELECTION_CHANGED', this.DoSelectionChange);
  }

  DoDataUpdate() {
    // The same EvidenceLink can be displayed in both the Resource Library
    // and a Resource View.  If one is updated, the other needs to update itself
    // via the DATA_UPDATED call because `note` is only set by props
    // during construction.

    let evlink = DATA.EvidenceLinkByEvidenceId(this.props.evlink.evId);
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
  DoRatingUpdate(rating) {
    DATA.SetEvidenceLinkRating(this.props.evlink.evId, rating);
  }

  OnScreenShotClick(e) {
    e.stopPropagation();
    alert('Screenshot opening is not implemented yet!');
  }

  OnCancelButtonClick(e) {
    e.stopPropagation();
    this.setState({
      isBeingEdited: false
    });
  }

  OnDeleteButtonClick() {
    DATA.PMC_DeleteEvidenceLink(this.props.evlink.evId);
  }

  OnDuplicateButtonClick() {
    const newEvId = DATA.PMC_DuplicateEvidenceLink(this.props.evlink.evId);
    const newEvLink = DATA.EvidenceLinkByEvidenceId(newEvId);
    UR.Publish('SHOW_EVIDENCE_LINK', { evId: newEvLink.evId, rsrcId: newEvLink.rsrcId });
  }

  OnEditButtonClick(e) {
    e.stopPropagation();
    this.setState({ isBeingEdited: true }, () => {
      this.FocusTextInput();
    });
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

  OnSaveButtonClick(e) {
    e.stopPropagation();
    // FIXME May 1 Hack
    // How do we handle draftValue vs committedValue?
    this.setState({
      isBeingEdited: false
    });
  }

  DoEvidenceLinkOpen(data) {
    if (this.props.evlink.evId === data.evId) {
      if (DBG) console.log(PKG, 'Expanding', data.evId);

      // If we're being opened for the first time, notes is empty
      // and no links have been set, so automatically go into edit mode
      let activateEditState = false;
      if (
        this.props.evlink.note === '' ||
        (this.props.evlink.propId === undefined && this.props.evlink.mechId === undefined)
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

  OnNoteChange(e) {
    if (DBG) console.log(PKG, 'Note Change:', e.target.value);
    this.setState({ note: e.target.value });
    DATA.SetEvidenceLinkNote(this.props.evlink.evId, e.target.value);
  }

  /* User has clicked on the 'link' button, so we want to
     send the request to ViewMain, which will handle
     the sequence of closing the resource view (so that the
     user can see the components for selection) and opening up
     the evLink
  */
  OnSourceSelectClick(evId, rsrcId) {
    // Deselect the prop first, otherwise the deleted prop will remain selected
    DATA.VM_DeselectAll();
    UR.Publish('SELECTION_CHANGED');
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

  DoEnableSourceSelect(data) {
    if (data.evId === this.props.evlink.evId) {
      this.setState({ listenForSourceSelection: true });
    }
  }

  // User has clicked on a different component/property/mechanism
  DoSelectionChange() {
    if (this.state.listenForSourceSelection) {
      let sourceId;
      // Assume mechs are harder to select so check for them first.
      // REVIEW: Does this work well?
      let selectedMechIds = DATA.VM_SelectedMechIds();
      if (DBG) console.log(PKG, 'selection changed mechsIds:', selectedMechIds);
      if (selectedMechIds.length > 0) {
        // Get the last selection
        sourceId = selectedMechIds[selectedMechIds.length - 1];
        DATA.SetEvidenceLinkMechId(this.props.evlink.evId, sourceId);
        // Clear the PropId in case it was set previously
        DATA.SetEvidenceLinkPropId(this.props.evlink.evId, undefined);
        // leave it in a waiting state?  This allows you to change your mind?
        // REVIEW may want another way to exit / confirm the selection?
        // For May 1, exit as soon as something is selected to prevent
        // subsequent source selections from being applied to ALL open
        // evlinks.
        this.setState({ listenForSourceSelection: false });
        return;
      }

      let selectedPropIds = DATA.VM_SelectedPropsIds();
      if (DBG) console.log(PKG, 'selection changed propIds:', selectedPropIds);
      if (selectedPropIds.length > 0) {
        // Get the last selection
        sourceId = selectedPropIds[selectedPropIds.length - 1];
        DATA.SetEvidenceLinkPropId(this.props.evlink.evId, sourceId);
        // Clear the PropId in case it was set previously
        DATA.SetEvidenceLinkMechId(this.props.evlink.evId, undefined);
        // leave it in a waiting state?  This allows you to change your mind?
        // REVIEW may want another way to exit / confirm the selection?
        // For May 1, exit as soon as something is selected to prevent
        // subsequent source selections from being applied to ALL open
        // evlinks.
        this.setState({ listenForSourceSelection: false });
      }
    }
  }

  DoToggleExpanded() {
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

  OnRatingButtonClick() {
    const data = { evId: this.props.evlink.evId, rating: this.props.evlink.rating };
    UR.Publish('RATING:OPEN', data);
  }

  render() {
    // evidenceLinks is an array of arrays because there might be more than one?!?
    const { classes, evlink } = this.props;
    const { evId, rsrcId, propId, mechId } = evlink;
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
        onClick={this.DoToggleExpanded}
        key={`${rsrcId}`}
      >
        {/* Title Bar */}
        <Button
          className={classes.evidenceExpandButton}
          onClick={this.DoToggleExpanded}
          hidden={!isExpanded}
        >
          <ExpandMoreIcon className={isExpanded ? classes.iconExpanded : ''} />
        </Button>
        <Typography className={classes.evidenceWindowLabel} hidden={!isExpanded}>
          EVIDENCE LINK
        </Typography>
        <Typography className={classes.evidencePrompt} hidden={!isExpanded}>
          How does this resource support this component / property / mechanism?
        </Typography>
        {/* Body */}
        <Grid container className={classes.evidenceBody} spacing={0}>

          {/* Number / Comment */}
          <Grid item xs={isExpanded ? 12 : 2}>
            <div style={{ position: 'absolute', right: '0px' }}>
              <StickyNoteButton parentId={evId} parentType="evidence" />
            </div>
            <Avatar className={classes.evidenceBodyNumber}>{evlink.number}</Avatar>
          </Grid>

          {/* Source */}
          <Grid item xs={isExpanded ? 12 : 10}>
            <Grid
              container
              spacing={1}
              className={isExpanded ? classes.evidenceBodyRow : classes.evidenceBodyRowCollapsed}
            >
              <Grid item xs={4} hidden={!isExpanded}>
                <Typography className={classes.evidenceWindowLabel} variant="caption" align="right">
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
                    onChange={this.OnNoteChange}
                    onClick={e => {
                      e.stopPropagation();
                    }}
                    InputProps={{
                      readOnly: !isBeingEdited
                    }}
                    inputRef={this.textInput}
                  />
                ) : (
                    <div className={classes.evidenceLabelField}>{note}</div>
                  )}
              </Grid>
            </Grid>

            {/* Source */}
            <Grid item xs={12}>
              <Grid
                container
                spacing={1}
                className={isExpanded ? classes.evidenceBodyRow : classes.evidenceBodyRowCollapsed}
              >
                <Grid item xs={4} hidden={!isExpanded}>
                  <Typography
                    className={classes.evidenceWindowLabel}
                    variant="caption"
                    align="right"
                  >
                    SOURCE:
                  </Typography>
                </Grid>
                <Grid item xs>
                  <div className={classes.evidenceLinkAvatar}>
                    <Button
                      onClick={() => {
                        this.OnSourceSelectClick(evId, rsrcId);
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
          </Grid>

          <Grid item xs={isExpanded ? 12 : 3}>
            <Grid
              container
              spacing={1}
              className={isExpanded ? classes.evidenceBodyRow : classes.evidenceBodyRatingCollapsed}
            >
              <Grid item xs={4} hidden={!isExpanded}>
                <Typography className={classes.evidenceWindowLabel} variant="caption" align="right">
                  RATING:
                </Typography>
              </Grid>
              <Grid item xs>
                <RatingButton
                  rating={rating}
                  isExpanded={isExpanded}
                  ratingLabel=""
                  UpdateRating={this.DoRatingUpdate}
                  OnRatingButtonClick={this.OnRatingButtonClick}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid container spacing={8} hidden={!isExpanded} className={classes.evidenceBodyRowTop}>
            <Grid item xs={4}>
              <Typography className={classes.evidenceWindowLabel} variant="caption" align="right">
                SCREENSHOT:
              </Typography>
            </Grid>
            <Grid item xs>
              <Button className={classes.evidenceScreenshotButton} onClick={this.OnScreenShotClick}>
                <img
                  src="../static/screenshot_sim.png"
                  alt="screenshot"
                  className={classes.evidenceScreenshot}
                />
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Divider style={{ margin: '10px' }} hidden={!isExpanded} />
        <div style={{ display: 'flex', margin: '10px 10px 5px 0' }}>
          <Button
            hidden={!isExpanded || !isBeingEdited}
            size="small"
            onClick={this.OnCancelButtonClick}
          >
            cancel
          </Button>
          <Button
            hidden={!isExpanded || isBeingEdited}
            size="small"
            onClick={this.OnDeleteButtonClick}
          >
            delete
          </Button>
          <div style={{ flexGrow: '1' }} />
          <Button
            hidden={!isExpanded || isBeingEdited}
            size="small"
            onClick={this.OnDuplicateButtonClick}
          >
            duplicate
          </Button>
          <div style={{ flexGrow: '1' }} />
          <Button
            variant="contained"
            onClick={this.OnEditButtonClick}
            hidden={!isExpanded || isBeingEdited}
            size="small"
          >
            Edit
          </Button>
          <Button
            variant="contained"
            onClick={this.OnSaveButtonClick}
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

EvidenceLink.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  evlink: PropTypes.object
};

EvidenceLink.defaultProps = {
  classes: {},
  evlink: {
    evId: '',
    propId: '',
    mechId: '',
    rsrcId: '',
    number: '',
    note: '',
    rating: 0
  }
};
/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(EvidenceLink);
