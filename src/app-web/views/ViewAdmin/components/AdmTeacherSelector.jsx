/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Teacher Selector

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
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from '../../../components/MEMEStyles';
import UR from '../../../../system/ursys';
import SESSION from '../../../../system/common-session';
import ADM from '../../../modules/data';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class TeacherSelector extends React.Component {
  constructor(props) {
    super(props);
    this.DoADMDataUpdate = this.DoADMDataUpdate.bind(this);
    this.DoTeacherSelect = this.DoTeacherSelect.bind(this);
    this.OnTeacherSelect = this.OnTeacherSelect.bind(this);
    this.OnAddTeacherDialogClose = this.OnAddTeacherDialogClose.bind(this);
    this.OnAddTeacherName = this.OnAddTeacherName.bind(this);

    UR.Subscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate);
    UR.Subscribe('TEACHER_SELECT', this.DoTeacherSelect);

    this.state = {
      teachers: [],
      selectedTeacherId: '',
      addTeacherDialogOpen: false,
      addTeacherDialogName: ''
    };
  }

  componentDidMount() {
    this.DoADMDataUpdate();
  }

  componentWillUnmount() {
    UR.Unsubscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate);
    UR.Unsubscribe('TEACHER_SELECT', this.DoTeacherSelect);
  }

  DoADMDataUpdate() {
    this.setState({ teachers: ADM.GetAllTeachers() });
  }

  DoTeacherSelect(data) {
    this.setState({ selectedTeacherId: data.teacherId });
  }

  OnTeacherSelect(e) {
    let selectedTeacherId = e.target.value;
    if (selectedTeacherId === 'new') {
      this.setState({ addTeacherDialogOpen: true });
    } else {
      ADM.SelectTeacher(selectedTeacherId);
    }
  }

  OnAddTeacherName(e) {
    e.preventDefault();
    e.stopPropagation();
    const name = this.state.addTeacherDialogName;
    ADM.DB_AddTeacher(name);
    this.OnAddTeacherDialogClose();
  }

  OnAddTeacherDialogClose() {
    this.setState({ addTeacherDialogOpen: false });
  }

  render() {
    const { classes } = this.props;
    const { teachers, selectedTeacherId, addTeacherDialogOpen } = this.state;
    return (
      <Paper className={classes.admPaper}>
        <FormControl variant="outlined" className={classes.admTeacherSelector}>
          <InputLabel>TEACHER</InputLabel>
          <Select
            value={selectedTeacherId}
            onChange={this.OnTeacherSelect}
            input={<OutlinedInput name="teacher" id="teacher" labelWidth={120} />}
          >
            <MenuItem value="" />
            {teachers.map(teacher => {
              const tok = SESSION.MakeTeacherToken(teacher.name, { groupId: 0, teacherId: teacher.id });
              return (
                <MenuItem value={teacher.id} key={teacher.id}>
                  {teacher.name} - {tok}
                </MenuItem>
              )
            }
            )}
            <MenuItem value="new">
              <i>Add New...</i>
            </MenuItem>
          </Select>
        </FormControl>
        <Dialog open={addTeacherDialogOpen} onClose={this.OnAddTeacherDialogClose}>
          <form onSubmit={this.OnAddTeacherName}>
            <DialogTitle>Add Teacher</DialogTitle>
            <DialogContent>
              <DialogContentText>Add a teacher by name, e.g. "Ms. Brown"</DialogContentText>
              <TextField
                autoFocus
                id="teacherName"
                label="Name"
                fullWidth
                onChange={e => this.setState({ addTeacherDialogName: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.OnAddTeacherDialogClose} color="primary">
                Cancel
              </Button>
              <Button color="primary" type="submit">
                Add
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Paper>
    );
  }
}

TeacherSelector.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object
};

TeacherSelector.defaultProps = {
  classes: {}
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(TeacherSelector);
