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
import DEFAULTS from '../modules/defaults';
import UTILS from '../modules/utils';
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

    const component = UTILS.InitialCaps(DATAMAP.PMC_MODELTYPES.COMPONENT.label);
    const mechanism = UTILS.InitialCaps(DATAMAP.PMC_MODELTYPES.MECHANISM.label);
    const outcome = UTILS.InitialCaps(DATAMAP.PMC_MODELTYPES.OUTCOME.label);

    this.state = {
      isOpen: false,
      helptext: `

###### Definitions

**${component}** -- ${DATAMAP.PMC_MODELTYPES.COMPONENT.description}

**${mechanism}** -- ${DATAMAP.PMC_MODELTYPES.MECHANISM.description}

**${outcome}** -- ${DATAMAP.PMC_MODELTYPES.OUTCOME.description}

---

###### Create an ${component} or ${outcome}
1. Click on 'Add ${component}' or 'Add ${outcome}'
2. Type in a label
3. Type in a description, or you can add it later
4. Click 'Create'

###### Create a ${mechanism}
1. Click on 'Add ${mechanism}'
2. Click on the source ${component}/${outcome}/property
3. Click on the target ${component}/${outcome}/property
4. Type in a label
5. Type in a description, or you can add it later
6. Click 'Add'

###### Create an Evidence Link
Evidence Links should describe how a resource supports or contradicts your model's ${component}, ${outcome}, or ${mechanism}
1. View the Resource by clicking on it in the Resource Library
2. Click '${DEFAULTS.TEXT.ADD_EVIDENCE}' button
3. Type in a description
4. Click on 'Set Target' to close the resource view and select a ${component}, ${outcome}, or ${mechanism}in your model.
5. Give it a rating for how well it supports the element of the model
6. Explain 'why' you think that raiting fits
7. Click 'Save'

###### Add a Comment
1. Click on the comment icon
---`,
      credittext: `###### About MEME:

**About** -- The Model and Evidence Mapping Environment (**MEME**) was developed as part of the Scaffolding Explanations and Epistemic Development for Systems (**SEEDS**) project, a collaborative project that was funded by the National Science Foundation under award [1761019](https://www.nsf.gov/awardsearch/showAward?AWD_ID=1761019&HistoricalAwards=false) to Joshua Danish, Ravit Duncan, Cindy Hmelo-Silver and Clark Chinn.

**Design** -- The software design team included Joshua Danish, Ravit Duncan, Cindy Hmelo-Silver,
Clark Chinn, Zachary Ryan, Na'ama Av-Shalom, Mimi Moreland, Morgan Vickery, Danielle
Murphy and Christina Stiso. Software development was provided by [Inquirium](http://www.inquirium.net).

**Citation** -- Please cite the MEME software as The Modeling and Evidence Mapping Environment
(MEME) Software (2019) Danish, Duncan, Hmelo-Silver, Chinn, Ryan, Av-Shalom,
Moreland, Vickery, Murphy, Stiso.

**Contact** -- For more information, contact Joshua Danish at [jdanish@iu.edu](mailto:jdanish@iu.edu?subject=MEME) or [http://www.joshuadanish.com](http://www.joshuadanish.com).

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
    const { isOpen, helptext, credittext } = this.state;
    const { classes } = this.props;
    const criteria = ADM.GetCriteriaByModel(); // always use the current model's criteria

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
          <Divider style={{ marginBottom: '0.5em' }} />
          <div style={{ overflowY: 'scroll', paddingRight: '5px' }}>
            <h6>Criteria for a Good Model</h6>
            <CriteriaList Criteria={criteria} IsInEditMode={false} />
            <MDReactComponent className={classes.helpViewText} text={helptext} />
            <MDReactComponent className={classes.helpViewText} text={credittext} />
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
