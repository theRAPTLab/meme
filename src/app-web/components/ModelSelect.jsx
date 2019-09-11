/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Model Select

Dialog for students to select a model.

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
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import UR from '../../system/ursys';
import ADM from '../modules/adm-data';
import ModelsListTable from './ModelsListTable';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class ModelSelect extends React.Component {
  constructor(props) {
    super(props);
    this.DoADMDataUpdate = this.DoADMDataUpdate.bind(this);
    this.OnModelDialogClose = this.OnModelDialogClose.bind(this);
    this.OnNewModel = this.OnNewModel.bind(this);
    this.OnModelEdit = this.OnModelEdit.bind(this);
    this.OnModelView = this.OnModelView.bind(this);
    this.OnLogout = this.OnLogout.bind(this);

    UR.Subscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate);

    this.state = {
      modelId: '',
      modelSelectDialogOpen: false,
      showClassesModels: false,
      studentId: '',
      groupName: '',
      classroomName: '',
      teacherName: ''
    };
  }

  componentDidMount() {
    this.DoADMDataUpdate();
  }

  componentWillUnmount() { }

  DoADMDataUpdate() {
    if (ADM.IsLoggedOut()) {
      this.setState({
        modelId: '',
        modelSelectDialogOpen: false
      });
    } else if (ADM.GetSelectedModelId() !== undefined) {
      const studentId = ADM.GetSelectedStudentId();
      const groupName = ADM.GetGroupNameByStudent(studentId);
      const classroomName = ADM.GetClassroomNameByStudent(studentId);
      const teacherName = ADM.GetTeacherNameByStudent(studentId);
      this.setState({
        modelId: ADM.GetSelectedModelId(),
        modelSelectDialogOpen: true,
        showClassesModels: true, //ADM.ClassesModelsAreVisible(),
        studentId,
        groupName,
        classroomName,
        teacherName
      });
    } else {
      // model already selected, so hide
      this.setState({
        modelSelectDialogOpen: false
      });
    }
  }

  OnModelDialogClose() {
    this.setState({ modelSelectDialogOpen: false });
  }

  OnNewModel() {
    ADM.NewModel();
    this.OnModelDialogClose();
  }

  OnModelEdit(modelId) {
    ADM.LoadModel(modelId);
    UR.Publish('MODEL:ALLOW_EDIT');
    this.OnModelDialogClose();
  }

  OnModelView(modelId) {
    ADM.LoadModel(modelId);
    this.OnModelDialogClose();
  }

  OnLogout() {
    ADM.Logout();
  }

  render() {
    const { classes } = this.props;
    const { modelId, modelSelectDialogOpen, showClassesModels, studentId, groupName, classroomName, teacherName } = this.state;
    const myModels = ADM.GetModelsByStudent();
    const ourModels = ADM.GetMyClassmatesModels(ADM.GetSelectedClassroomId(), studentId);
    return (
      <Dialog
        disableBackdropClick
        disableEscapeKeyDown
        open={modelSelectDialogOpen}
        onClose={this.OnLoginDialogClose}
        fullScreen
      >
        <DialogActions>
          <Typography variant="caption">MY GROUP: {groupName} | </Typography>
          <Typography variant="caption">MY CLASS: {classroomName} | </Typography>
          <Typography variant="caption">MY TEACHER: {teacherName}</Typography>
          <div style={{ flexGrow: 1 }} />
          <Button onClick={this.OnLogout} color="primary">
            Logout
          </Button>
        </DialogActions>
        <DialogTitle>Hi {ADM.GetStudentName()}!</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item>
              <Button onClick={this.OnNewModel} color="primary" variant="contained">
                Create New Model
              </Button>
            </Grid>
          </Grid>
          <Divider style={{ margin: '2em' }}/>
          <Grid container spacing={2}>
            <Grid item>
              <Typography variant="h4">
                {ADM.GetStudentGroupName()} Group&lsquo;s Models
              </Typography>
              <ModelsListTable models={myModels} OnModelSelect={this.OnModelEdit} />
            </Grid>
            <Grid item hidden={!showClassesModels}>
              <Typography variant="h4">
                My Class&lsquo; Models
              </Typography>
              <ModelsListTable models={ourModels} OnModelSelect={this.OnModelView} />
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    );
  }
}

ModelSelect.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object
};

ModelSelect.defaultProps = {
  classes: {}
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(ModelSelect);
