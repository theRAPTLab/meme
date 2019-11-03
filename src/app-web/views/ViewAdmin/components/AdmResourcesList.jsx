/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Resources List View

All resources are available for all classrooms.
Each classroom can define its own subset of resources to display.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from '@material-ui/core/Checkbox';
import InputLabel from '@material-ui/core/InputLabel';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from '../../../components/MEMEStyles';
import UR from '../../../../system/ursys';
import ADM from '../../../modules/data';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class ResourcesList extends React.Component {
  constructor(props) {
    super(props);
    this.DoClassroomSelect = this.DoClassroomSelect.bind(this);
    this.DoADMDataUpdate = this.DoADMDataUpdate.bind(this);
    this.OnResourceCheck = this.OnResourceCheck.bind(this);

    this.state = {
      classroomResources: [],
      classroomId: ''
    };

    UR.Subscribe('CLASSROOM_SELECT', this.DoClassroomSelect);
    UR.Subscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate); // Broadcast when a resource is updated.
  }

  componentDidMount() {}

  componentWillUnmount() {}

  DoClassroomSelect(data) {
    this.setState({
      classroomResources: ADM.GetResourcesForClassroom(data.classroomId),
      classroomId: data.classroomId
    });
  }

  // Update the groups list from ADMData in case a new group was added
  DoADMDataUpdate() {
    const classroomId = this.state.classroomId;
    if (classroomId) {
      this.setState({
        classroomResources: ADM.GetResourcesForClassroom(classroomId)
      });
    }
  }

  OnResourceCheck(rsrcId, checked) {
    ADM.DB_ClassroomResourceSet(rsrcId, checked, this.state.classroomId);
  }

  render() {
    const { classes } = this.props;
    const { classroomResources, classroomId } = this.state;
    const resources = ADM.AllResources();

    return (
      <Paper className={classes.admResourceListPaper}>
        <InputLabel>RESOURCES</InputLabel>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>INCLUDE FOR CLASSROOM</TableCell>
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
                <TableCell>{resource.id}</TableCell>
                <TableCell>{resource.label}</TableCell>
                <TableCell>{resource.notes}</TableCell>
                <TableCell>{resource.type}</TableCell>
                <TableCell>{resource.url}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
