/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Description View

This displays a `description` information for both components and mechanisms
at the bottom of the ViewMain view.

MarkDown is supported for the description.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import ClassNames from 'classnames';
import PropTypes from 'prop-types';
import MDReactComponent from 'markdown-react-js';
import Paper from '@material-ui/core/Paper';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import UR from '../../system/ursys';
import DATA from '../modules/data';
import DATAMAP from '../../system/common-datamap';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'DescriptionView:';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class DescriptionView extends React.Component {
  constructor(props) {
    super(props);
    this.DoOpen = this.DoOpen.bind(this);
    this.DoClose = this.DoClose.bind(this);

    this.state = {
      isOpen: false,
      propId: '',
      propType: '',
      label: '',
      text: undefined
    };

    UR.Subscribe('PROP_HOVER_START', this.DoOpen);
    UR.Subscribe('PROP_HOVER_END', this.DoClose);
    UR.Subscribe('MECH_HOVER_START', this.DoOpen);
    UR.Subscribe('MECH_HOVER_END', this.DoClose);
  }

  componentDidMount() { }

  componentWillUnmount() {
    UR.Unsubscribe('PROP_HOVER_START', this.DoOpen);
    UR.Unsubscribe('PROP_HOVER_END', this.DoClose);
    UR.Unsubscribe('MECH_HOVER_START', this.DoOpen);
    UR.Unsubscribe('MECH_HOVER_END', this.DoClose);
  }

  DoOpen(data) {
    if (DBG) console.log(PKG, 'DESCRIPTION_OPEN', data);
    const propId = data.propId;
    const mechId = data.mechId;
    if (propId) {
      const prop = DATA.Prop(propId);
      this.setState({
        isOpen: true,
        propId,
        propType: prop.propType,
        mechId: undefined,
        label: prop.name,
        text: prop.description
      });
    } else if (mechId) {
      const mech = DATA.Mech(mechId);
      this.setState({
        isOpen: true,
        propId: undefined,
        propType: mech.propType, // currently undefined and not used
        mechId,
        label: mech.name,
        text: mech.description
      });
    }
  }

  DoClose() {
    if (DBG) console.log(PKG, 'DESCRIPTION_CLOSE');
    this.setState({ isOpen: false });
  }

  render() {
    const { isOpen, propId, propType, text, label } = this.state;
    const { classes } = this.props;

    // Fake some text
    const descriptionText = text || '*no description*';

    return (
      <Paper
        className={ClassNames(
          classes.descriptionViewPaper,
          propId
            ? propType === DATAMAP.PMC_MODELTYPES.OUTCOME.id
              ? classes.descriptionViewPaperOutcomeColor
              : classes.descriptionViewPaperPropColor
            : classes.descriptionViewPaperMechColor
        )}
        hidden={!isOpen}
        elevation={24}
      >
        <div style={{ overflowY: 'auto' }}>
          <div className={classes.descriptionLabel}>{label}</div>
          <MDReactComponent className={classes.descriptionViewText} text={descriptionText} />
        </div>
      </Paper>
    );
  }
}

DescriptionView.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object
};

DescriptionView.defaultProps = {
  classes: {}
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(DescriptionView);
