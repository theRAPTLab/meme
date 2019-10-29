/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ViewMain - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import ClassNames from 'classnames';
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
import TextField from '@material-ui/core/TextField';
// Material UI Icons
import AddIcon from '@material-ui/icons/Add';
import ChatBubbleOutlineIcon from '@material-ui/icons/ChatBubbleOutline';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import DeleteRoundedIcon from '@material-ui/icons/DeleteRounded';
import EditIcon from '@material-ui/icons/Edit';
import MenuIcon from '@material-ui/icons/Menu';
// MEME App Components
import DescriptionView from '../../components/DescriptionView';
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
    this.OnHelp = this.OnHelp.bind(this);
    UR.Subscribe('WINDOW_SIZE', this.UpdateDimensions);
    UR.Subscribe('DATA_UPDATED', this.DoDataUpdate);
    UR.Subscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate);
    UR.Subscribe('SELECTION_CHANGED', this.DoSelectionChange);
    UR.Subscribe('MODEL_TITLE:UPDATED', this.DoModelTitleUpdate);
    UR.Subscribe('PROP_ADD', this.OnComponentAdd);
    UR.Subscribe('PROPDIALOG_CLOSE', this.OnPropDialogClose);
    UR.Subscribe('MECH_ADD', this.OnMechAdd);
    UR.Subscribe('REQUEST_SELECT_EVLINK_SOURCE', this.handleEvLinkSourceSelectRequest);
    UR.Subscribe('MECHDIALOG:CLOSED', this.DoMechClosed);
    this.state = {
      title: '',
      modelId: '',
      modelAuthorGroupName: '',
      isModelAuthor: true,
      studentId: '',
      studentName: '',
      studentGroup: '',
      viewHeight: 0, // need to init this to prevent error with first render of resourceList
      resourceLibraryIsOpen: true,
      addPropOpen: false,
      addEdgeOpen: false,
      addEdgeSource: '', // Add Mech Dialog
      addEdgeTarget: '', // Add Mech Dialog
      componentIsSelected: false, // A component or property has been selected by user.  Used for pro-centric actions.
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
    UR.Unsubscribe('MODEL_TITLE:UPDATED', this.DoModelTitleUpdate);
    UR.Unsubscribe('PROP_ADD', this.OnComponentAdd);
    UR.Unsubscribe('PROPDIALOG_CLOSE', this.OnPropDialogClose);
    UR.Unsubscribe('MECH_ADD', this.OnMechAdd);
    UR.Unsubscribe('REQUEST_SELECT_EVLINK_SOURCE', this.handleEvLinkSourceSelectRequest);
    UR.Unsubscribe('MECHDIALOG:CLOSED', this.DoMechClosed);
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
    const userStudentId = ADM.GetSelectedStudentId(); // FIXME: Replace this with session?
    const userGroupId = ADM.GetGroupIdByStudent(userStudentId);
    const isModelAuthor = userGroupId === (model ? model.groupId : '');
    this.setState({
      title,
      modelId,
      modelAuthorGroupName,
      isModelAuthor,
      studentId: userStudentId,
      studentName: ADM.GetStudentName(),
      studentGroup: ADM.GetStudentGroupName()
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
    this.setState({ title: data.title });
  }

  OnChangeModelTitle(e) {
    this.setState({ title: e.target.value });
  }

  DoSaveModelTitle() {
    ADM.DB_ModelTitleUpdate(this.state.modelId, this.state.title);
  }

  // User clicked on "(+) Add Component" drawer button
  OnComponentAdd() {
    UR.Publish('PROPDIALOG_OPEN', { isProperty: false });
    this.setState({
      addPropOpen: true
    });
  }

  // User selected component/prop and clicked on "(+) Add Property Button"
  OnPropAdd() {
    UR.Publish('PROPDIALOG_OPEN', { isProperty: true });
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
    let selectedPropIds = DATA.VM_SelectedPropsIds();
    if (selectedPropIds.length > 0) {
      let propId = Number(selectedPropIds[0]);
      DATA.PMC_PropDelete(propId);
      if (this.state.addEdgeSource === propId) {
        this.setState({
          addEdgeSource: ''
        });
      }
    }
    this.setState({
      componentIsSelected: false
    });
  }

  OnAddPropComment() {
    let selectedPropIds = DATA.VM_SelectedPropsIds();
    if (selectedPropIds.length > 0) {
      let propId = selectedPropIds[0];
      UR.Publish('STICKY:OPEN', {
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
      UR.Publish('STICKY:OPEN', {
        refId: mechId,
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
        targetId: vw[1]
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
      let mechId = selectedMechIds[0];
      DATA.PMC_MechDelete(mechId);
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
      const name = this.state.addPropLabel
      DATA.PMC_PropUpdate(id, { name });
      UTILS.RLog('PropertyEdit', this.state.addPropLabel);
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
      UR.Publish('RESOURCES:COLLAPSE_ALL');
      UR.Publish('SHOW_EVIDENCE_LINK', { evId: urdata.evId, rsrcId: urdata.rsrcId });
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
    if (selectedPropIds.length === 1 && !this.state.addEdgeOpen) componentIsSelected = true;

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
      mechIsSelected
    });
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
      addPropOpen,
      addEdgeOpen,
      componentIsSelected,
      mechIsSelected,
      suppressSelection
    } = this.state;

    const classroomId = ADM.GetClassroomIdByStudent(studentId);
    const resources = ADM.GetResourcesForClassroom(classroomId);
    return (
      <div className={classes.root}>
        <CssBaseline />
        <Login />
        <ModelSelect />
        <AppBar
          position="fixed"
          className={classes.appBar}
          color={isModelAuthor ? 'primary' : 'default'}
        >
          <Toolbar>
            <Switch>
              <Route path="/:mode" />
            </Switch>
            <Button onClick={ADM.CloseModel} color="inherit">
              Model:&nbsp;&nbsp;
            </Button>
            <TextField
              id="projectTitle"
              InputProps={{ className: classes.projectTitle }}
              style={{ flexGrow: 1 }}
              placeholder="Untitled Model"
              value={title}
              onChange={this.OnChangeModelTitle}
              onBlur={this.DoSaveModelTitle}
            />
            <Typography variant="caption">&nbsp;&nbsp;by {modelAuthorGroupName} Group</Typography>
            <div
              className={resourceLibraryIsOpen ? classes.appBarRight : classes.appBarRightExpanded}
            >
              <StickyNoteButton refId={modelId} />
              &nbsp;&nbsp; &nbsp;&nbsp;
              <Button onClick={ADM.CloseModel} color="inherit">
                <div>{studentName}</div>
                &nbsp;:&nbsp;
                <div>{studentGroup}</div>
              </Button>
              &nbsp;&nbsp; &nbsp;&nbsp;
              <Button onClick={ADM.Logout} color="inherit">
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
        <ToolsPanel isDisabled={addPropOpen || addEdgeOpen} />

        <main className={classes.content} ref={this.refMain}>
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
          </div>

          <StickyNoteCollection />
          <RatingsDialog />
          <MechDialog />
          <DescriptionView />
          <ScreenshotView />
        </main>

        {/* Resource Library */}
        <Drawer variant="persistent" anchor="right" open={resourceLibraryIsOpen}>
          {/*<div style={{ height: this.state.viewHeight + 64, overflowY: 'scroll', zIndex: 1250 }}>*/}
          <Paper className={classes.resourceList}>
            <div className={classes.resourceListLabel}>
              <Button
                onClick={() => this.setState({ resourceLibraryIsOpen: false })}
                color="inherit"
                size="small"
                style={{ width: '100%' }}
              >
                <div style={{ width: '100%', textAlign: 'left' }}>RESOURCE LIBRARY</div>
                <ChevronRightIcon style={{ float: 'right' }} />
              </Button>
            </div>
            <List dense>
              {resources.map(resource => (
                <ResourceItem key={resource.id} resource={resource} />
              ))}
            </List>
          </Paper>
          {/* </div> */}
        </Drawer>

        {/* Resource View */}
        <ResourceView />

        {/* Help View */}
        <HelpView />

        {/* Prop Dialog -- Property label editing dialog */}
        <PropDialog />

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
            hidden={!(componentIsSelected || mechIsSelected)}
            onClick={componentIsSelected ? this.OnPropDelete : this.OnMechDelete}
            color="secondary"
            variant="extended"
            size="small"
          >
            <DeleteRoundedIcon />
            &nbsp;&nbsp;Delete&nbsp;
          </Fab>
          <Fab
            hidden={!(componentIsSelected || mechIsSelected)}
            onClick={componentIsSelected ? this.DoPropEdit : this.OnMechEdit}
            color="primary"
            variant="extended"
          >
            <EditIcon />
            &nbsp;&nbsp;Edit {componentIsSelected ? 'Component / Property' : 'Mechanism'}
          </Fab>
          <Fab
            hidden={!componentIsSelected}
            onClick={this.OnPropAdd}
            color="primary"
            variant="extended"
          >
            <AddIcon /> Add property
          </Fab>
          <Fab
            hidden={!(componentIsSelected || mechIsSelected)}
            onClick={componentIsSelected ? this.OnAddPropComment : this.OnAddMechComment}
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
