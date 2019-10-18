/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Description View

This displays a `description` information for both components and mechanisms
at the bottom of the ViewMain view.

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
      label: '',
      text: '*no description*',
      lorem: `Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
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
        mechId: undefined,
        label: prop.name,
        text: prop.description
      });
    } else if (mechId) {
      const mech = DATA.Mech(mechId);
      this.setState({
        isOpen: true,
        propId: undefined,
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
    const { isOpen, propId, text, label, lorem } = this.state;
    const { classes } = this.props;

    // Fake some text
    const descriptionText =
      text !== '*no description*' && text !== undefined
        ? text
        : lorem.slice(Math.random() * lorem.length - 5);

    return (
      <Paper className={ClassNames(
        classes.descriptionViewPaper,
        propId ? classes.descriptionViewPaperPropColor : classes.descriptionViewPaperMechColor
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