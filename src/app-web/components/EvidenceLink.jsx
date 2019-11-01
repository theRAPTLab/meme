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
import Collapse from '@material-ui/core/Collapse';
import Divider from '@material-ui/core/Divider';
import FilledInput from '@material-ui/core/FilledInput';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
// Material UI Icons
import CreateIcon from '@material-ui/icons/Create';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
// Material UI Theming
import { withStyles, MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import ADM from '../modules/data';
import DATA from '../modules/data';
import ASET from '../modules/adm-settings';
import UR from '../../system/ursys';
import StickyNoteButton from './StickyNoteButton';
import RatingButton from './RatingButton';
import LinkButton from './LinkButton';
import { Dropzone } from './Dropzone';
import PMCData from '../modules/pmc-data';

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
      ratingDefs: [],
      isBeingEdited: false,
      isExpanded: false,
      isHovered: false,
      listenForSourceSelection: false
    };

    // Handle Focus
    // create a ref to store the textInput DOM element
    this.textInput = React.createRef();

    this.DoDataUpdate = this.DoDataUpdate.bind(this);
    this.DoRatingUpdate = this.DoRatingUpdate.bind(this);
    this.DoEditStart = this.DoEditStart.bind(this);
    this.OnCancelButtonClick = this.OnCancelButtonClick.bind(this);
    this.OnDeleteButtonClick = this.OnDeleteButtonClick.bind(this);
    this.OnDuplicateButtonClick = this.OnDuplicateButtonClick.bind(this);
    this.OnEditButtonClick = this.OnEditButtonClick.bind(this);
    this.OnSaveButtonClick = this.OnSaveButtonClick.bind(this);
    this.DoEvidenceLinkOpen = this.DoEvidenceLinkOpen.bind(this);
    this.OnScreenShotClick = this.OnScreenShotClick.bind(this)
    this.OnNoteChange = this.OnNoteChange.bind(this);
    this.OnLinkButtonClick = this.OnLinkButtonClick.bind(this);
    this.DoEnableSourceSelect = this.DoEnableSourceSelect.bind(this);
    this.DoSelectionChange = this.DoSelectionChange.bind(this);
    this.DoToggleExpanded = this.DoToggleExpanded.bind(this);
    this.OnRatingButtonClick = this.OnRatingButtonClick.bind(this);
    this.OnDrop = this.OnDrop.bind(this);

    UR.Subscribe('DATA_UPDATED', this.DoDataUpdate);
    UR.Subscribe('SHOW_EVIDENCE_LINK_SECONDARY', this.DoEvidenceLinkOpen);
    UR.Subscribe('EVLINK:ENABLE_SOURCE_SELECT', this.DoEnableSourceSelect);
    UR.Subscribe('SELECTION_CHANGED', this.DoSelectionChange);
  }

  componentDidMount() {
    this.DoDataUpdate(); // Force load ratingDefs
  }

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

    let evlink = DATA.PMC_GetEvLinkByEvId(this.props.evlink.id);
    if (evlink) {
      // Get current model's rating definitions
      const model = ADM.GetModelById();
      const classroomId = ADM.GetClassroomIdByGroup(model.groupId);
      const ratingDefs = ADM.GetRatingsDefinition(classroomId);
      let { note, rating } = evlink;

      // if we're currently editing, don't let data update reset the note
      if (this.state.isBeingEdited) {
        note = this.state.note;
      }
      this.setState({
        note,
        rating,
        ratingDefs
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
    DATA.SetEvidenceLinkRating(this.props.evlink.id, rating);
  }
  
  DoEditStart() {
    const pmcDataId = ASET.selectedPMCDataId;
    const intEvId = Number(this.props.evlink.id);
    UR.DBTryLock('pmcData.entities', [pmcDataId, intEvId])
      .then(rdata => {
        const { success, semaphore, uaddr, lockedBy } = rdata;
        status += success ? `${semaphore} lock acquired by ${uaddr} ` : `failed to acquired ${semaphore} lock `;
        if (rdata.success) {
          console.log('do something here because u-locked!');
          this.setState(
            {
              isBeingEdited: true,
              isExpanded: true
            },
            () => this.FocusTextInput()
          );
        } else {
          console.log('aw, locked by', rdata.lockedBy);
          alert(`Sorry, someone else (${rdata.lockedBy}) is editing this Evidence Link right now.  Please try again later.`)
        }
      });
  }
  
  DoEditStop() {
    this.setState({
      isBeingEdited: false
    });
    const pmcDataId = ASET.selectedPMCDataId;
    const intEvId = Number(this.props.evlink.id);
    UR.DBTryRelease('pmcData.entities', [pmcDataId, intEvId])    
  }

  OnScreenShotClick(e) {
    e.stopPropagation();
    // show screenshot large
    // give option of reseting imageURL
    UR.Publish('SCREENSHOT_OPEN', {
      evId: this.props.evlink.id,
      imageURL: this.props.evlink.imageURL
    });
  }

  OnCancelButtonClick(e) {
    e.stopPropagation();
    this.DoEditStop();
    // restore previous note
    this.setState({
      note: this.props.evlink.note
    });
  }

  OnDeleteButtonClick() {
    const pmcDataId = ASET.selectedPMCDataId;
    const intEvId = Number(this.props.evlink.id);
    UR.DBTryLock('pmcData.entities', [pmcDataId, intEvId])
      .then(rdata => {
        const { success, semaphore, uaddr, lockedBy } = rdata;
        status += success ? `${semaphore} lock acquired by ${uaddr} ` : `failed to acquired ${semaphore} lock `;
        if (rdata.success) {
          console.log('do something here because u-locked!');
          DATA.PMC_DeleteEvidenceLink(this.props.evlink.id);
        } else {
          console.log('aw, locked by', rdata.lockedBy);
          alert(`Sorry, someone else (${rdata.lockedBy}) is editing this Evidence Link right now.  Please try again later.`)
        }
      });

  }

  OnDuplicateButtonClick() {
    DATA.PMC_DuplicateEvidenceLink(this.props.evlink.id,
      id => {
        const newEvLink = DATA.PMC_GetEvLinkByEvId(id);
        UR.Publish('SHOW_EVIDENCE_LINK', { evId: newEvLink.id, rsrcId: newEvLink.rsrcId });
      }
    );
  }

  OnEditButtonClick(e) {
    e.stopPropagation();
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

  OnSaveButtonClick(e) {
    e.stopPropagation();
    DATA.SetEvidenceLinkNote(this.props.evlink.id, this.state.note);
    // FIXME May 1 Hack
    // How do we handle draftValue vs committedValue?
    this.DoEditStop();
  }

  DoEvidenceLinkOpen(data) {
    if (this.props.evlink.id === data.evId) {
      if (DBG) console.log(PKG, 'Expanding', data.evId);

      // If we're being opened for the first time, notes is empty
      // and no links have been set, so automatically go into edit mode
      if (
        this.props.evlink.note === '' ||
        (this.props.evlink.propId === undefined && this.props.evlink.mechId === undefined)
      ) {
        this.DoEditStart();
      } else {
        // just expand
        this.setState({
          isExpanded: true
        });
      }
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
  }

  /* User has clicked on the 'link' button, so we want to
     send the request to ViewMain, which will handle
     the sequence of closing the resource view (so that the
     user can see the components for selection) and opening up
     the evLink
  */
  OnLinkButtonClick(e) {
    let evlink = this.props.evlink;
    // Deselect the prop first, otherwise the deleted prop will remain selected
    DATA.VM_DeselectAll();
    UR.Publish('SELECTION_CHANGED');
    // Remove any existing evidence links
    DATA.PMC_EvidenceUpdate(evlink.id, { propId: null, mechId: null });
    // Then trigger editing
    if (this.state.isBeingEdited) {
      UR.Publish('REQUEST_SELECT_EVLINK_SOURCE', { evId: evlink.id, rsrcId: evlink.rsrcId });
    }
  }

  DoEnableSourceSelect(data) {
    if (data.evId === this.props.evlink.id) {
      this.setState({ listenForSourceSelection: true });
    }
  }

  // User has selected a different component/property/mechanism as the source
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
        DATA.SetEvidenceLinkMechId(this.props.evlink.id, sourceId);
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
        DATA.SetEvidenceLinkPropId(this.props.evlink.id, sourceId);
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
    if (this.state.isBeingEdited) return; // Don't toggle if being edited
    if (DBG) console.log(PKG, 'evidence link clicked');
    if (this.state.isExpanded) {
      this.setState(
        { isExpanded: false },
        () => this.DoEditStop()
      );
    } else {
      this.setState({
        isExpanded: true
      });
    }
  }

  OnRatingButtonClick() {
    if (ADM.IsViewOnly()) return;
    const data = { evId: this.props.evlink.id, rating: this.props.evlink.rating };
    UR.Publish('RATING:OPEN', data);
  }
  
  OnDrop(href) {
    DATA.PMC_EvidenceUpdate(this.props.evlink.id, { imageURL: href });
  }

  render() {
    // theme overrides
    // See https://github.com/mui-org/material-ui/issues/14905 for details
    const theme = createMuiTheme();
    theme.overrides = {
      MuiFilledInput: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.25)',
          paddingTop: '3px',
          '&$disabled': {
            backgroundColor: 'rgba(255,255,255,0.35)'
          },
          '&$focused': {
            backgroundColor: '#fff'
          }
        },
        multiline: {
          padding: '5px'
        }
      }
    };

    // evidenceLinks is an array of arrays because there might be more than one?!?
    const { classes, evlink } = this.props;
    const { id, rsrcId, propId, mechId, imageURL } = evlink;
    const {
      note,
      rating,
      ratingDefs,
      isBeingEdited,
      isExpanded,
      isHovered,
      listenForSourceSelection
    } = this.state;
    if (id === '') return '';

    let sourceType;
    let sourceLabel;
    if (propId !== undefined && propId !== null && DATA.HasProp(propId) && DATA.Prop(propId)) {
      sourceType = 'prop';
      sourceLabel = DATA.Prop(propId).name;
    } else if (mechId !== undefined && mechId !== null && DATA.Mech(mechId)) {
      sourceType = 'mech';
      sourceLabel = DATA.Mech(mechId).name;
    } else {
      sourceType = undefined;
      sourceLabel = undefined;
    }
    
    const isViewOnly = ADM.IsViewOnly();

    return (
      <Collapse in={isExpanded} collapsedHeight="70px">
        <Paper
          className={ClassNames(
            classes.evidenceLinkPaper,
            isExpanded ? classes.evidenceLinkPaperExpanded : '',
            isBeingEdited ? classes.evidenceLinkPaperEditting : '',
            isHovered ? classes.evidenceLinkPaperHover : ''
          )}
          onClick={this.DoToggleExpanded}
          key={`${rsrcId}`}
          elevation={isExpanded ? 5 : 1}
          onMouseEnter={() => this.setState({ isHovered: true })}
          onMouseLeave={() => this.setState({ isHovered: false })}
        >
          {/* Title Bar */}
          <Button
            className={classes.evidenceExpandButton}
            onClick={this.DoToggleExpanded}
            hidden={!isExpanded || isBeingEdited}
          >
            <ExpandMoreIcon className={isExpanded ? classes.lessIconCollapsed : ''} />
          </Button>
          <Typography className={classes.evidenceWindowLabel} hidden={!isExpanded}>
            EVIDENCE LINK
          </Typography>
          {/* Body */}
          <Grid container className={classes.evidenceBody} spacing={0}>

            {/* Number / Comment */}
            <Grid item xs={isExpanded ? 12 : 2}>
              <div style={{ position: 'absolute', right: '0px' }}>
                <StickyNoteButton refId={id} />
              </div>
              <Avatar className={classes.evidenceBodyNumber}>{evlink.numberLabel}</Avatar>
            </Grid>
            <Typography className={classes.evidencePrompt} hidden={!isExpanded}>
              How does this resource support this component / property / mechanism?
            </Typography>

            {/* Source */}
            <Grid item xs={isExpanded ? 12 : 10}>
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
                    DESCRIPTION:
                  </Typography>
                </Grid>

                <Grid item xs>
                  {isExpanded ? (
                    <MuiThemeProvider theme={theme}>
                      <FilledInput
                        className={ClassNames(
                          classes.evidenceLabelField,
                          classes.evidenceLabelFieldExpanded
                        )}
                        value={note}
                        placeholder="Untitled..."
                        autoFocus
                        multiline
                        variant="filled"
                        disabled={!isBeingEdited}
                        disableUnderline
                        onChange={this.OnNoteChange}
                        onClick={e => {
                          e.stopPropagation();
                        }}
                        inputProps={{
                          readOnly: !isBeingEdited
                        }}
                        inputRef={this.textInput}
                      />
                    </MuiThemeProvider>
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
                  className={
                    isExpanded ? classes.evidenceBodyRow : classes.evidenceBodyRowCollapsed
                  }
                >
                  <Grid item xs={4} hidden={!isExpanded}>
                    <Typography
                      className={classes.evidenceWindowLabel}
                      variant="caption"
                      align="right"
                    >
                      TARGET:
                    </Typography>
                  </Grid>
                  <Grid item xs>
                    <div className={classes.evidenceLinkAvatar}>
                      <LinkButton
                        sourceType={sourceType}
                        sourceLabel={sourceLabel}
                        listenForSourceSelection={listenForSourceSelection}
                        isBeingEdited={isBeingEdited}
                        isExpanded={isExpanded}
                        OnLinkButtonClick={this.OnLinkButtonClick}
                      />
                    </div>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={isExpanded ? 12 : 3}>
              <Grid
                container
                spacing={1}
                className={
                  isExpanded ? classes.evidenceBodyRow : classes.evidenceBodyRatingCollapsed
                }
              >
                <Grid item xs={4} hidden={!isExpanded}>
                  <Typography
                    className={classes.evidenceWindowLabel}
                    variant="caption"
                    align="right"
                  >
                    RATING:
                  </Typography>
                </Grid>
                <Grid item xs>
                  <RatingButton
                    rating={rating}
                    isExpanded={isExpanded}
                    disabled={isViewOnly}
                    ratingLabel=""
                    ratingDefs={ratingDefs}
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
                {imageURL === undefined 
                  ? isBeingEdited
                    ? <Dropzone onDrop={this.OnDrop} />
                    : <Typography variant="caption">no screenshot</Typography>
                  : <Button
                      className={classes.evidenceScreenshotButton}
                      onClick={this.OnScreenShotClick}
                    >
                      <img
                        src={imageURL}
                        alt="screenshot"
                        className={classes.evidenceScreenshot}
                      />
                    </Button>
                }
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
              hidden={!isExpanded || isBeingEdited || isViewOnly}
              size="small"
              onClick={this.OnDeleteButtonClick}
            >
              delete
            </Button>
            <div style={{ flexGrow: '1' }} />
            <Button
              hidden={!isExpanded || isBeingEdited || isViewOnly}
              size="small"
              onClick={this.OnDuplicateButtonClick}
            >
              duplicate
            </Button>
            <div style={{ flexGrow: '1' }} />
            <Button
              variant="contained"
              onClick={this.OnEditButtonClick}
              hidden={!isExpanded || isBeingEdited || isViewOnly}
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
      </Collapse>
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
    id: '',
    propId: '',
    mechId: '',
    rsrcId: '',
    numberLabel: '',
    note: '',
    rating: 0
  }
};
/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(EvidenceLink);
