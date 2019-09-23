/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Criteria View

Unlike the other components, which send all data updates directly to ADM,
Criteria are editted locally first, and the whole set of changes is sent
to ADM after the user clicks "Save".  This is necessary to let users "Cancel"
out of a criteria edit to revert to the previous state.

We also do things this way so that you can edit all of the items at the same
time rather than having to individually select and save each edit.

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
import ADM from '../../../modules/data';
import CriteriaList from './AdmCriteriaList';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'AdminCriteriaView';
const defaults = [
  {
    label: 'Clarity',
    description: 'How clear is the explanation?',
  },
  {
    label: 'Visuals',
    description: 'Does the layout make sense?',
  }
]
/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class CriteriaView extends React.Component {
  constructor(props) {
    super(props);
    this.DoClassroomSelect = this.DoClassroomSelect.bind(this);
    this.DoLoadCriteria = this.DoLoadCriteria.bind(this);
    this.OnEditClick = this.OnEditClick.bind(this);
    this.OnEditSave = this.OnEditSave.bind(this);
    this.OnEditCancel = this.OnEditCancel.bind(this);
    this.DoClose = this.DoClose.bind(this);
    this.OnAddClick = this.OnAddClick.bind(this);
    this.OnDeleteClick = this.OnDeleteClick.bind(this);
    this.UpdateField = this.UpdateField.bind(this);

    this.state = {
      criteria: [],
      origCriteria: [],
      isInEditMode: false,
      classroomId: ''
    };

    UR.Subscribe('CLASSROOM_SELECT', this.DoClassroomSelect);
  }

  componentDidMount() { }

  componentWillUnmount() { }

  DoClassroomSelect(data) {
    this.setState({
      classroomId: data.classroomId
    }, () => {
      this.DoLoadCriteria();
    });
  }

  DoLoadCriteria() {
    let criteria = ADM.GetCriteriaByClassroom(this.state.classroomId);
    if (criteria.length === 0) {
      // Create defaults
      criteria = defaults.map(def => {
        const crit = ADM.NewCriteria(this.state.classroomId);
        crit.label = def.label;
        crit.description = def.description;
        return crit;
      });
    }
    const origCriteria = JSON.parse(JSON.stringify(criteria)); // deep clone
    this.setState({
      criteria,
      origCriteria
    });
  }
  
  OnEditClick() {
    this.DoLoadCriteria()
    this.setState({ isInEditMode: true });
  }

  OnEditSave(e) {
    ADM.UpdateCriteriaList(this.state.criteria);
    this.DoClose();
  }

  OnEditCancel() {
    // Restore original values.
    this.setState(state => {
      return { criteria: state.origCriteria }
    }, () => {
        this.DoClose();
    });
  }

  DoClose() {
    this.setState({
      isInEditMode: false
    });
  }

  OnAddClick() {
    this.setState(state => {
      let criteria = state.criteria;
      criteria.push(ADM.NewCriteria());
      return {
        criteria,
        isInEditMode: true
      };
    });
  }

  OnDeleteClick(critId) {
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
            OnDeleteCriteriaClick={this.OnDeleteClick}
          />
          <DialogActions>
            <IconButton
              size="small"
              onClick={this.OnAddClick}
              hidden={!isInEditMode}
              style={{ marginRight: 'auto' }}
            >
              <AddIcon />
            </IconButton>
            <Button
              variant="contained"
              className={classes.button}
              onClick={this.OnEditCancel}
              hidden={!isInEditMode}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              className={classes.button}
              onClick={this.OnEditSave}
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
          onClick={this.OnEditClick}
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
