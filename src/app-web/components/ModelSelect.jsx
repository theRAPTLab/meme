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
      modelSelectDialogOpen: false
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
      this.setState({
        modelId: ADM.GetSelectedModelId(),
        modelSelectDialogOpen: true
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
    const { modelId, modelSelectDialogOpen } = this.state;
    const myModels = ADM.GetModelsByStudent();
    const ourModels = ADM.GetModelsByClassroom(ADM.GetSelectedClassroomId());
    return (
      <Dialog
        disableBackdropClick
        disableEscapeKeyDown
        open={modelSelectDialogOpen}
        onClose={this.OnLoginDialogClose}
        fullScreen
      >
        <DialogTitle>Hi {ADM.GetStudentName()}! Select a Model:</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item>
              <DialogContentText>
                {ADM.GetStudentGroupName()} Group&lsquo;s Models
              </DialogContentText>
              <ModelsListTable models={myModels} OnModelSelect={this.OnModelEdit} />
              <Divider style={{ margin: '2em' }} />
            </Grid>
            <Grid item>
              <DialogContentText>My Classes&lsquo; Models</DialogContentText>
              <ModelsListTable models={ourModels} OnModelSelect={this.OnModelView} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.OnNewModel} color="primary" variant="outlined">
            Create New Model
          </Button>
          <div style={{ flexGrow: 1 }} />
          <Button onClick={this.OnLogout} color="primary">
            Logout
          </Button>
        </DialogActions>
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
