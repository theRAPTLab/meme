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
import TableSortLabel from '@material-ui/core/TableSortLabel';
// Material UI Theming
import DeleteIcon from '@material-ui/icons/DeleteOutlined';
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import SESSION from '../../system/common-session';
import ADM from '../modules/data';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function HumanDate(timestamp) {
  if (timestamp === undefined || timestamp === '') return '<no date>';
  const date = new Date(timestamp);
  const timestring = date.toLocaleTimeString('en-Us', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const datestring = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  return `${datestring} ${timestring}`;
}

function DescendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function GetComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => DescendingComparator(a, b, orderBy)
    : (a, b) => -DescendingComparator(a, b, orderBy);
}

function Sort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
}

class ModelsListTable extends React.Component {
  constructor() {
    super();
    this.state = {
      order: 'desc',
      orderBy: 'dateModified'
    };
    this.OnSortClick = this.OnSortClick.bind(this);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  OnSortClick(id) {
    this.setState(state => ({
      order: state.orderBy === id && state.order === 'asc' ? 'desc' : 'asc',
      orderBy: id
    }));
  }

  render() {
    const {
      classes,
      models,
      isAdmin,
      showGroup,
      OnModelSelect,
      OnModelMove,
      OnModelClone,
      OnModelDelete
    } = this.props;
    const { orderBy, order } = this.state;

    const showAdminOnlyView = SESSION.IsTeacher() || isAdmin;
    const isLoggedIn = SESSION.LoggedInName() !== undefined;

    const headCells = [{ id: 'title', label: 'TITLE' }];
    if (showAdminOnlyView) {
      headCells.push({ id: 'groupLabel', label: 'CLASSROOM:GROUP' });
    } else if (showGroup) {
      headCells.push({ id: 'groupLabel', label: 'GROUP' });
    }
    headCells.push(
      { id: 'dateModified', label: 'UPDATED' },
      { id: 'dateCreated', label: 'CREATED' },
      { id: 'actions', label: '' }
    );

    const modelsWithGroupLabels = models.map(m => {
      // in showAdminOnlyView, also show Classrooms
      return Object.assign(m, {
        groupLabel: showAdminOnlyView
          ? `${ADM.GetClassroomNameByGroup(m.groupId)}:${ADM.GetGroupName(m.groupId)}`
          : ADM.GetGroupName(m.groupId)
      });
    });

    return (
      <Paper className={classes.admPaper}>
        <Table>
          <TableHead>
            <TableRow>
              {headCells.map(c => (
                <TableCell key={c.id}>
                  <TableSortLabel
                    active={orderBy === c.id}
                    direction={orderBy === c.id ? order : 'asc'}
                    onClick={() => this.OnSortClick(c.id)}
                  >
                    {c.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Sort(modelsWithGroupLabels, GetComparator(order, orderBy)).map(model => (
              <TableRow key={model.id}>
                <TableCell>
                  {isLoggedIn ? (
                    <Button color="primary" onClick={e => OnModelSelect(model.id)}>
                      {model.title}
                    </Button>
                  ) : (
                    model.title
                  )}
                </TableCell>
                {(showAdminOnlyView || showGroup) && <TableCell>{model.groupLabel}</TableCell>}
                <TableCell>{HumanDate(model.dateModified)}</TableCell>
                <TableCell>{HumanDate(model.dateCreated)}</TableCell>
                <TableCell>
                  {showAdminOnlyView ? (
                    <Button onClick={e => OnModelMove(model.id)}>MOVE</Button>
                  ) : (
                    ''
                  )}
                  <Button onClick={e => OnModelClone(model.id)}>CLONE</Button>
                  {showAdminOnlyView && !model.deleted ? (
                    <Button onClick={e => OnModelDelete(model.id)}>
                      <DeleteIcon />
                    </Button>
                  ) : (
                    ''
                  )}
                </TableCell>
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
  isAdmin: PropTypes.bool,
  showGroup: PropTypes.bool,
  OnModelSelect: PropTypes.func,
  OnModelMove: PropTypes.func,
  OnModelClone: PropTypes.func,
  OnModelDelete: PropTypes.func
};

ModelsListTable.defaultProps = {
  classes: {},
  models: [],
  isAdmin: false,
  showGroup: false,
  OnModelSelect: () => {
    console.error('Missing OnModeSelect handler');
  },
  OnModelMove: () => {
    console.error('Missing OnModelMove handler');
  },
  OnModelClone: () => {
    console.error('Missing OnModelClone handler');
  },
  OnModelDelete: () => {
    console.error('Missing OnModelDelete handler');
  }
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(ModelsListTable);
