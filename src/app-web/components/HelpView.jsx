/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Help View

Display a general help dialog.

This uses react-draggable to make the help window draggable.
https://github.com/mzabriskie/react-draggable

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import MDReactComponent from 'markdown-react-js';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
// Material UI Icons
import CloseIcon from '@material-ui/icons/Close';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import UR from '../../system/ursys';
import ADM from '../modules/data';
import CriteriaList from '../views/ViewAdmin/components/AdmCriteriaList';
import DATAMAP from '../../system/common-datamap';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'HelpView:';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class HelpView extends React.Component {
  constructor(props) {
    super(props);
    this.DoOpen = this.DoOpen.bind(this);
    this.DoClose = this.DoClose.bind(this);

    this.state = {
      isOpen: false,
      helptext: `
###### Create a ${DATAMAP.PMC_MODELTYPES.COMPONENT.label}
1. Click on 'Add ${DATAMAP.PMC_MODELTYPES.COMPONENT.label}'

###### Create a ${DATAMAP.PMC_MODELTYPES.MECHANISM.label}
1. Click on 'Add ${DATAMAP.PMC_MODELTYPES.MECHANISM.label}'
2. Click on the source ${DATAMAP.PMC_MODELTYPES.COMPONENT.label}/${DATAMAP.PMC_MODELTYPES.OUTCOME.label}/property
3. Click on the target ${DATAMAP.PMC_MODELTYPES.COMPONENT.label}/${DATAMAP.PMC_MODELTYPES.OUTCOME.label}/property
4. Type in a label
5. Click 'Add'

###### Create an Evidence Link
Evidence Links should describe how a resource supports or contradicts your model's ${DATAMAP.PMC_MODELTYPES.COMPONENT.label}, ${DATAMAP.PMC_MODELTYPES.OUTCOME.label}, or ${DATAMAP.PMC_MODELTYPES.MECHANISM.label},
1. View the Resource by clicking on it in the Resource Library.
2. Click 'Create Evidence' button
3. Type in a description.
4. Click on 'Set Target' to close the resource view and select a ${DATAMAP.PMC_MODELTYPES.COMPONENT.label}, ${DATAMAP.PMC_MODELTYPES.OUTCOME.label}, or ${DATAMAP.PMC_MODELTYPES.MECHANISM.label}in your model.
5. Give it a rating.
6. Click 'Save'

###### Add a Comment
1. Click on the comment icon
      `
    };

    UR.Subscribe('HELP_OPEN', this.DoOpen);
  }

  componentDidMount() {}

  componentWillUnmount() {
    UR.Unsubscribe('HELP_OPEN', this.DoOpen);
  }

  DoOpen() {
    this.setState({ isOpen: true });
  }

  DoClose() {
    this.setState({ isOpen: false });
  }

  render() {
    const { isOpen, helptext } = this.state;
    const { classes } = this.props;
    const criteria = ADM.GetCriteriaByClassroom();

    return (
      <Draggable>
        <Paper className={classes.helpViewPaper} hidden={!isOpen}>
          <IconButton
            size="small"
            style={{ position: 'absolute', right: '5px', top: '5px' }}
            onClick={this.DoClose}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6">HELP</Typography>
          <Divider style={{ marginBottom: '0.5em' }}/>
          <div style={{ overflowY: 'scroll' }}>
            <h6>Criteria</h6>
            <CriteriaList Criteria={criteria} IsInEditMode={false} />
            <MDReactComponent className={classes.helpViewText} text={helptext} />
          </div>
        </Paper>
      </Draggable>
    );
  }
}

HelpView.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object
};

HelpView.defaultProps = {
  classes: {}
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(HelpView);
