/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GroupSelector

  Used to select a target classroom or group for cloning or moving


  # Cloning

  If cloning:
  * Either a classroom and/or a group can be selected
  * Submit button displays "CLONE"


  # Moving

  If moving:
  * A groupId MUST be selected
  * Submit button displays "MOVE"

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Select from '@material-ui/core/Select';
/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import UR from '../../../../system/ursys';
/// MODULES ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import ADM from '../../../modules/data';
import SESSION from '../../../../system/common-session';

/// CSS IMPORTS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import 'bootstrap/dist/css/bootstrap.css';

/// DEBUG CONTROL /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const styles = theme => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  }
});

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GroupSelector extends React.Component {
  // constructor
  constructor(props) {
    super();
    this.state = {
      selectedTeacherId: '',
      selectedClassroomId: '',
      selectedGroupId: ''
    };
    this.OnTeacherSelect = this.OnTeacherSelect.bind(this);
    this.OnClassroomSelect = this.OnClassroomSelect.bind(this);
    this.OnGroupSelect = this.OnGroupSelect.bind(this);
    this.OnSelect = this.OnSelect.bind(this);
  }

  componentDidMount() {}

  OnTeacherSelect(e) {
    this.setState({
      selectedTeacherId: e.target.value
    });
  }

  OnClassroomSelect(e) {
    this.setState({
      selectedClassroomId: e.target.value
    });
  }

  OnGroupSelect(e) {
    this.setState({
      selectedGroupId: e.target.value
    });
  }

  OnSelect() {
    const { selectedTeacherId, selectedClassroomId, selectedGroupId } = this.state;
    const data = { selectedTeacherId, selectedClassroomId, selectedGroupId };
    this.props.OnSelect(data);
  }

  render() {
    let { selectedTeacherId, selectedClassroomId, selectedGroupId } = this.state;
    const { open, type, OnClose, classes } = this.props;
    const teachers = ADM.GetAllTeachers();
    if (selectedTeacherId === '') {
      // use the currently selected teacher if possible
      if (SESSION.IsTeacher()) {
        // logged in as teacher
        // When logged in as a teacher, ADM.GetTeacher does not work,
        // since it looks up the teacher by classroom.  But SESSION.LoggedInProps
        // has the teacherId saved.
        const lprops = SESSION.LoggedInProps();
        selectedTeacherId = lprops.teacherId;
      }
    }
    const classrooms = ADM.GetClassroomsByTeacher(selectedTeacherId);
    const groups = ADM.GetGroupsByClassroom(selectedClassroomId);
    return (
      <Dialog onClose={OnClose} open={open} className={classes.root}>
        <DialogTitle>Select a Classroom or a Group</DialogTitle>
        <DialogContent>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="clone-teacher-select">Teacher</InputLabel>
            <Select
              value={selectedTeacherId}
              onChange={this.OnTeacherSelect}
              inputProps={{ id: 'clone-teacher-select' }}
            >
              {teachers.map(teacher => (
                <MenuItem value={teacher.id} key={teacher.id}>
                  {teacher.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="clone-classroom-select">Classroom</InputLabel>
            <Select
              value={selectedClassroomId}
              onChange={this.OnClassroomSelect}
              inputProps={{ id: 'clone-classroom-select' }}
            >
              {classrooms.map(classroom => (
                <MenuItem value={classroom.id} key={classroom.id}>
                  {classroom.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="clone-group-select">Group</InputLabel>
            <Select
              value={selectedGroupId}
              onChange={this.OnGroupSelect}
              inputProps={{ id: 'clone-group-select' }}
            >
              <MenuItem value=""> </MenuItem>
              {groups.map(group => (
                <MenuItem value={group.id} key={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <DialogContentText>
            {type === 'clone'
              ? 'Leave "Group" unselected if you want to clone the model to every group in the class. Click "CLONE" when done.'
              : 'Please select both "Classroom" and "Group".  Click "MOVE" when done'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={OnClose}>Cancel</Button>
          <Button
            onClick={this.OnSelect}
            disabled={type === 'clone' ? selectedClassroomId === '' : selectedGroupId === ''}
          >
            {type === 'clone' ? 'Clone' : 'Move'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// default props are expect properties that we expect
/// and are declared for validation
GroupSelector.defaultProps = {
  open: false,
  type: 'clone',
  OnClose: () => {
    console.log('OnClose function not defined!');
  },
  OnSelect: () => {
    console.log('OnSelect function not defined!');
  },
  classes: { isDefaultProps: true }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// propTypes are declared. Note "vague" propstypes are
/// disallowed by eslint, so use shape({prop:PropType })
/// to describe them in more detail
GroupSelector.propTypes = {
  open: PropTypes.bool,
  type: PropTypes.string, // 'clone' || 'move'
  OnClose: PropTypes.func,
  OnSelect: PropTypes.func,
  classes: PropTypes.shape({ formControl: PropTypes.string })
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// required for UR EXEC phase filtering by view path
GroupSelector.MOD_ID = __dirname;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(styles)(GroupSelector);
