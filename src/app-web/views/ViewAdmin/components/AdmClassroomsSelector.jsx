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
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Select from '@material-ui/core/Select';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from '../../../components/MEMEStyles';
import UR from '../../../../system/ursys';
import ADM from '../../../modules/data';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class ClassroomsSelector extends React.Component {
  constructor(props) {
    super(props);

    this.DoADMDataUpdate = this.DoADMDataUpdate.bind(this);
    this.DoClassroomListUpdate = this.DoClassroomListUpdate.bind(this);
    this.DoTeacherSelect = this.DoTeacherSelect.bind(this);
    this.DoClassroomSelect = this.DoClassroomSelect.bind(this);
    this.OnClassroomSelect = this.OnClassroomSelect.bind(this);
    this.OnAddClasssroomName = this.OnAddClasssroomName.bind(this);
    this.OnClassesModelsVisibilityChange = this.OnClassesModelsVisibilityChange.bind(this);
    this.OnAddClassroomDialogClose = this.OnAddClassroomDialogClose.bind(this);
    this.OnClassroomEdit = this.OnClassroomEdit.bind(this);

    UR.Subscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate);
    UR.Subscribe('TEACHER_SELECT', this.DoTeacherSelect);
    UR.Subscribe('CLASSROOM_SELECT', this.DoClassroomSelect);

    this.state = {
      classrooms: [],
      selectedClassroomId: '',
      selectedClassroomName: '',
      addClassroomDialogOpen: false,
      updateExistingClassroom: false,
      canViewOthers: false
    };
  }

  componentDidMount() {}

  componentWillUnmount() {
    UR.Unsubscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate);
    UR.Unsubscribe('TEACHER_SELECT', this.DoTeacherSelect);
    UR.Unsubscribe('CLASSROOM_SELECT', this.DoClassroomSelect);
  }

  DoADMDataUpdate() {
    this.DoClassroomListUpdate();
    this.setState({
      canViewOthers: ADM.CanViewOthers()
    });
  }

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
    if (DBG) console.error('AdmClassroomsSelector: Setting classroom to', data);
    const classroom = ADM.GetClassroom(data.classroomId);
    if (classroom) {
      classroom.canViewOthers = classroom.canViewOthers || false; // clean data to prevent props error
      this.setState({
        selectedClassroomId: classroom.id,
        selectedClassroomName: classroom.name,
        canViewOthers: classroom.canViewOthers
      });
    }
  }

  // User has selected a classroom from the dropdown menu
  OnClassroomSelect(e) {
    let classroomId = e.target.value;
    if (classroomId === 'new') {
      this.setState({
        selectedClassroomName: '',
        addClassroomDialogOpen: true,
        updateExistingClassroom: false
      });
    } else {
      ADM.SelectClassroom(classroomId);
    }
  }

  OnAddClasssroomName(e) {
    e.preventDefault();
    e.stopPropagation();
    let name = this.state.selectedClassroomName;
    if (this.state.updateExistingClassroom) {
      const classroomData = {
        id: this.state.selectedClassroomId,
        name
      };
      ADM.DB_UpdateClassroom(this.state.selectedClassroomId, classroomData);
    } else {
      ADM.DB_AddClassroom(name);
    }
    this.OnAddClassroomDialogClose();
  }

  OnClassesModelsVisibilityChange(e) {
    ADM.DB_UpdateClassroom(this.state.selectedClassroomId, { canViewOthers: e.target.checked });
  }

  OnAddClassroomDialogClose() {
    this.setState({ addClassroomDialogOpen: false });
  }

  OnClassroomEdit(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      addClassroomDialogOpen: true,
      updateExistingClassroom: true
    });
  }

  render() {
    const { classes } = this.props;
    const {
      classrooms,
      selectedClassroomId,
      selectedClassroomName,
      addClassroomDialogOpen,
      canViewOthers
    } = this.state;
    return (
      <Paper className={classes.admPaper}>
        <Grid container direction="row" spacing={2}>
          <Grid item xs={4}>
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
          </Grid>
          <Grid item xs={2}>
            <Button onClick={this.OnClassroomEdit} disabled={selectedClassroomId === ''}>
              Edit
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" component="div">
              <div>Students can view class' models?</div>
              <Grid container component="label" alignItems="center" spacing={1}>
                <Grid item>Hide</Grid>
                <Grid item>
                  <Switch
                    disabled={selectedClassroomId === ''}
                    checked={canViewOthers}
                    onChange={this.OnClassesModelsVisibilityChange}
                    color="primary"
                  />
                </Grid>
                <Grid item>Show</Grid>
              </Grid>
            </Typography>
          </Grid>
        </Grid>
        <Dialog open={addClassroomDialogOpen} onClose={this.OnAddClassroomDialogClose}>
          <form onSubmit={this.OnAddClasssroomName}>
            <DialogTitle>Add Classroom</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Add a classroom by name, e.g. "Period 1" or "Science 1A"
              </DialogContentText>
              <TextField
                autoFocus
                id="teacherName"
                label="Name"
                fullWidth
                value={selectedClassroomName}
                onChange={e => this.setState({ selectedClassroomName: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.OnAddClassroomDialogClose} color="primary">
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
