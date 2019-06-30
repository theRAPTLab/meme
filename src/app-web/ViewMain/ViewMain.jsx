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
import Avatar from '@material-ui/core/Avatar';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import Modal from '@material-ui/core/Modal';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Chip from '@material-ui/core/Chip';
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
import DeleteRoundedIcon from '@material-ui/icons/DeleteRounded';
import DescriptionIcon from '@material-ui/icons/Description';
import EditIcon from '@material-ui/icons/Edit';
import ImageIcon from '@material-ui/icons/Image';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import RoutedView from './RoutedView';
import MEMEStyles from '../components/MEMEStyles';
import UR from '../../system/ursys';
import DATA from '../modules/pmc-data';
import EvidenceList from '../components/EvidenceList';
import ResourceItem from '../components/ResourceItem';
import { cssreact, cssdraw } from '../modules/console-styles';

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
    this.displayName = this.constructor.name;
    this.refMain = React.createRef();
    this.refToolbar = React.createRef();
    this.refView = React.createRef();
    this.refDrawer = React.createRef();
    this.state = { viewHeight: 0, viewWidth: 0 };
    this.HandleDataUpdate = this.HandleDataUpdate.bind(this);
    this.HandleForceUpdate = this.HandleForceUpdate.bind(this);
    this.UpdateDimensions = this.UpdateDimensions.bind(this);
    this.HandleAddPropLabelChange = this.HandleAddPropLabelChange.bind(this);
    this.HandleAddEdgeDialogLabelChange = this.HandleAddEdgeDialogLabelChange.bind(this);
    this.HandlePropAdd = this.HandlePropAdd.bind(this);
    this.HandlePropDelete = this.HandlePropDelete.bind(this);
    this.HandleMechDelete = this.HandleMechDelete.bind(this);
    this.HandlePropEdit = this.HandlePropEdit.bind(this);
    this.HandleMechEdit = this.HandleMechEdit.bind(this);
    this.HandleComponentAdd = this.HandleComponentAdd.bind(this);
    this.HandleAddPropClose = this.HandleAddPropClose.bind(this);
    this.HandleAddPropCreate = this.HandleAddPropCreate.bind(this);
    this.handleAddEdge = this.handleAddEdge.bind(this);
    this.handleAddEdgeCreate = this.handleAddEdgeCreate.bind(this);
    this.handleAddEdgeClose = this.handleAddEdgeClose.bind(this);
    this.handleResourceClick = this.handleResourceClick.bind(this);
    this.handleInformationViewClose = this.handleInformationViewClose.bind(this);
    this.handleEvLinkSourceSelectRequest = this.handleEvLinkSourceSelectRequest.bind(this);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.handleSnapshot = this.handleSnapshot.bind(this);
    UR.Sub('WINDOW:SIZE', this.UpdateDimensions);
    UR.Sub('DATA_UPDATED', this.HandleDataUpdate);
    UR.Sub('FORCE_UPDATE', this.HandleForceUpdate);
    UR.Sub('SHOW_RESOURCE', this.handleResourceClick);
    UR.Sub('SELECTION_CHANGED', this.handleSelectionChange);
    UR.Sub('REQUEST_SELECT_EVLINK_SOURCE', this.handleEvLinkSourceSelectRequest);
    this.state = {
      viewHeight: 0, // need to init this to prevent error with first render of informationList
      addPropOpen: false,
      addPropLabel: '',
      addPropPropId: '', // The prop Id of the component being edited, if new component then ''
      addPropIsProperty: false, // AddComponent dialog is adding a property (not a component)
      addEdgeOpen: false,
      addEdgeLabel: '',
      addEdgeSource: '', // Add Mech Dialog
      addEdgeTarget: '', // Add Mech Dialog
      resourceViewOpen: false,
      componentIsSelected: false, // A component or property has been selected by user.  Used for pro-centric actions.
      mechIsSelected: false, // A mechanism is slected by user.  Used for mech-centric actions.
      selectedResource: {
        id: '',
        evid: '',
        label: 'Unselected',
        notes: [],
        type: '',
        url: '',
        links: -1
      }
    };
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
    UR.Unsub('FORCE_UPDATE', this.HandleForceUpdate);
    UR.Unsub('SHOW_RESOURCE', this.handleResourceClick);
    UR.Unsub('SELECTION_CHANGED', this.handleSelectionChange);
    UR.Unsub('REQUEST_SELECT_EVLINK_SOURCE', this.handleEvLinkSourceSelectRequest);
  }

  // Force update to redraw evidence link badges and quality ratings
  HandleForceUpdate() {
    if (DBG) console.log(PKG, 'FORCE_UPDATE');
    this.forceUpdate();
  }

  // Force a screen redraw when evidence links are added
  // so that badges and quality ratings will draw
  HandleDataUpdate() {
    if (DBG) console.log(PKG, 'DATA_UPDATE');
    this.HandleForceUpdate();
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
    this.setState(
      {
        viewWidth: Math.min(viewWidth, innerWidth),
        viewHeight: Math.min(viewHeight, innerHeight)
      },
      () => {
        // Force screen to redraw after setting size.
        // Also forces badge redraw
        // debug: this seems like a hack, so removing it to see
        // what the issue is
        // this.HandleForceUpdate();
      }
    );
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
    }
    this.setState({
      componentIsSelected: false
    });
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
        DATA.PMC_AddPropParent(this.state.addPropLabel, parentPropId);
      }
    } else if (this.state.addPropPropId !== '') {
      // Update existing prop
      let prop = DATA.Prop(this.state.addPropPropId);
      prop.name = this.state.addPropLabel;
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

  handleResourceClick(urdata) {
    if (DBG) console.log('ViewMain: clicked on ', urdata.rsrcId);
    // Look up resource
    let selectedResource = DATA.Resource(urdata.rsrcId);
    if (selectedResource) {
      this.setState({
        resourceViewOpen: true,
        selectedResource
      });
    } else {
      console.error('ViewMain: Could not find selected resource id', urdata.rsrcId);
    }
  }

  handleInformationViewClose() {
    this.setState({ resourceViewOpen: false });
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

  handleSnapshot(rsrcId) {
    if (DBG) console.log(PKG, 'create new evidence:', rsrcId);
    let evId = DATA.PMC_AddEvidenceLink(rsrcId);
    UR.Publish('SHOW_EVIDENCE_LINK', { evId, rsrcId });
  }

  render() {
    const { classes } = this.props;
    const { addPropLabel, addPropPropId, componentIsSelected, mechIsSelected } = this.state;
    const resources = DATA.AllResources();
    return (
      <div className={classes.root}>
        <CssBaseline />
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar>
            <Switch>
              <Route
                path="/:mode"
                render={props => (
                  <div style={{ fontFamily: 'monospace', margin: '0 10px 4px 0' }}>
                    MODE:{props.match.params.mode.toUpperCase()}
                  </div>
                )}
              />
            </Switch>
            <TextField
              id="projectTitle"
              InputProps={{ className: classes.projectTitle }}
              placeholder="Untitled Project"
            />
          </Toolbar>
        </AppBar>

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
        <Modal
          className={classes.resourceView}
          disableBackdropClick={false}
          hideBackdrop={false}
          open={this.state.resourceViewOpen}
          onClose={this.handleInformationViewClose}
        >
          <Paper className={classes.resourceViewPaper}>
            <div className={classes.resourceViewTitle}>
              <div className={classes.resourceViewWindowLabel}>RESOURCE VIEW</div>
              <Avatar className={classes.resourceViewAvatar}>
                {this.state.selectedResource.referenceLabel}
              </Avatar>
              &nbsp;
              <div style={{ flexGrow: 1 }}>{this.state.selectedResource.label}</div>
              <Card className={classes.resourceViewCard}>
                <CardContent className={classes.resourceViewCardContent}>
                  <Typography variant="overline">Notes:&nbsp;</Typography>
                  <Typography variant="body2">{this.state.selectedResource.notes}</Typography>
                </CardContent>
              </Card>
              <Card className={classes.resourceViewCard}>
                <CardContent className={classes.resourceViewCardContent}>
                  <Typography variant="overline">Type:&nbsp;</Typography>
                  <Typography variant="body2">
                    {this.state.selectedResource.type}{' '}
                    {this.state.selectedResource.type === 'simulation' ? (
                      <ImageIcon />
                    ) : (
                      <DescriptionIcon />
                    )}
                  </Typography>
                </CardContent>
              </Card>
              <Card className={classes.resourceViewCard}>
                <CardContent className={classes.resourceViewCardContent}>
                  <Typography variant="overline">Links:&nbsp;</Typography>
                  <Chip
                    className={classes.resourceViewLinksBadge}
                    label={this.state.selectedResource.links}
                    color="primary"
                  />
                </CardContent>
              </Card>
              <Button
                className={classes.evidenceCloseBtn}
                onClick={this.handleInformationViewClose}
                color="primary"
              >
                Close
              </Button>
            </div>
            <iframe
              src={this.state.selectedResource.url}
              width="1000"
              height="90%"
              title="resource"
            />
            <div className={classes.resourceViewSidebar}>
              <TextField
                id="informationNote"
                label="Our Notes"
                placeholder="We noticed..."
                multiline
                rows="5"
                className={classes.resourceViewNote}
                margin="normal"
                variant="outlined"
              />
              <Typography variant="caption">OUR EVIDENCE LIST</Typography>
              <div className={classes.resourceViewSidebarEvidenceList}>
                <EvidenceList rsrcId={this.state.selectedResource.rsrcId} />
              </div>
              <Button
                className={classes.resourceViewCreatebutton}
                variant="contained"
                onClick={() => this.handleSnapshot(this.state.selectedResource.rsrcId)}
                color="primary"
              >
                Create Evidence
              </Button>
            </div>
          </Paper>
        </Modal>

        {/* Add Prop Dialog */}
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

        {/* Component Editing */}
        <Fab
          hidden={!(componentIsSelected || mechIsSelected)}
          onClick={componentIsSelected ? this.HandlePropDelete : this.HandleMechDelete}
          className={classes.propertyDeleteButton}
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
          className={classes.propertyEditButton}
          color="primary"
          variant="extended"
        >
          <EditIcon />
          &nbsp;&nbsp;Edit {componentIsSelected ? 'Component / Property' : 'Mechanism'}
        </Fab>
        <Fab
          hidden={!componentIsSelected}
          onClick={this.HandlePropAdd}
          className={classes.propertyAddButton}
          color="primary"
          variant="extended"
        >
          <AddIcon /> Add property
        </Fab>
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

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(MEMEStyles)(ViewMain);
