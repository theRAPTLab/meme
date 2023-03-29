/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ViewMain - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import ClassNames from 'classnames';
import clsx from 'clsx';
import { Switch, Route } from 'react-router-dom';
// Material UI Theming
import { withStyles, createMuiTheme } from '@material-ui/core/styles';
import { yellow } from '@material-ui/core/colors';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Material UI Elements
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import InputBase from '@material-ui/core/InputBase';
// Material UI Icons
import AddIcon from '@material-ui/icons/Add';
import ChatBubbleOutlineIcon from '@material-ui/icons/ChatBubbleOutline';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import DeleteRoundedIcon from '@material-ui/icons/DeleteRounded';
import EditIcon from '@material-ui/icons/Edit';
import MenuIcon from '@material-ui/icons/Menu';
import ZoomInMapIcon from '@material-ui/icons/CenterFocusWeak';
import ZoomOutMapIcon from '@material-ui/icons/ZoomOutMap';
// MEME App Components
import DescriptionView from '../../components/DescriptionView';
import InfoDialog from '../../components/InfoDialog';
import HelpView from '../../components/HelpView';
import Login from '../../components/Login';
import MechDialog from '../../components/MechDialog';
import ModelSelect from '../../components/ModelSelect';
import PropDialog from '../../components/PropDialog';
import ResourceView from '../../components/ResourceView';
import ResourceItem from '../../components/ResourceItem';
import RatingsDialog from '../../components/RatingsDialog';
import ScreenshotView from '../../components/ScreenshotView';
import StickyNoteButton from '../../components/StickyNoteButton';
import StickyNoteCollection from '../../components/StickyNoteCollection';
import ToolsPanel from './ToolsPanel';
// MEME Modules and Utils
import MEMEStyles from '../../components/MEMEStyles';
import UR from '../../../system/ursys';
import UTILS from '../../modules/utils';
import RoutedView from './RoutedView';
import DATA from '../../modules/data';
import ADM from '../../modules/data';
import ASET from '../../modules/adm-settings';
import DATAMAP from '../../../system/common-datamap';
import { cssreact, cssdraw, cssalert } from '../../modules/console-styles';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'ViewMain:';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ViewMain extends React.Component {
  // constructor
  constructor(props) {
    super(props);
    UR.ReactPreflight(ViewMain, module);
    UR.DisableAdminPowers();

    this.displayName = this.constructor.name;
    this.refMain = React.createRef();
    this.refToolbar = React.createRef();
    this.refView = React.createRef();
    this.refDrawer = React.createRef();
    this.state = { viewHeight: 0, viewWidth: 0 };
    this.DoDataUpdate = this.DoDataUpdate.bind(this);
    this.DoADMDataUpdate = this.DoADMDataUpdate.bind(this);
    this.UpdateDimensions = this.UpdateDimensions.bind(this);
    this.DoModelTitleUpdate = this.DoModelTitleUpdate.bind(this);
    this.OnChangeModelTitle = this.OnChangeModelTitle.bind(this);
    this.DoSaveModelTitle = this.DoSaveModelTitle.bind(this);
    this.DoSubmitModelTitleForm = this.DoSubmitModelTitleForm.bind(this);
    this.OnToolsPanelToggle = this.OnToolsPanelToggle.bind(this);
    this.OnShowEvidenceLink = this.OnShowEvidenceLink.bind(this);
    this.OnOutcomeAdd = this.OnOutcomeAdd.bind(this);
    this.OnPropAdd = this.OnPropAdd.bind(this);
    this.OnPropDelete = this.OnPropDelete.bind(this);
    this.OnAddPropComment = this.OnAddPropComment.bind(this);
    this.OnAddMechComment = this.OnAddMechComment.bind(this);
    this.OnMechDelete = this.OnMechDelete.bind(this);
    this.DoPropEdit = this.DoPropEdit.bind(this);
    this.OnMechAdd = this.OnMechAdd.bind(this);
    this.OnMechEdit = this.OnMechEdit.bind(this);
    this.DoMechClosed = this.DoMechClosed.bind(this);
    this.OnComponentAdd = this.OnComponentAdd.bind(this);
    this.OnPropDialogClose = this.OnPropDialogClose.bind(this);
    this.handleEvLinkSourceSelectRequest = this.handleEvLinkSourceSelectRequest.bind(this);
    this.DoSelectionChange = this.DoSelectionChange.bind(this);
    this.OnCloseModel = this.OnCloseModel.bind(this);
    this.OnLogout = this.OnLogout.bind(this);
    this.OnHelp = this.OnHelp.bind(this);
    UR.Subscribe('WINDOW_SIZE', this.UpdateDimensions);
    UR.Subscribe('DATA_UPDATED', this.DoDataUpdate);
    UR.Subscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate);
    UR.Subscribe('SELECTION_CHANGED', this.DoSelectionChange);
    UR.Subscribe('MODEL_TITLE_UPDATED', this.DoModelTitleUpdate);
    UR.Subscribe('SHOW_EVIDENCE_LINK', this.OnShowEvidenceLink);
    UR.Subscribe('OUTCOME_ADD', this.OnOutcomeAdd);
    UR.Subscribe('PROP_ADD', this.OnComponentAdd);
    UR.Subscribe('PROPDIALOG_CLOSE', this.OnPropDialogClose);
    UR.Subscribe('MECH_ADD', this.OnMechAdd);
    UR.Subscribe('REQUEST_SELECT_EVLINK_SOURCE', this.handleEvLinkSourceSelectRequest);
    UR.Subscribe('MECHDIALOG_CLOSED', this.DoMechClosed);
    this.state = {
      title: '',
      modelId: '',
      modelAuthorGroupName: '',
      isModelAuthor: true,
      studentId: '',
      studentName: '',
      studentGroup: '',
      viewHeight: 0, // need to init this to prevent error with first render of resourceList
      toolsPanelIsOpen: true,
      resourceLibraryIsOpen: true,
      addPropOpen: false,
      addEdgeOpen: false,
      addEdgeSource: '', // Add Mech Dialog
      addEdgeTarget: '', // Add Mech Dialog
      componentIsSelected: false, // A component or component property has been selected by user.  Used for pro-centric actions.
      outcomeIsSelected: false, // A outcome or outcome property has been selected by user.  Used for pro-centric actions.
      mechIsSelected: false // A mechanism is slected by user.  Used for mech-centric actions.
    };
  }

  componentDidMount() {
    // console.log(`%ccomponentDidMount()`, cssreact);
    //
    // child components need to know the dimensions
    // of this component, but they are invalid until
    // the root component renders in SystemInit.
    // SystemInit fires `WINDOW_SIZE` to force the
    // relayout
  }

  componentWillUnmount() {
    UR.Unsubscribe('WINDOW:SIZE', this.UpdateDimensions);
    UR.Unsubscribe('DATA_UPDATED', this.DoDataUpdate);
    UR.Unsubscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate);
    UR.Unsubscribe('SELECTION_CHANGED', this.DoSelectionChange);
    UR.Unsubscribe('MODEL_TITLE_UPDATED', this.DoModelTitleUpdate);
    UR.Unsubscribe('SHOW_EVIDENCE_LINK', this.OnShowEvidenceLink);
    UR.Unsubscribe('OUTCOME_ADD', this.OnOutcomeAdd);
    UR.Unsubscribe('PROP_ADD', this.OnComponentAdd);
    UR.Unsubscribe('PROPDIALOG_CLOSE', this.OnPropDialogClose);
    UR.Unsubscribe('MECH_ADD', this.OnMechAdd);
    UR.Unsubscribe('REQUEST_SELECT_EVLINK_SOURCE', this.handleEvLinkSourceSelectRequest);
    UR.Unsubscribe('MECHDIALOG_CLOSED', this.DoMechClosed);
  }

  // PMCData calls DATA_UPDATED after loading model.
  // Here we update the model meta info
  DoDataUpdate() {
    if (DBG) console.log(PKG, 'DATA_UPDATE');
    // Read the group info from the model and set parameters

    // FIXME: The URSYS call should probably pass the modelId, e.g. data.modelId
    const modelId = ADM.GetSelectedModelId(); // get selected model for now
    const model = ADM.GetModelById(modelId);
    const title = ADM.GetModelTitle(modelId);
    const modelAuthorGroupName = ADM.GetGroupName(model ? model.groupId : '');
    const userStudentId = ADM.GetAuthorId();
    const userGroupId = ADM.GetGroupIdByStudent(userStudentId);
    const isModelAuthor = userGroupId === (model ? model.groupId : '');
    this.setState({
      title,
      modelId,
      modelAuthorGroupName,
      isModelAuthor,
      studentId: userStudentId,
      studentName: ADM.GetLggedInUserName(),
      studentGroup: ADM.GetLoggedInGroupName()
    });
  }

  DoADMDataUpdate() {
    this.DoDataUpdate();
  }

  UpdateDimensions() {
    /*/
    NOTE: Material UI uses FlexBox
    we can insert a CSSGRID into here eventually
    /*/
    this.viewRect = this.refMain.current.getBoundingClientRect();
    this.toolRect = this.refToolbar.current.getBoundingClientRect();
    // NOTE: viewWidth/viewHeigg
    const viewWidth = this.viewRect.width;
    const viewHeight = this.viewRect.height - this.toolRect.height;
    const innerWidth = window.innerWidth - MEMEStyles.DRAWER_WIDTH;
    const innerHeight = window.innerHeight - this.toolRect.height;

    // debugging: double-refresh issue
    console.log('%cUpdateDimensions Fired', cssdraw);
    this.setState({
      viewWidth: Math.min(viewWidth, innerWidth),
      viewHeight: Math.min(viewHeight, innerHeight)
    });
  }

  DoModelTitleUpdate(data) {
    if (this.state.modelId === data.id) this.setState({ title: data.title });
  }

  OnChangeModelTitle(e) {
    this.setState({ title: e.target.value });
  }

  DoSaveModelTitle() {
    ADM.DB_ModelTitleUpdate(this.state.modelId, this.state.title);
  }

  DoSubmitModelTitleForm(e) {
    e.preventDefault();
    e.stopPropagation();
    document.activeElement.blur(); // will trigger save
  }

  OnToolsPanelToggle() {
    this.setState({ toolsPanelIsOpen: !this.state.toolsPanelIsOpen });
  }

  OnShowEvidenceLink() {
    this.setState({ resourceLibraryIsOpen: true });
  }

  // User clicked on "(+) Add Outcome" drawer button
  OnOutcomeAdd() {
    UR.Publish('PROPDIALOG_OPEN', {
      isProperty: false,
      propType: DATAMAP.PMC_MODELTYPES.OUTCOME.id
    });
    this.setState({
      addPropOpen: true
    });
  }

  // User clicked on "(+) Add Component" drawer button
  OnComponentAdd() {
    UR.Publish('PROPDIALOG_OPEN', {
      isProperty: false,
      propType: DATAMAP.PMC_MODELTYPES.COMPONENT.id
    });
    this.setState({
      addPropOpen: true
    });
  }

  // User selected component/prop and clicked on "(+) Add Property Button"
  OnPropAdd() {
    let propType = this.state.componentIsSelected
      ? DATAMAP.PMC_MODELTYPES.COMPONENT.id
      : DATAMAP.PMC_MODELTYPES.OUTCOME.id;
    UR.Publish('PROPDIALOG_OPEN', { isProperty: true, propType });
    this.setState({
      addPropOpen: true
    });
  }

  // User selected component/prop and clicked on "(/) Edit Component / Property" button
  DoPropEdit() {
    let selectedPropIds = DATA.VM_SelectedPropsIds();
    if (selectedPropIds.length > 0) {
      let propId = selectedPropIds[0];
      let prop = DATA.Prop(propId);
      UR.Publish('PROPDIALOG_OPEN', {
        label: prop.name,
        propId,
        propType: prop.propType,
        description: prop.description,
        isProperty: false
      });
      this.setState({
        addPropOpen: true
      });
    }
  }

  OnPropDialogClose() {
    if (DBG) console.log('close');
    this.setState({ addPropOpen: false });
  }

  // User selected component/prop and clicked on "() Delete"
  OnPropDelete() {
    const selectedPropIds = DATA.VM_SelectedPropsIds();
    if (selectedPropIds.length > 0) {
      const pmcDataId = ASET.selectedPMCDataId;
      const propId = Number(selectedPropIds[0]);
      UR.DBTryLock('pmcData.entities', [pmcDataId, propId]).then(rdata => {
        const { success, semaphore, uaddr, lockedBy } = rdata;
        status += success
          ? `${semaphore} lock acquired by ${uaddr} `
          : `failed to acquired ${semaphore} lock `;
        if (rdata.success) {
          DATA.PMC_PropDelete(propId);
          if (this.state.addEdgeSource === propId) {
            this.setState({
              addEdgeSource: ''
            });
          }
        } else {
          alert(
            `Sorry, someone else (${rdata.lockedBy}) is editing this Component / Property right now.  Please try again later.`
          );
        }
      });
    }
    this.setState({
      componentIsSelected: false
    });
  }

  OnAddPropComment() {
    let selectedPropIds = DATA.VM_SelectedPropsIds();
    if (selectedPropIds.length > 0) {
      let propId = selectedPropIds[0];
      UR.Publish('STICKY_OPEN', {
        refId: propId,
        // FIXME: Set position according to parent prop?
        x: 600, // stickynote hack moves it by -325
        y: 100
      });
    }
  }

  OnAddMechComment() {
    let selectedMechIds = DATA.VM_SelectedMechIds();
    if (selectedMechIds.length > 0) {
      let mechId = selectedMechIds[0];
      let mech = DATA.Mech(mechId);
      UR.Publish('STICKY_OPEN', {
        refId: mech.id,
        // FIXME: Set position according to parent prop?
        x: 600, // stickynote hack moves it by -325
        y: 100
      });
    }
  }

  OnMechAdd() {
    if (DBG) console.log('Add!');
    // Deselect any mechanisms that might be currently selected so that user can select props
    DATA.VM_DeselectAllMechs();
    this.setState({
      suppressSelection: true // used to hide Add/Edit buttons
    });
    UR.Publish('MECHDIALOG:ADD');
  }

  // User selected mechanism and clicked on "(/) Edit Mechanism" button
  OnMechEdit() {
    let selectedMechIds = DATA.VM_SelectedMechIds();
    if (selectedMechIds.length > 0) {
      DATA.VM_DeselectAll(); // deselect so mech buttons disappear
      this.setState({
        suppressSelection: true, // used to hide Add/Edit buttons
        addEdgeOpen: true
      });
      let mechId = selectedMechIds[0];
      let mech = DATA.Mech(mechId);
      let vw = mechId.split(':');
      let data = {
        id: mech.id, // we want db id, not graphlib mechId
        label: mech.name,
        description: mech.description,
        sourceId: vw[0],
        targetId: vw[1],
        bidirectional: mech.bidirectional
      };
      UR.Publish('MECHDIALOG:EDIT', data);
    }
  }

  DoMechClosed() {
    this.setState({
      suppressSelection: false,
      addEdgeOpen: false
    });
  }

  // User selected component/prop and clicked on "() Delete"
  OnMechDelete() {
    let selectedMechIds = DATA.VM_SelectedMechIds();
    if (selectedMechIds.length > 0) {
      const mechId = selectedMechIds[0];
      const pmcDataId = ASET.selectedPMCDataId;
      const mech = DATA.Mech(mechId);
      const intMechId = Number(mech.id);
      UR.DBTryLock('pmcData.entities', [pmcDataId, intMechId]).then(rdata => {
        const { success, semaphore, uaddr, lockedBy } = rdata;
        status += success
          ? `${semaphore} lock acquired by ${uaddr} `
          : `failed to acquired ${semaphore} lock `;
        if (rdata.success) {
          DATA.PMC_MechDelete(mechId);
        } else {
          alert(
            `Sorry, someone else (${rdata.lockedBy}) is editing this Mechanism right now.  Please try again later.`
          );
        }
      });
    }
    this.setState({
      mechIsSelected: false
    });
  }

  OnPropDialogCreateClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (DBG) console.log('create prop');
    if (this.state.addPropIsProperty) {
      // Add a property to the selected component
      let selectedPropIds = DATA.VM_SelectedPropsIds();
      if (selectedPropIds.length > 0) {
        let parentPropId = selectedPropIds[0];
        if (DBG) console.log('...setting parent of', this.state.addPropLabel, 'to', parentPropId);
        // Create new prop
        DATA.PMC_PropAdd(this.state.addPropLabel, parentPropId);
      }
    } else if (this.state.addPropPropId !== '') {
      // Update existing prop
      const id = parseInt(this.state.addPropPropId);
      const name = this.state.addPropLabel;
      DATA.PMC_PropUpdate(id, { name });
    } else {
      // Create new prop
      DATA.PMC_PropAdd(this.state.addPropLabel);
    }
    this.OnPropDialogClose();
  }

  /*/
   *  User wants to set the source on an EvidenceLink, so:
   *  1. Close the ResourceView if open,
   *  2. Show and expand the evidence
   *  3. Enable source selection on the Evidence Link
  /*/
  handleEvLinkSourceSelectRequest(urdata) {
    this.setState({ resourceViewOpen: false }, () => {
      UR.Publish('RESOURCEVIEW:CLOSE');
      UR.Publish('EVLINK:ENABLE_SOURCE_SELECT', { evId: urdata.evId });
    });
  }

  // FIXME
  // Review: REMOVE VMECH CALLS HERE!
  DoSelectionChange() {
    let selectedPropIds = DATA.VM_SelectedPropsIds();
    if (DBG) console.log('selection changed', selectedPropIds);
    let sourceId = '';
    let targetId = '';
    if (selectedPropIds.length > 0) {
      sourceId = selectedPropIds[0];
    }
    if (selectedPropIds.length > 1) {
      targetId = selectedPropIds[1];
    }

    // Set componentIsSelected for Component Editing
    // If more than one component is selected, hide the component
    // editing buttons
    let componentIsSelected = false;
    let outcomeIsSelected = false;
    if (selectedPropIds.length === 1 && !this.state.addEdgeOpen) {
      let selectedProp = DATA.Prop(selectedPropIds[0]);
      switch (selectedProp.propType) {
        case DATAMAP.PMC_MODELTYPES.OUTCOME.id:
          outcomeIsSelected = true;
          break;
        default:
        case DATAMAP.PMC_MODELTYPES.COMPONENT.id:
          componentIsSelected = true;
          break;
      }
    }
    // Set mechIsSelected for Mech Editing
    // If more than one mech is selected, hide the mech
    // editing buttons
    let mechIsSelected = false;
    let selectedMechIds = DATA.VM_SelectedMechIds();
    if (selectedMechIds.length === 1 && !this.state.addEdgeOpen) mechIsSelected = true;

    this.setState({
      addEdgeSource: sourceId,
      addEdgeTarget: targetId,
      componentIsSelected,
      outcomeIsSelected,
      mechIsSelected
    });
  }

  OnCloseModel() {
    UR.Publish('MECHDIALOG:CLOSE');
    UR.Publish('STICKY_CLOSE');
    UR.Publish('RATING_CLOSE');
    ADM.CloseModel();
  }

  OnLogout() {
    UR.Publish('MECHDIALOG:CLOSE');
    UR.Publish('STICKY_CLOSE');
    UR.Publish('RATING_CLOSE');
    ADM.Logout();
  }

  OnHelp() {
    UR.Publish('HELP_OPEN');
  }

  render() {
    const { classes } = this.props;

    const {
      modelId,
      modelAuthorGroupName,
      isModelAuthor,
      title,
      studentId,
      studentName,
      studentGroup,
      resourceLibraryIsOpen,
      toolsPanelIsOpen,
      addPropOpen,
      addEdgeOpen,
      componentIsSelected,
      outcomeIsSelected,
      mechIsSelected,
      suppressSelection
    } = this.state;

    // we need to use the model author here, not the currently logged in student.
    const model = ADM.GetModelById(modelId);
    const classroomId = model ? ADM.GetClassroomIdByGroup(model.groupId) : '';
    const resources = classroomId !== '' ? ADM.GetResourcesForClassroom(classroomId) : [];

    const isViewOnly = ADM.IsViewOnly();
    const isDBReadOnly = ADM.IsDBReadOnly();
    let viewStatus;
    viewStatus = isViewOnly ? 'VIEW MODE' : '';
    viewStatus = isDBReadOnly ? 'DATABASE ARCHIVE REVIEW MODE' : '';

    return (
      <div className={classes.root}>
        <CssBaseline />
        <Login />
        <ModelSelect />
        <AppBar
          position="fixed"
          className={clsx(
            classes.appBar,
            { [classes.toolsPanelClosedShift]: !toolsPanelIsOpen },
            { [classes.appBarToolsPanelClosedShift]: !toolsPanelIsOpen }
          )}
          color={isModelAuthor ? 'primary' : 'default'}
        >
          <Toolbar className={classes.appBarToolbar}>
            <Switch>
              <Route path="/:mode" />
            </Switch>
            <Button
              onClick={() => this.setState({ toolsPanelIsOpen: true })}
              hidden={toolsPanelIsOpen}
              color="inherit"
            >
              <MenuIcon />
            </Button>
            <Button onClick={this.OnCloseModel} color="inherit" style={{ marginLeft: '20px' }}>
              Model:&nbsp;&nbsp;
            </Button>
            <form onSubmit={this.DoSubmitModelTitleForm}>
              <InputBase
                id="projectTitle"
                style={{ flexGrow: 1 }}
                placeholder="Untitled Model"
                value={title}
                disabled={isViewOnly}
                onChange={this.OnChangeModelTitle}
                onBlur={this.DoSaveModelTitle}
                classes={{
                  input: isModelAuthor ? classes.primaryProjectTitle : classes.projectTitle
                }}
              />
            </form>
            <Typography variant="caption">&nbsp;&nbsp;by {modelAuthorGroupName} Group</Typography>
            <div
              className={resourceLibraryIsOpen ? classes.appBarRight : classes.appBarRightExpanded}
            >
              <StickyNoteButton refId="9999" />
              &nbsp;&nbsp; &nbsp;&nbsp;
              <Button onClick={this.OnCloseModel} color="inherit">
                <div>{studentName}</div>
                &nbsp;:&nbsp;
                <div>{studentGroup}</div>
              </Button>
              &nbsp;&nbsp; &nbsp;&nbsp;
              <Button onClick={this.OnLogout} color="inherit">
                Logout
              </Button>
              <Button onClick={this.OnHelp} color="inherit">
                ?
              </Button>
              <Button
                onClick={() => this.setState({ resourceLibraryIsOpen: true })}
                hidden={resourceLibraryIsOpen}
                color="inherit"
              >
                <MenuIcon />
              </Button>
            </div>
          </Toolbar>
        </AppBar>

        {/* Left Tool Sidebar */}
        <ToolsPanel
          isDisabled={addPropOpen || addEdgeOpen}
          isOpen={toolsPanelIsOpen}
          toggleOpen={this.OnToolsPanelToggle}
        />

        <main
          className={clsx(classes.content, { [classes.toolsPanelClosedShift]: !toolsPanelIsOpen })}
          ref={this.refMain}
        >
          <div className={classes.toolbar} ref={this.refToolbar} />
          <div
            className={classes.view}
            ref={this.refView}
            style={{ height: this.state.viewHeight }}
          >
            <Switch>
              <Route
                path="/:mode"
                render={props => (
                  <RoutedView
                    {...props}
                    viewHeight={this.state.viewHeight}
                    viewWidth={this.state.viewWidth}
                  />
                )}
              />
              <Route
                path="/"
                render={props => (
                  <RoutedView
                    {...props}
                    viewHeight={this.state.viewHeight}
                    viewWidth={this.state.viewWidth}
                  />
                )}
              />
            </Switch>
            <ZoomInMapIcon
              onClick={() => UR.Publish('SVG_PANZOOM_RESET')}
              style={{ position: 'absolute', left: '110px', bottom: '60px' }}
            />
            <ZoomOutMapIcon
              onClick={() => UR.Publish('SVG_PANZOOM_OUT')}
              style={{ position: 'absolute', left: '110px', bottom: '10px' }}
            />
            <Typography
              variant="caption"
              style={{ position: 'absolute', left: '160px', bottom: '12px' }}
            >
              {' '}
              {/* STATUS LABEL */}
              {viewStatus}
            </Typography>
          </div>

          <StickyNoteCollection />
          <RatingsDialog />
          <MechDialog />
          <DescriptionView />
          <ScreenshotView />
        </main>

        {/* Resource Library */}
        <Drawer variant="persistent" anchor="right" open={resourceLibraryIsOpen}>
          <div className={classes.resourceList}>
            <div className={clsx(classes.drawerAppBar, classes.resourceListAppBar)}>
              <Button
                onClick={() => this.setState({ resourceLibraryIsOpen: false })}
                color="inherit"
                size="small"
                style={{ width: '100%' }}
              >
                <div style={{ textAlign: 'left', flexGrow: 1 }}>EVIDENCE LIBRARY</div>
                <DoubleArrowIcon />
              </Button>
            </div>
            <Paper className={classes.resourceListList}>
              <List dense>
                {resources.map(resource => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))}
              </List>
            </Paper>
          </div>
        </Drawer>

        {/* Resource View */}
        <ResourceView />

        {/* Help View */}
        <HelpView />

        {/* Prop Dialog -- Property label editing dialog */}
        <PropDialog />

        {/* General Information Dialog */}
        <InfoDialog />

        {/* Component/Mech add/edit/delete buttons that respond to selection events */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-evenly',
            position: 'absolute',
            left: '100px',
            right: '300px',
            bottom: '20px'
          }}
          hidden={suppressSelection}
        >
          <Fab
            hidden={!(componentIsSelected || outcomeIsSelected || mechIsSelected) || isViewOnly}
            onClick={
              componentIsSelected || outcomeIsSelected ? this.OnPropDelete : this.OnMechDelete
            }
            color="secondary"
            variant="extended"
            size="small"
          >
            <DeleteRoundedIcon />
            &nbsp;&nbsp;Delete&nbsp;
          </Fab>
          <Fab
            hidden={!(componentIsSelected || outcomeIsSelected || mechIsSelected) || isViewOnly}
            onClick={componentIsSelected || outcomeIsSelected ? this.DoPropEdit : this.OnMechEdit}
            color="primary"
            variant="extended"
          >
            <EditIcon />
            &nbsp;&nbsp;Edit{' '}
            {componentIsSelected
              ? DATAMAP.PMC_MODELTYPES.COMPONENT.label
              : outcomeIsSelected
              ? DATAMAP.PMC_MODELTYPES.OUTCOME.label
              : DATAMAP.PMC_MODELTYPES.MECHANISM.label}
          </Fab>
          <Fab
            hidden={!(componentIsSelected || outcomeIsSelected) || isViewOnly}
            onClick={this.OnPropAdd}
            color="primary"
            variant="extended"
          >
            <AddIcon /> Add property
          </Fab>
          <Fab
            hidden={!(componentIsSelected || outcomeIsSelected || mechIsSelected) || isDBReadOnly}
            onClick={
              componentIsSelected || outcomeIsSelected
                ? this.OnAddPropComment
                : this.OnAddMechComment
            }
            variant="extended"
          >
            <ChatBubbleOutlineIcon htmlColor={yellow[800]} />
            &nbsp;&nbsp;Add Comment
          </Fab>
        </div>
      </div>
    );
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// default props are expect properties that we expect
/// and are declared for validation
ViewMain.defaultProps = {
  classes: {}
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// propTypes are declared. Note "vague" propstypes are
/// disallowed by eslint, so use shape({prop: ProtType })
/// to describe them in more detail
ViewMain.propTypes = {
  classes: PropTypes.shape({})
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// requirement for UR MODULES and COMPONENTS
ViewMain.MOD_ID = __dirname;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(MEMEStyles)(ViewMain);
