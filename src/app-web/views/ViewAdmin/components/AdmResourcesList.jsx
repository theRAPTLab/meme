/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Resources List View

All resources are available for all classrooms.
Each classroom can define its own subset of resources to display.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import InputLabel from '@material-ui/core/InputLabel';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from '../../../components/MEMEStyles';
import UR from '../../../../system/ursys';
import ADM from '../../../modules/data';
import ADMObj from '../../../modules/adm-objects';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class ResourcesList extends React.Component {
  constructor(props) {
    super(props);
    this.DoClassroomSelect = this.DoClassroomSelect.bind(this);
    this.DoADMDataUpdate = this.DoADMDataUpdate.bind(this);
    this.DoEditResource = this.DoEditResource.bind(this);
    this.OnResourceCheck = this.OnResourceCheck.bind(this);
    this.OnAddClick = this.OnAddClick.bind(this);
    this.OnLabelChange = this.OnLabelChange.bind(this);
    this.OnNotesChange = this.OnNotesChange.bind(this);
    this.OnTypeChange = this.OnTypeChange.bind(this);
    this.OnURLChange = this.OnURLChange.bind(this);
    this.OnUpdateResource = this.OnUpdateResource.bind(this);
    this.OnDialogCloseClick = this.OnDialogCloseClick.bind(this);

    this.state = {
      classroomResources: [],
      classroomId: '',
      showDialog: false,
      dialogId: -1,
      dialogLabel: '',
      dialogNotes: '',
      dialogType: '',
      dialogURL: ''
    };

    UR.Subscribe('CLASSROOM_SELECT', this.DoClassroomSelect);
    UR.Subscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate); // Broadcast when a resource is updated.
  }

  componentDidMount() {}

  componentWillUnmount() {
    UR.Unsubscribe('CLASSROOM_SELECT', this.DoClassroomSelect);
    UR.Unsubscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate);
  }

  DoClassroomSelect(data) {
    this.setState({
      classroomResources: ADM.GetResourcesForClassroom(data.classroomId),
      classroomId: data.classroomId
    });
  }

  // Update the groups list from ADMData in case a new group was added
  DoADMDataUpdate(data) {
    const classroomId = this.state.classroomId;
    if (classroomId) {
      this.setState({
        classroomResources: ADM.GetResourcesForClassroom(classroomId)
      });
    } else if (data.resources) {
      // Resources were update, so force render to load latest resources
      this.forceUpdate();
    }
  }
  
  DoEditResource(id) {
    const res = ADM.Resource(id);
    this.setState({
      showDialog: true,
      dialogId: id,
      dialogLabel: res.label,
      dialogNotes: res.notes,
      dialogType: res.type,
      dialogURL: res.url
    })
  }

  OnResourceCheck(rsrcId, checked) {
    ADM.DB_ClassroomResourceSet(rsrcId, checked, this.state.classroomId);
  }
  
  OnAddClick() {
    const resource = ADMObj.Resource();
    this.setState({
      showDialog: true,
      dialogId: resource.id,
      dialogLabel: resource.label,
      dialogNotes: resource.notes,
      dialogType: resource.type,
      dialogURL: resource.url
    });
  }
  
  OnLabelChange(e) {
    this.setState({ dialogLabel: e.target.value });
  }

  OnNotesChange(e) {
    this.setState({ dialogNotes: e.target.value });
  }

  OnTypeChange(e) {
    this.setState({ dialogType: e.target.value });
  }

  OnURLChange(e) {
    this.setState({ dialogURL: e.target.value });
  }
  
  OnUpdateResource(e) {
    e.preventDefault();
    e.stopPropagation();
    const resource = ADMObj.Resource({
      id: this.state.dialogId,
      label: this.state.dialogLabel,
      notes: this.state.dialogNotes,
      type: this.state.dialogType,
      url: this.state.dialogURL
    });
    if (resource.id === undefined) {
      // Add new resource
      ADM.DB_ResourceAdd(resource);      
    } else {
      // Update existing resource
      ADM.DB_ResourceUpdate(resource);
    }
    this.OnDialogCloseClick();
  }
  
  OnDialogCloseClick() {
    this.setState({
      showDialog: false
    })    
  }

  render() {
    const { classes } = this.props;
    const { classroomResources, classroomId, showDialog,
            dialogLabel, dialogNotes, dialogType, dialogURL } = this.state;
    const resources = ADM.AllResources();

    return (
      <Paper className={classes.admResourceListPaper}>
        <InputLabel>RESOURCES</InputLabel>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>INCLUDE FOR CLASSROOM</TableCell>
              <TableCell></TableCell>
              <TableCell>ID</TableCell>
              <TableCell>LABEL</TableCell>
              <TableCell>NOTES</TableCell>
              <TableCell>TYPE</TableCell>
              <TableCell>URL</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resources.map(resource => (
              <TableRow key={resource.id}>
                <TableCell>
                  <Checkbox
                    checked={classroomResources.find(res => res.id === resource.id) ? true : false}
                    color="primary"
                    onChange={e => this.OnResourceCheck(resource.id, e.target.checked)}
                    disabled={classroomId === ''}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size='small'
                    onClick={() => this.DoEditResource(resource.id)}
                  >Edit</Button>
                </TableCell>
                <TableCell>{resource.id}</TableCell>
                <TableCell>{resource.label}</TableCell>
                <TableCell>{resource.notes}</TableCell>
                <TableCell>{resource.type}</TableCell>
                <TableCell>{resource.url}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button
          onClick={this.OnAddClick}
        >
          Add Resource
        </Button>
        <Dialog open={showDialog} onClose={this.OnDialogCloseClick}>
          <form onSubmit={this.OnUpdateResource}>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogContent>
              <p>Instructions</p>
              <ol>
                <li>Copy the resource file into `meme.app/Contents/Resources/app/web/static/dlc/` folder</li>
                <li>Add a label and notes</li>
                <li>Enter either "simulation" or "report" for the type.  Or you can enter a custom value.</li>
                <li>Enter the URL.  e.g. if your resource file name is `myReport.pdf', enter '../static/dlc/myReport.pdf'.  The ".." and path "../static/dlc" are important, as is using the right slashes and right upper/lowercase!</li>
                <li>Don't forget to enable the resource for a classroom!</li>
              </ol>
              <p>IMPORTANT: Make sure you test your resource!</p>
              <TextField
                autoFocus
                id="label"
                label="Label"
                placeholder="Fish in a Tank Simulation"
                onChange={this.OnLabelChange}
                value={dialogLabel}
                fullWidth
              />
              <TextField
                id="notes"
                label="Notes"
                placeholder="Five to ten word description."
                onChange={this.OnNotesChange}
                value={dialogNotes}
                fullWidth
              />
              <TextField
                id="type"
                label="Type"
                placeholder="'simulation' or 'report'"
                onChange={this.OnTypeChange}
                value={dialogType}
                fullWidth
              />
              <TextField
                id="url"
                label="URL"
                placeholder="../static/dlc/filename.ext"
                onChange={this.OnURLChange}
                value={dialogURL}
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.OnDialogCloseClick} color="primary">
                Cancel
              </Button>
              <Button color="primary" type="submit">
                Save
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Paper>
    );
  }
}

ResourcesList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object
};

ResourcesList.defaultProps = {
  classes: {}
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(ResourcesList);
