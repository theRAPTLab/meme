/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ToolsPanel - Left sidebar in Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import ClassNames from 'classnames';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Material UI Elements
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Fab from '@material-ui/core/Fab';
import Tooltip from '@material-ui/core/Tooltip';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddIcon from '@material-ui/icons/Add';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
// MEME Modules and Utils
import MEMEStyles from '../../components/MEMEStyles';
import UR from '../../../system/ursys';
import DATA from '../../modules/pmc-data';
import ADM from '../../modules/adm-data';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'ToolsPanel:';

// Customized TreeItem Component with smaller font
const SmallTreeItem = withStyles(theme => ({
  iconContainer: {
    width: '16px'
  },
  label: {
    fontSize: '11px'
  }
}))(props => <TreeItem {...props} />);

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ToolsPanel extends React.Component {
  // constructor
  constructor(props) {
    super(props);

    this.DoSelectionChange = this.DoSelectionChange.bind(this);
    this.OnComponentAdd = this.OnComponentAdd.bind(this);
    this.OnMechAdd = this.OnMechAdd.bind(this);
    this.RenderComponentsList = this.RenderComponentsList.bind(this);
    this.RenderComponentsListItem = this.RenderComponentsListItem.bind(this);
    this.RenderMechanismsList = this.RenderMechanismsList.bind(this);

    this.state = {
      selectedPropId: '',
      selectedMechId: ''
    };

    UR.Subscribe('SELECTION_CHANGED', this.DoSelectionChange);
  }

  componentDidMount() {}

  componentWillUnmount() {
    UR.Unsubscribe('SELECTION_CHANGED', this.DoSelectionChange);
  }

  DoSelectionChange() {
    let selectedPropId = '';
    let selectedMechId = {};
    let selectedPropIds = DATA.VM_SelectedPropsIds();
    // only show the first selected prop
    if (selectedPropIds.length > 0) {
      selectedPropId = selectedPropIds[0];
    }

    let selectedMechIds = DATA.VM_SelectedMechIds();
    if (selectedMechIds.length > 0) {
      const mechIdArray = selectedMechIds[0].split(':');
      selectedMechId.v = mechIdArray[0];
      selectedMechId.w = mechIdArray[1];
    }
    this.setState({
      selectedPropId,
      selectedMechId
    });
  }

  // User clicked on "(+) Add Component" drawer button
  OnComponentAdd() {
    UR.Publish('PROP_ADD');
  }

  // User clicked on "(+) Add Mechanism" drawer button
  OnMechAdd() {
    UR.Publish('MECH_ADD');
  }

  OnPropClick(e, propId) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      selectedPropId: propId,
      selectedMechId: ''
    });
    const vprop = DATA.VM_VProp(propId);
    DATA.VM_DeselectAll();
    DATA.VM_SelectProp(vprop);
  }

  OnMechClick(e, mechId) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      selectedPropId: '',
      selectedMechId: mechId
    });
    const vmech = DATA.VM_VMech(mechId);
    DATA.VM_DeselectAll();
    DATA.VM_SelectOneMech(vmech);
  }

  RenderComponentsList(propIds) {
    return propIds.map(propId => {
      return this.RenderComponentsListItem(propId);
    });
  }

  // This supports recursive calls to handle nested components.
  RenderComponentsListItem(propId, isSub = false) {
    const { selectedPropId } = this.state;
    const { classes } = this.props;
    const prop = DATA.Prop(propId);
    const children = DATA.Children(propId);
    return (
      <div
        key={propId}
        className={ClassNames(
          classes.treeItem,
          isSub ? classes.treeSubPropItem : classes.treePropItem,
          selectedPropId === propId ? classes.treeItemSelected : ''
        )}
        onClick={e => this.OnPropClick(e, propId)}
      >
        {prop.name}
        {children.length > 0
          ? children.map(childId => this.RenderComponentsListItem(childId, true))
          : ''}
      </div>
    );
  }

  RenderMechanismsList(mechIds) {
    const { selectedMechId } = this.state;
    const { classes } = this.props;
    let i = 0;
    return mechIds.map(mechId => {
      const mech = DATA.Mech(mechId);
      const source = DATA.Prop(mechId.v).name;
      const target = DATA.Prop(mechId.w).name;
      i++;
      return (
        <div
          key={`mech${i}`}
          className={ClassNames(
            classes.treeItem,
            classes.treeMechItem,
            selectedMechId.v === mechId.v && selectedMechId.w === mechId.w ? classes.treeItemSelected : ''
          )}
          onClick={e => this.OnMechClick(e, mechId)}
        >
          <span className={classes.treePropItemColor}>{source} </span>
          {mech.name}
          <span className={classes.treePropItemColor}> {target}</span>
        </div>
      );
    });
  }

  render() {
    const { classes, isDisabled } = this.props;

    const componentsList = this.RenderComponentsList(DATA.Components());
    const mechanismsList = this.RenderMechanismsList(DATA.AllMechs());
    return (
      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper
        }}
        anchor="left"
      >
        <div className={classes.toolbar} />
        <TreeView
          defaultExpanded={['components']}
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          className={classes.treeView}
        >
          <SmallTreeItem nodeId={'components'} label="COMPONENTS">
            {componentsList}
          </SmallTreeItem>
        </TreeView>
        <Tooltip title="Add Component or Property">
          <Fab
            color="primary"
            aria-label="Add"
            className={classes.fab}
            onClick={this.OnComponentAdd}
            disabled={isDisabled}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
        <Typography align="center" variant="caption" style={{ fontSize: '10px' }}>
          ADD COMPONENT
        </Typography>
        <br />
        <Divider />
        <Divider style={{ marginBottom: '20px' }} />
        <TreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          className={classes.treeView}
        >
          <SmallTreeItem nodeId={'mechanisms'} label="MECHANISMS">
            {mechanismsList}
          </SmallTreeItem>
        </TreeView>
        <Tooltip title="Add Mechanism">
          <Fab
            color="primary"
            aria-label="Add"
            className={ClassNames(classes.fab, classes.edgeButton)}
            onClick={this.OnMechAdd}
            disabled={isDisabled}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
        <Typography align="center" variant="caption" style={{ fontSize: '10px' }}>
          ADD MECHANISM
        </Typography>
      </Drawer>
    );
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// default props are expect properties that we expect
/// and are declared for validation
ToolsPanel.defaultProps = {
  classes: {},
  isDisabled: false
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// propTypes are declared. Note "vague" propstypes are
/// disallowed by eslint, so use shape({prop: ProtType })
/// to describe them in more detail
ToolsPanel.propTypes = {
  classes: PropTypes.shape({}),
  isDisabled: PropTypes.bool
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// requirement for UR MODULES and COMPONENTS
ToolsPanel.MOD_ID = __dirname;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(MEMEStyles)(ToolsPanel);
