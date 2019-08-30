/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Classrooms Selector

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from '../../../components/MEMEStyles';
import UR from '../../../../system/ursys';
import ADM from '../../../modules/adm-data';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class ClassroomsSelector extends React.Component {
  constructor(props) {
    super(props);

    this.DoClassroomListUpdate = this.DoClassroomListUpdate.bind(this);
    this.DoTeacherSelect = this.DoTeacherSelect.bind(this);
    this.DoClassroomSelect = this.DoClassroomSelect.bind(this);
    this.OnClassroomSelect = this.OnClassroomSelect.bind(this);
    this.OnAddClasssroomName = this.OnAddClasssroomName.bind(this);
    this.OnAddClassroomDialogClose = this.OnAddClassroomDialogClose.bind(this);

    UR.Subscribe('TEACHER_SELECT', this.DoTeacherSelect);
    UR.Subscribe('CLASSROOM_SELECT', this.DoClassroomSelect);

    this.state = {
      classrooms: [],
      selectedClassroomId: '',
      addClassroomDialogOpen: false,
      addClassroomDialogName: ''
    };
  }

  componentDidMount() { }

  componentWillUnmount() { }

  DoClassroomListUpdate() {
    this.setState({
      classrooms: ADM.GetClassroomsByTeacher()
    });
  }

  DoTeacherSelect(data) {
    if (DBG) console.log('AdmClassroomsSelector: loading classrooms with teacher', data.teacherId);
    this.DoClassroomListUpdate(data.teacherId);
    ADM.SelectClassroom('');
  }

  // Update the state and inform subscribers (groupList, models, criteria, resources
  DoClassroomSelect(data) {
    if (DBG) console.log('AdmClassroomsSelector: Setting classroom to', data);
    if (data.classroomListNeedsUpdating) {
      // REVIEW: Instead of doing two set staes in a row (selectedCLassroomId below)
      // we might want to use the setState callback to set one then the other?
      this.DoClassroomListUpdate();
    }
    this.setState({ selectedClassroomId: data.classroomId });
  }

  // User has selected a classroom from the dropdown menu
  OnClassroomSelect(e) {
    let classroomId = e.target.value;
    if (classroomId === 'new') {
      this.setState({ addClassroomDialogOpen: true });
    } else {
      ADM.SelectClassroom(classroomId);
    }
  }

  OnAddClasssroomName(e) {
    let name = this.state.addClassroomDialogName;
    ADM.AddClassroom(name);
    this.OnAddClassroomDialogClose();
  }

  OnAddClassroomDialogClose() {
    this.setState({ addClassroomDialogOpen: false });
  }

  render() {
    const { classes } = this.props;
    const { classrooms, selectedClassroomId, addClassroomDialogOpen } = this.state;
    return (
      <Paper className={classes.admPaper}>
        <FormControl variant="outlined" className={classes.admTeacherSelector}>
          <InputLabel>CLASSROOMS</InputLabel>
          <Select
            value={selectedClassroomId}
            onChange={this.OnClassroomSelect}
            input={<OutlinedInput name="classroom" id="classroom" labelWidth={120} />}
          >
            {classrooms.map(classroom => (
              <MenuItem value={classroom.id} key={classroom.id}>
                {classroom.name}
              </MenuItem>
            ))}
            <MenuItem value="new">
              <i>Add New...</i>
            </MenuItem>
          </Select>
        </FormControl>
        <Dialog open={addClassroomDialogOpen} onClose={this.OnAddClassroomDialogClose}>
          <DialogTitle>Add Teacher</DialogTitle>
          <DialogContent>
            <DialogContentText>Add a teacher by name, e.g. "Ms. Brown"</DialogContentText>
            <TextField
              autoFocus
              id="teacherName"
              label="Name"
              fullWidth
              onChange={e => this.setState({ addClassroomDialogName: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.OnAddClassroomDialogClose} color="primary">
              Cancel
            </Button>
            <Button onClick={this.OnAddClasssroomName} color="primary">
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    );
  }
}

ClassroomsSelector.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object
};

ClassroomsSelector.defaultProps = {
  classes: {}
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(ClassroomsSelector);
