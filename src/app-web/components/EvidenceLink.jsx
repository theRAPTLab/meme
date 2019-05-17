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
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
// Material UI Icons
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import DATA from '../modules/pmc-data';
import UR from '../../system/ursys';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'EvidenceLink:';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class EvidenceLink extends React.Component {
  constructor(props) {
    super(props);
    // sourceHasNotBeenSet if neither propId nor mechId have been defined.
    let sourceHasNotBeenSet = this.props.propId === undefined && this.props.mechId === undefined;
    this.state = {
      note: this.props.note,
      canBeEdited: false,
      isBeingEdited: false,
      isBeingDisplayedInResourceLibrary: true,
      isExpanded: false,
      listenForSourceSelection: false,
      sourceHasNotBeenSet
    };
    this.HandleDataUpdate = this.HandleDataUpdate.bind(this);
    this.handleDeleteButtonClick = this.handleDeleteButtonClick.bind(this);
    this.handleEditButtonClick = this.handleEditButtonClick.bind(this);
    this.handleSaveButtonClick = this.handleSaveButtonClick.bind(this);
    this.handleEvidenceLinkOpen = this.handleEvidenceLinkOpen.bind(this);
    this.handleNoteChange = this.handleNoteChange.bind(this);
    this.handleSourceSelectClick = this.handleSourceSelectClick.bind(this);
    this.EnableSourceSelect = this.EnableSourceSelect.bind(this);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.toggleExpanded = this.toggleExpanded.bind(this);
    UR.Sub('DATA_UPDATED', this.HandleDataUpdate);
    UR.Sub('SHOW_EVIDENCE_LINK_SECONDARY', this.handleEvidenceLinkOpen);
    UR.Sub('EVLINK:ENABLE_SOURCE_SELECT', this.EnableSourceSelect);
    UR.Sub('SELECTION_CHANGED', this.handleSelectionChange);
  }

  componentDidMount() {}

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
    let note = DATA.EvidenceLinkByEvidenceId(this.props.evId).note;
    this.setState({ note });
  }

  handleDeleteButtonClick() {
    alert("DELETE/CANCEL not implemented yet.");
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
  handleSourceSelectClick(evId, rsrcId) {
    UR.Publish('REQUEST_SELECT_EVLINK_SOURCE', { evId, rsrcId });
  }

  EnableSourceSelect(data) {
    if (data.evId === this.props.evId) {
      this.setState({ listenForSourceSelection: true });      
    }
  }

  handleSelectionChange() {
    if (this.state.sourceHasNotBeenSet && this.state.listenForSourceSelection) {
      let sourceId;

      // Assume mechs are harder to select so check for them first.
      // REVIEW: Does this work well?
      let selectedMechIds = DATA.VM_SelectedMechs();
      if (DBG) console.log(PKG, 'selection changed mechsIds:', selectedMechIds);
      if (selectedMechIds.length > 0) {
        // Get the last selection
        sourceId = selectedMechIds[selectedMechIds.length - 1];
        DATA.SetEvidenceLinkMechId(this.props.evId, sourceId);
        // leave it in a waiting state?  This allows you to change your mind?
        // REVIEW may want another way to exit / confirm the selection?
        // For May 1, exit as soon as something is selected to prevent
        // subsequent source selections from being applied to ALL open
        // evlinks.
        this.setState({ sourceHasNotBeenSet: false });
        return;
      }

      let selectedPropIds = DATA.VM_SelectedProps();
      if (DBG) console.log(PKG, 'selection changed propIds:', selectedPropIds);
      if (selectedPropIds.length > 0) {
        // Get the last selection
        sourceId = selectedPropIds[selectedPropIds.length - 1];
        DATA.SetEvidenceLinkPropId(this.props.evId, sourceId);
        // leave it in a waiting state?  This allows you to change your mind?
        // REVIEW may want another way to exit / confirm the selection?
        // For May 1, exit as soon as something is selected to prevent
        // subsequent source selections from being applied to ALL open
        // evlinks.
        this.setState({ sourceHasNotBeenSet: false });
        return;
      }
    }
  }

  toggleExpanded() {
    if (DBG) console.log(PKG,'evidence link clicked');
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
    const {
      note,
      isBeingEdited,
      isExpanded,
      isBeingDisplayedInResourceLibrary,
      sourceHasNotBeenSet,
      listenForSourceSelection
    } = this.state;
    if (evId === '') return '';
    let sourceLabel;
    if (propId !== undefined) {
      sourceLabel = (
        <div className={classes.evidenceLinkSourcePropAvatarSelected}>{DATA.Prop(propId).name}</div>
      );
    } else if (mechId !== undefined) {
      sourceLabel = (
        <div className={classes.evidenceLinkSourceMechAvatarSelected}>{DATA.Mech(mechId).name}</div>
      );
    } else if (sourceHasNotBeenSet && listenForSourceSelection) {
      // eslint-disable-next-line prettier/prettier
      sourceLabel = (
        <div className={classes.evidenceLinkSourceAvatarWaiting}>select source...</div>
      );
    } else {
      sourceLabel = (
        <Button
          onClick={() => {
            this.handleSourceSelectClick(evId, rsrcId);
          }}
          className={classes.evidenceLinkSelectButton}
        >
          Link
        </Button>
      );
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
        <div className={classes.evidenceWindowLabel}>EVIDENCE LINK</div>
        <div className={classes.evidencePrompt} hidden={!isExpanded}>
          How does this resource support this component / property / mechanism?
        </div>
        <div className={classes.evidenceTitle}>
          <div style={{ width: '50px', display: 'flex', flexDirection:'column'}}>
            {!isBeingDisplayedInResourceLibrary ? (
              <Avatar className={classes.resourceViewAvatar}>{rsrcId}</Avatar>
            ) : (
              ''
            )}
            <div className={classes.evidenceLinkAvatar}>{sourceLabel}</div>
            <img
              src="../static/screenshot_sim.png"
              alt="screenshot"
              className={classes.evidenceScreenshot}
              hidden={!isExpanded}
            />
          </div>
          {isBeingEdited ? (
            <TextField
              className={ClassNames(
                classes.evidenceLabelField,
                isExpanded ? classes.evidenceLabelFieldExpanded : ''
              )}
              value={note}
              placeholder="Click to add label..."
              autoFocus
              multiline
              onChange={this.handleNoteChange}
            />
          ) : (
            <div
              className={ClassNames(
                classes.evidenceLabelField,
                isExpanded ? classes.evidenceLabelFieldExpanded : ''
              )}
            >
              {note}
            </div>
          )}
        </div>
        <Divider />
        <div style={{ display: 'flex', margin: '10px 10px 5px 0' }}>
          <Button
            hidden={!isExpanded || isBeingEdited}
            size="small"
            onClick={this.handleDeleteButtonClick}
          >
            delete
          </Button>
          <Button
            hidden={!isExpanded || !isBeingEdited}
            size="small"
            onClick={this.handleDeleteButtonClick}
          >
            cancel
          </Button>
          <div style={{ flexGrow: '1' }} />
          <Button
            variant="contained"
            onClick={this.handleEditButtonClick}
            hidden={!isExpanded || isBeingEdited}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            onClick={this.handleSaveButtonClick}
            hidden={!isExpanded || !isBeingEdited}
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
