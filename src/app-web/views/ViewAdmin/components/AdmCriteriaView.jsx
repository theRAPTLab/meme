/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Criteria View

Unlike the other components, which send all data updates directly to ADM,
Criteria are editted locally first, and the whole set of changes is sent
to ADM after the user clicks "Save".  This removes the need to have to click
Save on every single edit.

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
      isInEditMode: false,
      classroomId: -1
    };

    UR.Subscribe('CLASSROOM_SELECT', this.DoClassroomSelect);
    UR.Subscribe('ADM_DATA_UPDATED', this.DoLoadCriteria);
    UR.Subscribe('CRITERIA_SET_DEFAULTS', this.DoCreateDefaultCriteria);
  }

  componentDidMount() { }

  componentWillUnmount() {
    UR.Unsubscribe('CLASSROOM_SELECT', this.DoClassroomSelect);
    UR.Unsubscribe('ADM_DATA_UPDATED', this.DoLoadCriteria);
    UR.Unsubscribe('CRITERIA_SET_DEFAULTS', this.DoCreateDefaultCriteria);
  }

  DoClassroomSelect(data) {
    this.setState({
      classroomId: Number( data.classroomId )
    }, () => {
      this.DoLoadCriteria();
    });
  }

  DoCreateDefaultCriteria(classroomId) {
    defaults.map(def => {
      ADM.DB_NewCriteria({
        classroomId: classroomId,
        label: def.label,
        description: def.description
      })
    });
  }
  
  DoLoadCriteria() {
    if (this.state.classroomId === -1) return;
    let criteria = ADM.GetCriteriaByClassroom(this.state.classroomId);
    this.setState({
      criteria
    });
  }
  
  OnEditClick() {
    this.DoLoadCriteria()
    this.setState({ isInEditMode: true });
  }

  OnEditSave(e) {
    ADM.DB_UpdateCriteriaList(this.state.criteria);
    this.DoClose();
  }

  OnEditCancel() {
    this.DoClose();
    
    /* Old Code
    // Restore original values.
    this.setState(state => {
      return { criteria: state.origCriteria }
    }, () => {
        
    });
    */
  }

  DoClose() {
    this.setState({
      isInEditMode: false
    });
  }

  OnAddClick() {
    ADM.DB_NewCriteria({}, () =>
      this.setState({ isInEditMode: true })
    );
    
    /* old code
    this.setState(state => {
      let criteria = state.criteria;
      criteria.push(ADM.Criterion());
      return {
        criteria,
        isInEditMode: true
      };
    });
    */
  }

  OnDeleteClick(critId) {
    ADM.DB_CriteriaDelete(critId);

    // Old Code
    // this.setState(state => {
    //  const result = state.criteria.filter(crit => crit.id !== critId);
    //   return {
    //     criteria: result
    //   };
    // });
  }

  UpdateField(critId, fieldName, value, e) {
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
              hidden={true}
            >
              Close
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
