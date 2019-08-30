/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Criteria View


Unlike the other components, which send all data updates directly to ADM,
Criteria are editted locally first, and the whole set of changes is sent
to ADM after the user clicks "Save".  This is necessary to let users "Cancel"
out of a criteria edit to revert to the previous state.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import Paper from '@material-ui/core/Paper';
// Material UI Icons
import AddIcon from '@material-ui/icons/Add';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from '../../../components/MEMEStyles';
import UR from '../../../../system/ursys';
import ADM from '../../../modules/adm-data';
import CriteriaList from './AdmCriteriaList';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'AdminCriteriaList';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class CriteriaView extends React.Component {
  constructor(props) {
    super(props);
    this.CloneCriteria = this.CloneCriteria.bind(this);
    this.DoClassroomSelect = this.DoClassroomSelect.bind(this);
    this.OnEditCriteriaClick = this.OnEditCriteriaClick.bind(this);
    this.OnEditCriteriaSave = this.OnEditCriteriaSave.bind(this);
    this.OnEditCriteriaCancel = this.OnEditCriteriaCancel.bind(this);
    this.OnEditCriteriaClose = this.OnEditCriteriaClose.bind(this);
    this.OnAddCriteriaClick = this.OnAddCriteriaClick.bind(this);
    this.OnDeleteCriteriaClick = this.OnDeleteCriteriaClick.bind(this);
    this.UpdateField = this.UpdateField.bind(this);

    this.state = {
      criteria: [],
      isInEditMode: false,
      classroomId: ''
    };

    UR.Subscribe('CLASSROOM_SELECT', this.DoClassroomSelect);
  }

  componentDidMount() { }

  componentWillUnmount() { }

  // Used to create a local copy for editing and support cancelling edit.
  // NOTE: This is a shallow copy
  CloneCriteria(criteria) {
    return criteria.map(crit => {
      return Object.assign({}, crit);
    });
  }

  DoClassroomSelect(data) {
    // Clone the criteria objects so that field updates do not change the original objects
    let criteria = this.CloneCriteria(ADM.GetCriteriaByClassroom(data.classroomId));
    this.setState({
      criteria,
      classroomId: data.classroomId
    });
  }

  OnEditCriteriaClick() {
    this.setState({
      isInEditMode: true
    });
  }

  OnEditCriteriaSave(e) {
    ADM.UpdateCriteriaList(this.state.criteria);
    this.OnEditCriteriaClose();
  }

  OnEditCriteriaCancel() {
    // Restore original values.
    this.DoClassroomSelect({ classroomId: this.state.classroomId });
    this.OnEditCriteriaClose();
  }

  OnEditCriteriaClose() {
    this.setState({
      isInEditMode: false
    });
  }

  OnAddCriteriaClick() {
    this.setState(state => {
      let criteria = state.criteria;
      criteria.push(ADM.NewCriteria());
      return {
        criteria,
        isInEditMode: true
      };
    });
  }

  OnDeleteCriteriaClick(critId) {
    this.setState(state => {
      const criteria = state.criteria;
      const result = criteria.filter(crit => crit.id !== critId);
      return {
        criteria: result
      };
    });
  }

  UpdateField(critId, fieldName, value) {
    // Save the changes locally first
    // Store the whole object when "Save" is presssed.
    this.setState(state => {
      let criteria = state.criteria;

      const i = criteria.findIndex(cr => cr.id === critId);
      if (i < 0) {
        console.error(PKG, 'UpdateField could not find index of criteria with id', critId);
        return undefined;
      }

      // Update the value
      let crit = criteria[i];
      crit[fieldName] = value;

      // Update criteria data
      criteria.splice(i, 1, crit);
      return { criteria };
    });
  }

  render() {
    const { classes } = this.props;
    const { criteria, isInEditMode, classroomId } = this.state;

    return (
      <Paper className={classes.admPaper}>
        <InputLabel>CRITERIA</InputLabel>
        <Dialog open={isInEditMode}>
          <DialogTitle>Edit Criteria</DialogTitle>
          <CriteriaList
            Criteria={criteria}
            IsInEditMode={isInEditMode}
            UpdateField={this.UpdateField}
            OnDeleteCriteriaClick={this.OnDeleteCriteriaClick}
          />
          <DialogActions>
            <IconButton
              size="small"
              onClick={this.OnAddCriteriaClick}
              hidden={!isInEditMode}
              style={{ marginRight: 'auto' }}
            >
              <AddIcon />
            </IconButton>
            <Button
              variant="contained"
              className={classes.button}
              onClick={this.OnEditCriteriaCancel}
              hidden={!isInEditMode}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              className={classes.button}
              onClick={this.OnEditCriteriaSave}
              hidden={!isInEditMode}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
        <CriteriaList Criteria={criteria} IsInEditMode={false} />
        <Button
          variant="contained"
          className={classes.button}
          onClick={this.OnEditCriteriaClick}
          hidden={isInEditMode}
          disabled={classroomId === ''}
        >
          Edit Criteria
        </Button>
      </Paper>
    );
  }
}

CriteriaView.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object
};

CriteriaView.defaultProps = {
  classes: {}
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(CriteriaView);
