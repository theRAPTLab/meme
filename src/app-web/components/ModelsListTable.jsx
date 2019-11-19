/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Models List Table

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import InputLabel from '@material-ui/core/InputLabel';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import ADM from '../modules/data';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function HumanDate(timestamp) {
  if (timestamp === undefined || timestamp === '') return '<no date>';
  const date = new Date(timestamp);
  const timestring = date.toLocaleTimeString('en-Us', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const datestring = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  return `${datestring} ${timestring}`;
}

class ModelsListTable extends React.Component {
  componentDidMount() { }

  componentWillUnmount() { }

  OnModelSelect(modelId) {
    this.props.OnModelSelect(modelId);
  }

  render() {
    const { classes, models } = this.props;

    return (
      <Paper className={classes.admPaper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>TITLE</TableCell>
              <TableCell>GROUP</TableCell>
              <TableCell>UPDATED</TableCell>
              <TableCell>CREATED</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {models.map(model => (
              <TableRow key={model.id}>
                <TableCell>
                  <Button color="primary" onClick={e => this.OnModelSelect(model.id)}>
                    {model.title}
                  </Button>
                </TableCell>
                <TableCell>{ADM.GetGroupName(model.groupId)}</TableCell>
                <TableCell>{HumanDate(model.dateModified)}</TableCell>
                <TableCell>{HumanDate(model.dateCreated)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    );
  }
}

ModelsListTable.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  models: PropTypes.array,
  OnModelSelect: PropTypes.func
};

ModelsListTable.defaultProps = {
  classes: {},
  models: [],
  OnModelSelect: () => {
    console.error('Missing OnModeSelect handler');
  }
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(ModelsListTable);
