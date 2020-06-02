/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Criteria List

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';
// Material UI Icons
import DeleteIcon from '@material-ui/icons/Delete';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from '../../../components/MEMEStyles';
import UR from '../../../../system/ursys';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'AdminCriteriaList';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SmTableCell = withStyles(theme => ({
  root: {
    padding: '2px 10px 2px 2px'
  }
}))(props => <TableCell {...props} />);

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class CriteriaList extends React.Component {
  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    const { Criteria, IsInEditMode, UpdateField, OnDeleteCriteriaClick } = this.props;

    return (
      <Table>
        <TableHead>
          <TableRow>
            <SmTableCell>LABEL</SmTableCell>
            <SmTableCell>DESCRIPTION</SmTableCell>
            <SmTableCell>{IsInEditMode ? 'DELETE' : ''}</SmTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Criteria.map(crit =>
            IsInEditMode ? (
              <TableRow key={crit.id}>
                <SmTableCell>
                  <TextField
                    value={crit.label}
                    placeholder="Label"
                    onChange={e => UpdateField(crit.id, 'label', e.target.value)}
                  />
                </SmTableCell>
                <SmTableCell>
                  <TextField
                    value={crit.description}
                    placeholder="Description"
                    style={{ width: '20em' }}
                    onChange={e => UpdateField(crit.id, 'description', e.target.value)}
                  />
                </SmTableCell>
                <SmTableCell>
                  <IconButton size="small" onClick={() => OnDeleteCriteriaClick(crit.id)}>
                    <DeleteIcon />
                  </IconButton>
                </SmTableCell>
              </TableRow>
            ) : (
              <TableRow key={crit.id}>
                <SmTableCell>{crit.label}</SmTableCell>
                <SmTableCell>{crit.description}</SmTableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    );
  }
}

CriteriaList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  Criteria: PropTypes.array,
  IsInEditMode: PropTypes.bool,
  UpdateField: PropTypes.func,
  OnDeleteCriteriaClick: PropTypes.func
};

CriteriaList.defaultProps = {
  Criteria: [],
  IsInEditMode: false,
  UpdateField: () => {
    console.error('Missing UpdateField handler');
  },
  OnDeleteCriteriaClick: () => {
    console.error('Missing OnDeleteCriteriaClick handler');
  }
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(CriteriaList);
