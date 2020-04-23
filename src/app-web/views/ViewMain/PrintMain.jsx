/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ViewMain - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
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
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import DeleteRoundedIcon from '@material-ui/icons/DeleteRounded';
import EditIcon from '@material-ui/icons/Edit';
import MenuIcon from '@material-ui/icons/Menu';
import ZoomInMapIcon from '@material-ui/icons/CenterFocusWeak';
import ZoomOutMapIcon from '@material-ui/icons/ZoomOutMap';
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
import ASET from '../../modules/adm-settings';
import { cssreact, cssdraw, cssalert } from '../../modules/console-styles';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'PrintMain:';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PrintMain extends React.Component {
  // constructor
  constructor(props) {
    super(props);
    UR.ReactPreflight(PrintMain, module);
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
    this.OnCloseModel = this.OnCloseModel.bind(this);
    this.OnLogout = this.OnLogout.bind(this);

    // Print
    this.RenderComponentsList = this.RenderComponentsList.bind(this);
    this.RenderComponentsListItem = this.RenderComponentsListItem.bind(this);

    UR.Subscribe('WINDOW_SIZE', this.UpdateDimensions);
    UR.Subscribe('DATA_UPDATED', this.DoDataUpdate);
    UR.Subscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate);
    UR.Subscribe('MODEL_VIEW_UPDATED', this.DoZoomOut);
    this.state = {
      title: '',
      modelId: '',
      modelAuthorGroupName: '',
      isModelAuthor: true,
      studentId: '',
      studentName: '',
      studentGroup: '',
      viewHeight: 0 // need to init this to prevent error with first render of resourceList
    };
  }

  componentDidMount() {
    // if (DBG) console.log(`%ccomponentDidMount()`, cssreact);
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
    UR.Unsubscribe('MODEL_VIEW_UPDATED', this.DoZoomOut);
  }

  DoZoomOut() {
    UR.Publish('SVG_PANZOOM_OUT');
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

  OnCloseModel() {
    UR.Publish('STICKY_CLOSE');
    UR.Publish('RATING_CLOSE');
    ADM.CloseModel();
  }

  OnLogout() {
    UR.Publish('STICKY_CLOSE');
    UR.Publish('RATING_CLOSE');
    ADM.Logout();
  }

  /// PRINTING  /////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  RenderComponentsList(propIds) {
    return propIds.map(propId => {
      return this.RenderComponentsListItem(propId);
    });
  }

  RenderComponentsListItem(propId, isSub = false) {
    const { selectedPropId, hoveredPropId } = this.state;
    const { classes } = this.props;
    const prop = DATA.Prop(propId);
    if (prop === undefined) {
      // Catch error if a component has not been correctly deleted, so a mech
      // is left with a stray propId.
      console.error('ToolsPanel.RenderComponentsListItem skipping missing propId', propId);
      return '';
    }
    const children = DATA.Children(propId);
    return (
      <div key={propId} style={{ marginLeft: isSub ? '25px' : '10px' }}>
        <div>LABEL: {prop.name}</div>
        <div>DESCRIPTION: {prop.description}</div>
        <br />
        {children.length > 0
          ? children.map(childId => this.RenderComponentsListItem(childId, true))
          : ''}
      </div>
    );
  }

  RenderMechanismsList(mechIds) {
    const { selectedMechId, hoveredMechId } = this.state;
    const { classes } = this.props;
    let i = 0;
    return mechIds.map(mechId => {
      const mech = DATA.Mech(mechId);
      const sourceObj = DATA.Prop(mechId.v);
      const targetObj = DATA.Prop(mechId.w);
      // protect against corrupt data
      const source = sourceObj ? sourceObj.name : 'missing prop';
      const target = targetObj ? targetObj.name : 'missing prop';
      i++;
      return (
        <div
          key={`mech${i}`}
          style={{ marginLeft: '10px' }}
        >
          <div>SOURCE: {source}</div>
          <div>TARGET: {target}</div>
          <div>LABEL: {mech.name}</div>
          <br />
        </div>
      );
    });
  }

  RenderComment(comment, index) {
    const date = new Date(comment.date);
    const timestring = date.toLocaleTimeString('en-Us', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const datestring = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    return (
      <div key={index}>
        <br />
        <div>AUTHOR: {comment.author}</div>
        <div>DATE: {timestring} {datestring}</div>
        <div>COMMENT: {comment.text}</div>
        <div>CRITERIA: {comment.criteriaId}</div>
      </div>
    );
  }

  RenderComments(refId) {
    const comments = DATA.GetComments(refId);
    return <div>COMMENTS: {comments.map((comment, i) => this.RenderComment(comment, i))}</div>;
  }

  RenderEvidence(evlink, index) {
    const { id, rsrcId, propId, mechId, imageURL, note, rating, why, numberLabel } = evlink;
    let sourceType;
    let sourceLabel;
    if (propId !== undefined && propId !== null && DATA.HasProp(propId) && DATA.Prop(propId)) {
      sourceType = 'prop';
      sourceLabel = DATA.Prop(propId).name;
    } else if (mechId !== undefined && mechId !== null && DATA.Mech(mechId)) {
      sourceType = 'mech';
      sourceLabel = DATA.Mech(mechId).name;
    } else {
      sourceType = 'missing source Type';
      sourceLabel = 'missing source Label';
    }

    return (
      <div key={index}>
        <div style={{ fontWeight: 'bold' }}>Evidence {numberLabel}</div>
        <div>DESCRIPTION: {note}</div>
        <div>TARGET: {sourceType}/{sourceLabel}</div>
        <div>RATING: {rating}</div>
        <div>WHY: {why}</div>
        <div>SCREENSHOT: {imageURL}</div>
        <br />
        {this.RenderComments(id)}
        <br />
      </div>
    );
  }

  RenderEvidenceLinks(resourceId) {
    const evLinks = DATA.GetEvLinksByResourceId(resourceId);
    if (evLinks === undefined || evLinks.length < 1)
      return (
        <div>
          No evidence
          <br />
          <br />
        </div>
      );
    return (
      <div key={this.props.rsrcId}>
        {evLinks.map((evlink, index) => this.RenderEvidence(evlink, index))}
      </div>
    );
  }

  RenderResourceList(resources) {
    return resources.map(resource => {
      const evidence = this.RenderEvidenceLinks(resource.id);
      // Notes for evidence are saved as comments
      const noteRefId = `res${resource.id}`;
      const notes = DATA.GetComments(noteRefId);
      let noteText = '';
      if (notes.length > 0) {
        noteText = notes[0].text;
      }
      return (
        <div key={resource.id}>
          <h5>
            ({resource.id}) {resource.label}
          </h5>
          <div>NOTES: {noteText}</div>
          <br />
          {evidence}
        </div>
      );
    });
  }

  /// RENDER  ////////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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

    // we need to use the model author here, not the currently logged in student.
    const model = ADM.GetModelById(modelId);
    const classroomId = model ? ADM.GetClassroomIdByGroup(model.groupId) : '';
    const resources = classroomId !== '' ? ADM.GetResourcesForClassroom(classroomId) : [];

    const isViewOnly = ADM.IsViewOnly();

    // print
    const componentsList = this.RenderComponentsList(DATA.Components());
    const mechanismsList = this.RenderMechanismsList(DATA.AllMechs());
    const resourcesList = this.RenderResourceList(resources);

    return (
      <div className={classes.root}>
        <CssBaseline />
        <Login />
        <ModelSelect />
        <AppBar
          position="fixed"
          className={classes.appBar}
          style={{ left: '0px', marginLeft: '0px' }}
          color={isModelAuthor ? 'primary' : 'default'}
        >
          <Toolbar>
            <Switch>
              <Route path="/:mode" />
            </Switch>
            <Button onClick={this.OnCloseModel} color="inherit">
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
              <Button onClick={this.OnCloseModel} color="inherit">
                <div>{studentName}</div>
                &nbsp;:&nbsp;
                <div>{studentGroup}</div>
              </Button>
              &nbsp;&nbsp; &nbsp;&nbsp;
            </div>
          </Toolbar>
        </AppBar>

        {/* Left Tool Sidebar */}
        <Drawer
          className={classes.drawer}
          variant="permanent"
          anchor="left"
          style={{ width: '5px' }}
        ></Drawer>

        <main className={classes.content} ref={this.refMain}>
          <div className={classes.toolbar} ref={this.refToolbar} />
          <div
            className={classes.view}
            ref={this.refView}
            style={{ height: this.state.viewHeight }}
          >
            <Switch>
              {/* Do we implement print as a mode?
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
              */}
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

          <div
            style={{
              margin: '10px'
            }}
          >
            <h3>Model: {title}</h3>
            {this.RenderComments(modelId)}
            <br />

            <h3>Components</h3>
            {componentsList}

            <h3>Mechanisms</h3>
            {mechanismsList}

            <h3>Resource Library</h3>
            {resourcesList}
          </div>
        </main>
      </div>
    );
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// default props are expect properties that we expect
/// and are declared for validation
PrintMain.defaultProps = {
  classes: {}
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// propTypes are declared. Note "vague" propstypes are
/// disallowed by eslint, so use shape({prop: ProtType })
/// to describe them in more detail
PrintMain.propTypes = {
  classes: PropTypes.shape({})
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// requirement for UR MODULES and COMPONENTS
PrintMain.MOD_ID = __dirname;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(MEMEStyles)(PrintMain);
