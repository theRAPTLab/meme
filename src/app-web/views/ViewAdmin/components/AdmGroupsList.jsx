/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Groups List View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';
// Material UI Icons
import AddIcon from '@material-ui/icons/Add';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from '../../../components/MEMEStyles';
import UR from '../../../../system/ursys';
import ADM from '../../../modules/data';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class GroupsList extends React.Component {
  constructor(props) {
    super(props);
    this.DoClassroomSelect = this.DoClassroomSelect.bind(this);
    this.DoADMDataUpdate = this.DoADMDataUpdate.bind(this);
    this.OnAddGroupClick = this.OnAddGroupClick.bind(this);
    this.OnAddGroupName = this.OnAddGroupName.bind(this);
    this.OnAddGroupDialogClose = this.OnAddGroupDialogClose.bind(this);
    this.OnAddStudentClick = this.OnAddStudentClick.bind(this);
    this.OnDeleteStudent = this.OnDeleteStudent.bind(this);
    this.OnAddStudentName = this.OnAddStudentName.bind(this);
    this.OnAddStudentDialogClose = this.OnAddStudentDialogClose.bind(this);
    this.OnUpdateAddStudentName = this.OnUpdateAddStudentName.bind(this);

    this.state = {
      groups: [],
      addGroupDialogOpen: false,
      addGroupDialogName: '',
      addStudentDialogOpen: false,
      addStudentDialogGroupId: '',
      addStudentDialogName: '',
      addStudentDialogInvalidNames: undefined,
      classroomId: ''
    };

    UR.Subscribe('CLASSROOM_SELECT', this.DoClassroomSelect);
    UR.Subscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate); // Broadcast when a group is added.
  }

  componentDidMount() { }

  componentWillUnmount() {
    UR.Unsubscribe('CLASSROOM_SELECT', this.DoClassroomSelect);
    UR.Unsubscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate);
  }

  DoClassroomSelect(data) {
    if (DBG) console.log('AdmGroupsList: DoClassroomSelect', data);
    if (data && data.classroomId) {
      this.setState({
        groups: ADM.GetGroupsByClassroom(data.classroomId),
        classroomId: data.classroomId
      });
    } else {
      this.setState({
        groups: [],
        classroomId: ''
      });
    }
  }

  // Update the groups list from ADMData in case a new group was added
  DoADMDataUpdate() {
    const classroomId = this.state.classroomId;
    if (classroomId) {
      this.setState({
        groups: ADM.GetGroupsByClassroom(classroomId)
      });
    }
  }

  OnAddGroupClick(e) {
    this.setState({ addGroupDialogOpen: true });
  }

  OnAddGroupName(e) {
    e.preventDefault();
    e.stopPropagation();
    ADM.DB_AddGroup(this.state.addGroupDialogName);
    this.OnAddGroupDialogClose();
  }

  OnAddGroupDialogClose() {
    this.setState({ addGroupDialogOpen: false });
  }

  OnAddStudentClick(e, groupId) {
    this.setState({
      addStudentDialogOpen: true,
      addStudentDialogGroupId: groupId
    });
  }

  OnDeleteStudent(e, groupId, student) {
    if (DBG) console.log('AdmGroupsList: Deleting student', student);
    ADM.DeleteStudent(groupId, student);
  }

  OnAddStudentName(e) {
    e.preventDefault();
    e.stopPropagation();
    const names = this.state.addStudentDialogName.split(',').map(name => name.trim());
    ADM.AddStudents(this.state.addStudentDialogGroupId, names);
    this.OnAddStudentDialogClose();
  }

  OnAddStudentDialogClose() {
    this.setState({ addStudentDialogOpen: false });
  }

  CheckForDuplicates(names) {
    let namesArr = names.split(',');
    let duplicateNamesArr = namesArr.filter(name => {
      return ADM.GetGroupByStudent(name.trim());
    });
    return duplicateNamesArr.length > 0 ? duplicateNamesArr.join(', ') : undefined;
  }

  OnUpdateAddStudentName(e) {
    // Check for duplicates
    let duplicateNames = this.CheckForDuplicates(e.target.value);
    this.setState({
      addStudentDialogName: e.target.value,
      addStudentDialogInvalidNames: duplicateNames
    });
  }

  render() {
    const { classes } = this.props;
    const {
      groups,
      addGroupDialogOpen,
      addStudentDialogOpen,
      addStudentDialogInvalidNames,
      classroomId
    } = this.state;

    return (
      <Paper className={classes.admPaper}>
        <InputLabel>GROUPS</InputLabel>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>NAME</TableCell>
              <TableCell>STUDENTS</TableCell>
              <TableCell>TOKENS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map(group => (
              <TableRow key={group.id}>
                <TableCell>{group.id}</TableCell>
                <TableCell>{group.name}</TableCell>
                <TableCell>
                  &nbsp;
                  {group.students.map((student, i) => {
                    return (
                      <Chip
                        key={group.id + student}
                        label={student}
                        onDelete={e => this.OnDeleteStudent(e, group.id, student)}
                      />
                    );
                  })}
                  <IconButton size="small" onClick={e => this.OnAddStudentClick(e, group.id)}>
                    <AddIcon />
                  </IconButton>
                </TableCell>
                <TableCell>
                  <textarea
                    rows={5}
                    readOnly
                    style={{ fontFamily: 'monospace' }}
                    value={group.students.reduce(
                      (accumulator, student) => accumulator + ADM.GetToken(group.id, student),
                      '' // initialValue to force start at index=0
                    )}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button
          variant="contained"
          className={classes.button}
          onClick={this.OnAddGroupClick}
          disabled={classroomId === ''}
        >
          Add Group
        </Button>
        <Dialog open={addGroupDialogOpen} onClose={this.OnAddGroupDialogClose}>
          <form onSubmit={this.OnAddGroupName}>
            <DialogTitle>Add Group</DialogTitle>
            <DialogContent>
              <DialogContentText>Add a group.</DialogContentText>
              <TextField
                autoFocus
                id="groupName"
                label="Group Name"
                fullWidth
                onChange={e => this.setState({ addGroupDialogName: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.OnAddGroupDialogClose} color="primary">
                Cancel
              </Button>
              <Button color="primary" type="submit">
                Add
              </Button>
            </DialogActions>
          </form>
        </Dialog>
        <Dialog open={addStudentDialogOpen} onClose={this.OnAddStudentDialogClose}>
          <form onSubmit={this.OnAddStudentName}>
            <DialogTitle>Add Student(s)</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Add a student first name, or add multiple students separated by a comma. Please use
                first names only. (e.g. 'Bob, Brianna, Brenda').
              </DialogContentText>
              <FormControl
                error={addStudentDialogInvalidNames !== undefined}
                fullWidth
                className={classes.oneEmBefore}
              >
                <TextField
                  autoFocus
                  id="studentNames"
                  label="Name(s)"
                  fullWidth
                  onChange={this.OnUpdateAddStudentName}
                />
                <FormHelperText hidden={addStudentDialogInvalidNames === undefined}>
                  {addStudentDialogInvalidNames} is already in this group. Please use a unique name.
                </FormHelperText>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.OnAddStudentDialogClose} color="primary">
                Cancel
              </Button>
              <Button
                color="primary"
                type="submit"
                disabled={addStudentDialogInvalidNames !== undefined}
              >
                Add
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Paper>
    );
  }
}

GroupsList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object
};

GroupsList.defaultProps = {
  classes: {}
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(GroupsList);
