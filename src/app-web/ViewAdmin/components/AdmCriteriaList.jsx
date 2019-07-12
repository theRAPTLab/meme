/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Criteria List View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
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
import DeleteIcon from '@material-ui/icons/Delete';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from '../../components/MEMEStyles';
import UR from '../../../system/ursys';
import ADM from '../../modules/adm-data';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'AdminCriteriaList';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class CriteriaList extends React.Component {
  constructor(props) {
    super(props);
    this.DoClassroomSelect = this.DoClassroomSelect.bind(this);
    this.OnEditCriteriaClick = this.OnEditCriteriaClick.bind(this);
    this.OnEditCriteriaSave = this.OnEditCriteriaSave.bind(this);
    this.OnEditCriteriaClose = this.OnEditCriteriaClose.bind(this);
    this.OnAddCriteriaClick = this.OnAddCriteriaClick.bind(this);
    this.OnDeleteCriteriaClick = this.OnDeleteCriteriaClick.bind(this);
    this.UpdateField = this.UpdateField.bind(this);

    this.state = {
      criteria: [],
      isInEditMode: false,
      classroomId: ''
    };

    UR.Sub('CLASSROOM_SELECT', this.DoClassroomSelect);
  }

  componentDidMount() { }

  componentWillUnmount() { }

  DoClassroomSelect(data) {
    this.setState({
      criteria: ADM.GetCriteriaByClassroom(data.classroomId),
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
        return;
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
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>LABEL</TableCell>
              <TableCell>DESCRIPTION</TableCell>
              <TableCell>{isInEditMode ? 'DELETE' : ''}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {criteria.map(crit => (
              isInEditMode ? (
                <TableRow key={crit.id}>
                  <TableCell>
                    <TextField
                      value={crit.label}
                      placeholder="Label"
                      onChange={e => this.UpdateField(crit.id, 'label', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={crit.description}
                      placeholder="Description"
                      onChange={e => this.UpdateField(crit.id, 'description', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => this.OnDeleteCriteriaClick(crit.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={crit.id}>
                  <TableCell>{crit.label}</TableCell>
                  <TableCell>{crit.description}</TableCell>
                </TableRow>
              )
            ))}
            <TableRow>
              <TableCell>
                <IconButton size="small" onClick={this.OnAddCriteriaClick} hidden={!isInEditMode}>
                  <AddIcon />
                </IconButton>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
        <Button
          variant="contained"
          className={classes.button}
          onClick={this.OnEditCriteriaClick}
          hidden={isInEditMode}
          disabled={classroomId === ''}
        >
          Edit Criteria
        </Button>
        <Button
          variant="contained"
          className={classes.button}
          onClick={this.OnEditCriteriaClose}
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
      </Paper>
    );
  }
}

CriteriaList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object
};

CriteriaList.defaultProps = {
  classes: {}
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(CriteriaList);
