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
            <TableCell>LABEL</TableCell>
            <TableCell>DESCRIPTION</TableCell>
            <TableCell>{IsInEditMode ? 'DELETE' : ''}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Criteria.map(crit =>
            IsInEditMode ? (
              <TableRow key={crit.id}>
                <TableCell>
                  <TextField
                    value={crit.label}
                    placeholder="Label"
                    onChange={e => UpdateField(crit.id, 'label', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={crit.description}
                    placeholder="Description"
                    style={{ width: '20em' }}
                    onChange={e => UpdateField(crit.id, 'description', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => OnDeleteCriteriaClick(crit.id)}>
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
