/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ViewMain - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import ClassNames from 'classnames';
import { Switch, Route } from 'react-router-dom';
// Material UI Elements
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import Card from '@material-ui/core/Card';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
// Material UI Icons
import AddIcon from '@material-ui/icons/Add';
import ChatBubbleOutlineIcon from '@material-ui/icons/ChatBubbleOutline';
import DeleteRoundedIcon from '@material-ui/icons/DeleteRounded';
import EditIcon from '@material-ui/icons/Edit';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import RoutedView from './RoutedView';
import MEMEStyles from '../../components/MEMEStyles';
import UR from '../../../system/ursys';
import DATA from '../../modules/pmc-data';
import ADM from '../../modules/adm-data';
import Login from '../../components/Login';
import ModelSelect from '../../components/ModelSelect';
import ResourceView from '../../components/ResourceView';
import ResourceItem from '../../components/ResourceItem';
import StickyNoteCollection from '../../components/StickyNoteCollection';
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
    UR.ReloadOnViewChange();

    this.displayName = this.constructor.name;
    this.refMain = React.createRef();
    this.refToolbar = React.createRef();
    this.refView = React.createRef();
    this.refDrawer = React.createRef();
    this.state = { viewHeight: 0, viewWidth: 0 };
    this.HandleDataUpdate = this.HandleDataUpdate.bind(this);
    this.DoADMDataUpdate = this.DoADMDataUpdate.bind(this);
    this.UpdateDimensions = this.UpdateDimensions.bind(this);
    this.HandleAddPropLabelChange = this.HandleAddPropLabelChange.bind(this);
    this.HandleAddEdgeDialogLabelChange = this.HandleAddEdgeDialogLabelChange.bind(this);
    this.HandlePropAdd = this.HandlePropAdd.bind(this);
    this.HandlePropDelete = this.HandlePropDelete.bind(this);
    this.OnAddPropComment = this.OnAddPropComment.bind(this);
    this.HandleMechDelete = this.HandleMechDelete.bind(this);
    this.HandlePropEdit = this.HandlePropEdit.bind(this);
    this.HandleMechEdit = this.HandleMechEdit.bind(this);
    this.HandleComponentAdd = this.HandleComponentAdd.bind(this);
    this.HandleAddPropClose = this.HandleAddPropClose.bind(this);
    this.HandleAddPropCreate = this.HandleAddPropCreate.bind(this);
    this.handleAddEdge = this.handleAddEdge.bind(this);
    this.handleAddEdgeCreate = this.handleAddEdgeCreate.bind(this);
    this.handleAddEdgeClose = this.handleAddEdgeClose.bind(this);
    this.handleEvLinkSourceSelectRequest = this.handleEvLinkSourceSelectRequest.bind(this);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    UR.Sub('WINDOW:SIZE', this.UpdateDimensions);
    UR.Sub('DATA_UPDATED', this.HandleDataUpdate);
    UR.Sub('ADM_DATA_UPDATED', this.DoADMDataUpdate);
    UR.Sub('SELECTION_CHANGED', this.handleSelectionChange);
    UR.Sub('REQUEST_SELECT_EVLINK_SOURCE', this.handleEvLinkSourceSelectRequest);
    UR.Sub('STICKY:UPDATED', this.DoADMDataUpdate); // Broadcast when a group is added.
    this.state = {
      studentName: '',
      studentGroup: '',
      viewHeight: 0, // need to init this to prevent error with first render of informationList
      addPropOpen: false,
      addPropLabel: '',
      addPropPropId: '', // The prop Id of the component being edited, if new component then ''
      addPropIsProperty: false, // AddComponent dialog is adding a property (not a component)
      addEdgeOpen: false,
      addEdgeLabel: '',
      addEdgeSource: '', // Add Mech Dialog
      addEdgeTarget: '', // Add Mech Dialog
      componentIsSelected: false, // A component or property has been selected by user.  Used for pro-centric actions.
      mechIsSelected: false // A mechanism is slected by user.  Used for mech-centric actions.
    };

    // FIXME
    // Hack load in ADM data for now.  Eventually ADM will be loaded by system startup.
    ADM.Load();
  }

  componentDidMount() {
    console.log(`%ccomponentDidMount()`, cssreact);
    //
    // child components need to know the dimensions
    // of this component, but they are invalid until
    // the root component renders in SystemInit.
    // SystemInit fires `WINDOW:SIZE` to force the
    // relayout
  }

  componentWillUnmount() {
    UR.Unsub('WINDOW:SIZE', this.UpdateDimensions);
    UR.Unsub('DATA_UPDATED', this.HandleDataUpdate);
    UR.Unsub('SHOW_RESOURCE', this.handleResourceClick);
    UR.Unsub('SELECTION_CHANGED', this.handleSelectionChange);
    UR.Unsub('REQUEST_SELECT_EVLINK_SOURCE', this.handleEvLinkSourceSelectRequest);
  }

  // CODE REVIEW: THIS IS VESTIGIAL CODE
  // Force a screen redraw when evidence links are added
  // so that badges and quality ratings will draw
  HandleDataUpdate() {
    if (DBG) console.log(PKG, 'DATA_UPDATE');
    /*
      CODE REVIEW: originally this code called "forceupdate" methods via a "data
      update" handler, which called React.Component's forceUpdate method. But
      updating the SVGView isn't part of ReactComponent...it's an SVGView! I've
      removed all mention of this call because it's not necessary when the React
      rendering is setup for proper dataflow (e.g. use of ONLY state and props
      in the render() function)

      SVGView used to require a manual call to DoAppLoop(), but now it's hooked
      the DATA_UPDATED messages so it will redraw its view.
    */
  }

  DoADMDataUpdate() {
    this.setState({
      studentName: ADM.GetStudentName(),
      studentGroup: ADM.GetStudentGroupName()
    });
    // FIXME: This should update the model eventually.
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

  HandleAddPropLabelChange(e) {
    this.setState({ addPropLabel: e.target.value });
  }

  HandleAddEdgeDialogLabelChange(e) {
    this.setState({ addEdgeLabel: e.target.value });
  }

  // User clicked on "(+) Add Component" drawer button
  HandleComponentAdd() {
    if (DBG) console.log('Add!');
    this.setState({
      addPropOpen: true,
      addPropLabel: '', // clear the old property name
      addPropPropId: '', // new prop, so clear propId
      addPropIsProperty: false // adding component, not property
    });
  }

  // User selected component/prop and clicked on "(+) Add Property Button"
  HandlePropAdd() {
    this.setState({
      addPropOpen: true,
      addPropLabel: '', // clear the old property name
      addPropPropId: '', // new prop, so clear propId
      addPropIsProperty: true
    });
  }

  // User selected component/prop and clicked on "(/) Edit Component / Property" button
  HandlePropEdit() {
    let selectedPropIds = DATA.VM_SelectedProps();
    if (selectedPropIds.length > 0) {
      let propId = selectedPropIds[0];
      let prop = DATA.Prop(propId);
      this.setState({
        addPropOpen: true,
        addPropLabel: prop.name,
        addPropPropId: propId,
        addPropIsProperty: false
      });
    }
  }

  // User selected component/prop and clicked on "() Delete"
  HandlePropDelete() {
    let selectedPropIds = DATA.VM_SelectedProps();
    if (selectedPropIds.length > 0) {
      let propId = selectedPropIds[0];
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
    let selectedPropIds = DATA.VM_SelectedProps();
    if (selectedPropIds.length > 0) {
      let propId = selectedPropIds[0];
      UR.Publish('STICKY:OPEN', {
        parentId: propId,
        parentType: 'propmech',
        // FIXME: Set position according to parent prop?
        x: 600, // stickynote hack moves it by -325
        y: 100
      });
    }
  }

  // User selected mechanism and clicked on "(/) Edit Mechanism" button
  HandleMechEdit() {
    let selectedMechIds = DATA.VM_SelectedMechs();
    if (selectedMechIds.length > 0) {
      DATA.VM_DeselectAll(); // deselect so mech buttons disappear
      let mechId = selectedMechIds[0];
      let mech = DATA.Mech(mechId);
      let vw = mechId.split(':');
      this.setState({
        addEdgeOpen: true,
        addEdgeLabel: mech.name,
        addEdgeSource: vw[0],
        addEdgeTarget: vw[1]
      });
    }
  }

  // User selected component/prop and clicked on "() Delete"
  HandleMechDelete() {
    let selectedMechIds = DATA.VM_SelectedMechs();
    if (selectedMechIds.length > 0) {
      let mechId = selectedMechIds[0];
      DATA.PMC_MechDelete(mechId);
    }
    this.setState({
      mechIsSelected: false
    });
  }

  HandleAddPropClose() {
    if (DBG) console.log('close');
    this.setState({ addPropOpen: false });
  }

  HandleAddPropCreate() {
    if (DBG) console.log('create prop');
    if (this.state.addPropIsProperty) {
      // Add a property to the selected component
      let selectedPropIds = DATA.VM_SelectedProps();
      if (selectedPropIds.length > 0) {
        let parentPropId = selectedPropIds[0];
        if (DBG) console.log('...setting parent of', this.state.addPropLabel, 'to', parentPropId);
        // Create new prop
        DATA.PMC_AddProp(this.state.addPropLabel);
        // Add it to the parent component
        DATA.PMC_SetPropParent(this.state.addPropLabel, parentPropId);
      }
    } else if (this.state.addPropPropId !== '') {
      // Update existing prop
      let prop = DATA.Prop(this.state.addPropPropId);
      prop.name = this.state.addPropLabel;
      // IF YOU UPDATE THE MODEL THEN BUILD IT SO VIEW UPDATES
      // MOST PMCDATA MODEL METHODS CALLS THIS AUTOMATICALLY
      // BUT IN THIS CASE YOU'RE MUTATING THE PROP DIRECTLY
      DATA.BuildModel();
    } else {
      // Create new prop
      DATA.PMC_AddProp(this.state.addPropLabel);
    }
    this.HandleAddPropClose();
  }

  handleAddEdge() {
    if (DBG) console.log('Add!');
    // clear the label first
    document.getElementById('edgeLabel').value = '';
    this.setState({
      addEdgeOpen: true,
      addEdgeLabel: '',
      componentIsSelected: false // hide component edit buttons if they were visible
    });
  }

  handleAddEdgeCreate() {
    if (DBG) console.log('create edge');
    DATA.PMC_AddMech(this.state.addEdgeSource, this.state.addEdgeTarget, this.state.addEdgeLabel);
    this.handleAddEdgeClose();
  }

  handleAddEdgeClose() {
    if (DBG) console.log('close');
    this.setState({ addEdgeOpen: false });
  }

  /*/
   *  User wants to set the source on an EvidenceLink, so:
   *  1. Close the ResourceView if open,
   *  2. Show and expand the evidence
   *  3. Enable source selection on the Evidence Link
  /*/
  handleEvLinkSourceSelectRequest(urdata) {
    this.setState({ resourceViewOpen: false }, () => {
      UR.Publish('RESOURCES:COLLAPSE_ALL');
      UR.Publish('SHOW_EVIDENCE_LINK', { evId: urdata.evId, rsrcId: urdata.rsrcId });
      UR.Publish('EVLINK:ENABLE_SOURCE_SELECT', { evId: urdata.evId });
    });
  }

  handleSelectionChange() {
    let selectedPropIds = DATA.VM_SelectedProps();
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
    let selectedMechIds = DATA.VM_SelectedMechs();
    if (selectedMechIds.length === 1 && !this.state.addEdgeOpen) mechIsSelected = true;

    this.setState({
      addEdgeSource: sourceId,
      addEdgeTarget: targetId,
      componentIsSelected,
      mechIsSelected
    });
  }

  render() {
    const { classes } = this.props;

    const {
      studentName,
      studentGroup,
      addPropLabel,
      addPropPropId,
      componentIsSelected,
      mechIsSelected
    } = this.state;
    const resources = ADM.AllResources();
    return (
      <div className={classes.root}>
        <CssBaseline />
        <Login />
        <ModelSelect />
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar>
            <Switch>
              <Route path="/:mode" />
            </Switch>
            <TextField
              id="projectTitle"
              InputProps={{ className: classes.projectTitle }}
              style={{ flexGrow: 1 }}
              placeholder="Untitled Model"
            />
            <div className={classes.appBarRight}>
              <Button onClick={ADM.CloseModel}>Models</Button>
              &nbsp;|&nbsp;
              <div>{studentName}</div>
              &nbsp;:&nbsp;
              <div>{studentGroup}</div>
              &nbsp;|&nbsp;
              <Button onClick={ADM.Logout}>Logout</Button>
            </div>
          </Toolbar>
        </AppBar>

        {/* Left Tool Sidebar */}
        <Drawer
          className={classes.drawer}
          variant="permanent"
          classes={{
            paper: classes.drawerPaper
          }}
          anchor="left"
        >
          <div className={classes.toolbar} />
          <Divider />
          <Tooltip title="Add Component or Property">
            <Fab
              color="primary"
              aria-label="Add"
              className={classes.fab}
              onClick={this.HandleComponentAdd}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
          <Typography align="center" variant="caption">
            Add Component
          </Typography>
          <br />
          <Divider />
          {/*
            <List>
              {['CmdA', 'CmdB', 'CmdC', 'CmdD'].map((text, index) => (
                <ListItem button key={text}>
                  <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
                  <ListItemText primary={text} />
                </ListItem>
              ))}
            </List>
          */}
          <Tooltip title="Add Link">
            <Fab
              color="primary"
              aria-label="Add"
              className={ClassNames(classes.fab, classes.edgeButton)}
              onClick={this.handleAddEdge}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
          <Typography align="center" variant="caption">
            Add Mechanism
          </Typography>
        </Drawer>

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

          {/* Add Edge Dialog */}
          <Card className={classes.edgeDialog} hidden={!this.state.addEdgeOpen}>
            <Paper className={classes.edgeDialogPaper}>
              <div className={classes.edgeDialogWindowLabel}>ADD LINKS</div>
              <div className={classes.edgeDialogInput}>
                {this.state.addEdgeSource !== '' ? (
                  <div className={classes.evidenceLinkSourcePropAvatarSelected}>
                    {DATA.Prop(this.state.addEdgeSource).name}
                  </div>
                ) : (
                  <div className={classes.evidenceLinkSourceAvatarWaiting}>
                    1. Click on a source...
                  </div>
                )}
                &nbsp;
                <TextField
                  autoFocus
                  placeholder="link label"
                  margin="dense"
                  id="edgeLabel"
                  label="Label"
                  value={this.state.addEdgeLabel}
                  onChange={this.HandleAddEdgeDialogLabelChange}
                  className={classes.edgeDialogTextField}
                />
                &nbsp;
                {this.state.addEdgeTarget !== '' ? (
                  <div className={classes.evidenceLinkSourcePropAvatarSelected}>
                    {DATA.Prop(this.state.addEdgeTarget).name}
                  </div>
                ) : (
                  <div className={classes.evidenceLinkSourceAvatarWaiting}>
                    2. Click on a target...
                  </div>
                )}
                <div style={{ flexGrow: '1' }} />
                <Button onClick={this.handleAddEdgeClose} color="primary">
                  Cancel
                </Button>
                <Button
                  onClick={this.handleAddEdgeCreate}
                  color="primary"
                  variant="contained"
                  disabled={this.state.addEdgeSource === '' || this.state.addEdgeTarget === ''}
                >
                  Create
                </Button>
              </div>
            </Paper>
          </Card>
        </main>

        {/* Resource Library */}
        <div style={{ height: this.state.viewHeight + 64, overflowY: 'scroll', zIndex: 1250 }}>
          <Paper className={classes.informationList}>
            <div className={classes.resourceListLabel}>RESOURCE LIBRARY</div>
            <List dense>
              {resources.map(resource => (
                <ResourceItem key={resource.rsrcId} resource={resource} />
              ))}
            </List>
          </Paper>
        </div>

        {/* Resource View */}
        <ResourceView />

        {/* Component/Mech label editing dialog */}
        <Dialog
          open={this.state.addPropOpen}
          onClose={this.HandleAddPropClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Add Component/Property</DialogTitle>
          <DialogContent>
            <DialogContentText>Type a name for your component or property.</DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="propLabel"
              label="Label"
              fullWidth
              onChange={this.HandleAddPropLabelChange}
              value={addPropLabel}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.HandleAddPropClose} color="primary">
              Cancel
            </Button>
            <Button onClick={this.HandleAddPropCreate} color="primary">
              {addPropPropId === '' ? 'Create' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Component/Mech add/edit/delete buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-evenly',
            position: 'absolute',
            left: '100px',
            right: '300px',
            bottom: '20px'
          }}
        >
          <Fab
            hidden={!(componentIsSelected || mechIsSelected)}
            onClick={componentIsSelected ? this.HandlePropDelete : this.HandleMechDelete}
            color="secondary"
            variant="extended"
            size="small"
          >
            <DeleteRoundedIcon />
            &nbsp;&nbsp;Delete&nbsp;
          </Fab>
          <Fab
            hidden={!(componentIsSelected || mechIsSelected)}
            onClick={componentIsSelected ? this.HandlePropEdit : this.HandleMechEdit}
            color="primary"
            variant="extended"
          >
            <EditIcon />
            &nbsp;&nbsp;Edit {componentIsSelected ? 'Component / Property' : 'Mechanism'}
          </Fab>
          <Fab
            hidden={!componentIsSelected}
            onClick={this.HandlePropAdd}
            color="primary"
            variant="extended"
          >
            <AddIcon /> Add property
          </Fab>
          <Fab
            hidden={!componentIsSelected}
            onClick={this.OnAddComment}
            color="primary"
            variant="extended"
          >
            <ChatBubbleOutlineIcon />
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
/// required for UR EXEC phase filtering by view path
ViewMain.URMOD = __dirname;
UR.EXEC.Hook(
  'INITIALIZE',
  () => {
    console.log(`ViewMain UR.EXEC.Hook('INITIALIZE')`);
  },
  __dirname
);
/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(MEMEStyles)(ViewMain);
