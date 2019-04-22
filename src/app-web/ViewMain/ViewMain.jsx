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
import Badge from '@material-ui/core/Badge';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
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
import AddIcon from '@material-ui/icons/Add';
import DescriptionIcon from '@material-ui/icons/Description';
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
import { cssblue, cssreact, cssdraw } from '../modules/console-styles';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

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
    this.UpdateDimensions = this.UpdateDimensions.bind(this);
    this.handleAddProp = this.handleAddProp.bind(this);
    this.handleAddPropCreate = this.handleAddPropCreate.bind(this);
    this.handleAddPropClose = this.handleAddPropClose.bind(this);
    this.handleAddEdge = this.handleAddEdge.bind(this);
    this.handleAddEdgeCreate = this.handleAddEdgeCreate.bind(this);
    this.handleAddEdgeClose = this.handleAddEdgeClose.bind(this);
    this.handleEvidenceClick = this.handleEvidenceClick.bind(this);
    this.handleEvidenceDialogClose = this.handleEvidenceDialogClose.bind(this);
    UR.Sub('WINDOW:SIZE', this.UpdateDimensions);
    this.state = {
      addPropOpen: false,
      addEdgeOpen: false,
      evidenceDialogOpen: false,
      edgeSource: 'Source',
      edgeTarget: 'Target',
      evidenceList: [
        {
          id: 'ev0',
          evid: '1',
          label: 'Food Rot Simulation',
          keyvars: ['water quality', 'food rotting'],
          type: 'simulation',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 0
          url: '../static/FishSpawn_Sim_5_SEEDS_v7.html',
          links: 2
        },
        {
          id: 'ev1',
          evid: '2',
          label: 'Autopsy Report',
          keyvars: ['physical damage'],
          type: 'report',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 0
        },
        {
          id: 'ev2',
          evid: '3',
          label: 'Ammonia and Food Experiment',
          keyvars: ['water quality', 'ammonia'],
          type: 'report',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 1
        },
        {
          id: 'ev3',
          evid: '4',
          label: 'Fish in a Tank Simulation',
          keyvars: ['water quality', 'fish population'],
          type: 'simulation',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 3
        },
        {
          id: 'ev4',
          evid: '5',
          label: 'Measuring Ammonia Experiment',
          keyvars: ['water quality', 'ammonia'],
          type: 'report',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 0
        },
        {
          id: 'ev5',
          evid: '6',
          label: 'Fish Fighting Simulation',
          keyvars: ['fish agression'],
          type: 'simulation',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 0
        },
        {
          id: 'ev6',
          evid: '7',
          label: 'Fish Fighting Simulation',
          keyvars: ['fish agression'],
          type: 'simulation',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 1
        },
        {
          id: 'ev7',
          evid: '8',
          label: 'Fish Fighting Simulation',
          keyvars: ['fish agression'],
          type: 'simulation',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 0
        },
        {
          id: 'ev8',
          evid: '9',
          label: 'Fish Fighting Simulation',
          keyvars: ['fish agression'],
          type: 'simulation',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 0
        },
        {
          id: 'ev9',
          evid: '10',
          label: 'Fish Fighting Simulation',
          keyvars: ['fish agression'],
          type: 'simulation',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 0
        },
        {
          id: 'ev10',
          evid: '11',
          label: 'Fish Fighting Simulation',
          keyvars: ['fish agression'],
          type: 'simulation',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 0
        },
        {
          id: 'ev11',
          evid: '12',
          label: 'Fish Fighting Simulation',
          keyvars: ['fish agression'],
          type: 'simulation',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 0
        },
        {
          id: 'ev12',
          evid: '13',
          label: 'Fish Fighting Simulation',
          keyvars: ['fish agression'],
          type: 'simulation',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 0
        },
        {
          id: 'ev13',
          evid: '14',
          label: 'Fish Fighting Simulation',
          keyvars: 'fish agression',
          type: 'simulation',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 0
        },
        {
          id: 'ev15',
          evid: '16',
          label: 'Fish Fighting Simulation',
          keyvars: 'fish agression',
          type: 'simulation',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 0
        },
        {
          id: 'ev16',
          evid: '17',
          label: 'Fish Fighting Simulation',
          keyvars: 'fish agression',
          type: 'simulation',
          url: 'https://netlogoweb.org/launch#https://netlogoweb.org/assets/modelslib/Sample%20Models/Biology/BeeSmart%20Hive%20Finding.nlogo',
          links: 0
        },
      ],
      selectedEvidence: {
        id: '',
        evid: '',
        label: 'Unselected',
        keyvars: [],
        type: '',
        url: '',
        links: -1
      }
    }
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

  UpdateDimensions() {
    /*/
    NOTE: Material UI uses FlexBox
    we can insert a CSSGRID into here eventually
    /*/
    if (DBG) {
      console.clear();
      console.info('WINDOW RESIZE');
    }
    this.viewRect = this.refMain.current.getBoundingClientRect();
    this.toolRect = this.refToolbar.current.getBoundingClientRect();
    // NOTE: viewWidth/viewHeigg
    const viewWidth = this.viewRect.width;
    const viewHeight = this.viewRect.height - this.toolRect.height;
    const innerWidth = window.innerWidth - MEMEStyles.DRAWER_WIDTH;
    const innerHeight = window.innerHeight - this.toolRect.height;

    this.setState({
      viewWidth: Math.min(viewWidth, innerWidth),
      viewHeight: Math.min(viewHeight, innerHeight)
    });
  }

  handleAddProp() {
    console.log('Add!');
    this.setState({ addPropOpen: true });
  }

  handleAddPropCreate() {
    console.log('create');
    let label = document.getElementById('propLabel').value;
    DATA.PMC_add(label);
    this.handleAddPropClose();
  }

  handleAddPropClose() {
    console.log('close');
    this.setState({ addPropOpen: false });
  }

  handleAddEdge() {
    console.log('Add!');
    this.setState({ addEdgeOpen: true });
  }

  handleAddEdgeCreate() {
    console.log('create');
    let label = document.getElementById('propLabel').value;
    DATA.PMC_add(label);
    this.handleAddPropClose();
  }

  handleAddEdgeClose() {
    console.log('close');
    this.setState({ addEdgeOpen: false });
  }

  handleSetEdgeSource() {
    console.log('handleSetEdgeSource');
    UR.Sub('WINDOW:SIZE', this.UpdateDimensions);

  }

  handleSetEdgeTarget() {
    console.log('handleSetEdgeTarget');
  }

  handleEvidenceClick(id) {
    console.log('clicked on ', id);
    // Look up evidence
    let selectedEvidence = this.state.evidenceList.find((item) => { return item.id === id });
    if (selectedEvidence) {
      this.setState({
        evidenceDialogOpen: true,
        selectedEvidence: selectedEvidence
      });      
    } else {
      console.error('ViewMain: Could not find selected evidence id', id);
    }
  }
  
  handleEvidenceDialogClose() {
    this.setState({ evidenceDialogOpen: false });
  }
  
  render() {
    const { classes } = this.props;
    if (DBG)
      console.log(`%crender() size ${this.state.viewWidth}x${this.state.viewHeight}`, cssreact);
    return (
      <div className={classes.root}>
        <CssBaseline />
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar>
            <Typography variant="h6" color="inherit" noWrap>
              MEME PROTO
            </Typography>
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
            <Fab color="primary" aria-label="Add" className={classes.fab} onClick={this.handleAddProp}><AddIcon /></Fab>
          </Tooltip>
          <Dialog
            open={this.state.addPropOpen}
            onClose={this.handleAddPropClose}
            aria-labelledby="form-dialog-title"
          >
            <DialogTitle id="form-dialog-title">Add Component/Property</DialogTitle>
            <DialogContent>
              <DialogContentText>Type a name for your component or property.</DialogContentText>
              <TextField autoFocus margin="dense" id="propLabel" label="Label" fullWidth />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleAddPropClose} color="primary">Cancel</Button>
              <Button onClick={this.handleAddPropCreate} color="primary">Create</Button>
            </DialogActions>
          </Dialog>
          <Divider />
          <List>
            {['CmdA', 'CmdB', 'CmdC', 'CmdD'].map((text, index) => (
              <ListItem button key={text}>
                <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
                <ListItemText primary={text} />
              </ListItem>
            ))}
          </List>
          <Tooltip title="Add Link">
            <Fab color="primary" aria-label="Add" className={ClassNames(classes.fab, classes.edgeButton)} onClick={this.handleAddEdge}><AddIcon /></Fab>
          </Tooltip>
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
        </main>

        <Paper className={classes.evidencePane}>
          <div className={classes.toolbar} />
          <List dense={true}>
            {this.state.evidenceList.map(item => (
              <ListItem button key={item.id} onClick={() => this.handleEvidenceClick(item.id)}>
                <ListItemAvatar>
                  <Avatar className={classes.evidenceAvatar}>{item.evid}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={`${item.label}`} secondary={`${item.keyvars}`} />
                <ListItemSecondaryAction>
                  {item.type === 'simulation' ? <ImageIcon /> : <DescriptionIcon />}
                  {item.links > 0 ?
                    <Chip className={classes.evidenceBadge} label={item.links} color="secondary" /> :
                    <Chip className={classes.evidenceBadge} label='' /> }
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>

        <Modal
          className={classes.edgeDialog}
          disableBackdropClick={true}
          hideBackdrop={true}
          open={this.state.addEdgeOpen}
          onClose={this.handleAddEdgeClose}
        >
          <Paper className={classes.edgePaper}>
            <div className={classes.drawerHeader}>Add Links</div>
            <ol>
              <li>Click on 'Source' button then select your source node.</li>
              <li>Click on 'Target' button then select your target node.</li>
              <li>Type in a label for your edge (optional).</li>
              <li>Then click 'Create'.</li>
            </ol>
            <div className={classes.edgeDrawerInput}>
              <Fab color="primary" aria-label="Add Source" className={ClassNames(classes.fab, classes.edgeButton)} onClick={this.handleSetEdgeSource}>{this.state.edgeSource}</Fab>
              <TextField autoFocus margin="dense" id="edgeLabel" label="Label" className={classes.textField} />
              <Fab color="primary" aria-label="Add Target" className={ClassNames(classes.fab, classes.edgeButton)} onClick={this.handleSetEdgeTarget}>{this.state.edgeTarget}</Fab>
            </div>
            <DialogActions>
              <Button onClick={this.handleAddEdgeClose} color="primary">Cancel</Button>
              <Button onClick={this.handleAddEdgeCreate} color="primary">Create</Button>
            </DialogActions>
          </Paper>
        </Modal>

        <Modal
          className={classes.evidenceDialog}
          disableBackdropClick={false}
          hideBackdrop={false}
          open={this.state.evidenceDialogOpen}
          onClose={this.handleEvidenceDialogClose}
        >
          <Paper className={classes.evidencePaper}>
            <div className={classes.evidenceTitle}>
              <Avatar>{this.state.selectedEvidence.evid}</Avatar>&nbsp;
              <div style={{ flexGrow: 1 }}>{this.state.selectedEvidence.label}</div>
              <Card>
                <CardContent>
                  <Typography>Key Variables:</Typography>
                  {this.state.selectedEvidence.keyvars.map( (item, index) => (
                    <Chip label={item} key={index} />
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography>Type:</Typography>
                  {this.state.selectedEvidence.type} {this.state.selectedEvidence.type === 'simulation' ? <ImageIcon /> : <DescriptionIcon />}
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography>Links:</Typography>
                  <Chip label={this.state.selectedEvidence.links} color="secondary" />
                </CardContent>
              </Card>
              <Button className={classes.evidenceCloseBtn} onClick={this.handleEvidenceDialogClose} color="primary">Close</Button>
            </div>
            <iframe src={this.state.selectedEvidence.url} width="1024" height="600"></iframe>
          </Paper>
        </Modal>
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
/// disallowed by eslint, so use shape({ prop:ProtType })
/// to describe them in more detail
ViewMain.propTypes = {
  classes: PropTypes.shape({})
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(MEMEStyles)(ViewMain);
