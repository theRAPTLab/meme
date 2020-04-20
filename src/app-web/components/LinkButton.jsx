/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

LinkButton

A LinkButton is used to select and show the source or target
component/property/mechanism that an Evidence Link points to.

Communication with its parent is via props since this really is not an
indpendent component and needs to be carefully managed by its parent.

It has four states:

1. "Target Not Set"
    When an object is first created the target of the link is not set, so the
    button displays "Target Not Set".  The button is disabled at this point.

2. "Set Target"
    If the parent object is edtiable, the button is enabled, and the user can
    click the button to then select a target.
    this.props.OnLinkButtonClick needs to handle this transition and set the
    this.props.listenForSourceSelection to true to tell the button to
    display the "Click on Target" state.

3. "Click on Target"
    After the user has clicked on "Set Target" the button is waiting for
    the user to select a component/prop/mech.  The parent object should
    handle the selection.

4.  "Label"
    Once a source / target component/property/mechanism has been set
    the button displays the name of the object in the right color
    according to the this.props.sourceType (e.g. 'mech' || 'prop')

In addition, it has a smaller and larger views to correspond with
the expanded state in Evidence Links.

The parent component basically nees to handle three things:

1. Handle the `OnLinkButtonClick` prop method to respond to clicks and
    when clicked...
2. ...Set `listenForSourceSelection` prop to true to make the button show
    "Click on Target", and when a selection is received...
3. ...Set the `sourceLabel` (and `sourceType`) prop when the selection
    is made by theuser.

See MechDialog and EvidenceLink for example implementations.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
// Material UI Icons
import CreateIcon from '@material-ui/icons/Create';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class LinkButton extends React.Component {
  constructor(props) {
    super(props);
    this.OnClick = this.OnClick.bind(this);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  OnClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.OnLinkButtonClick();
  }

  render() {
    const {
      sourceLabel,
      sourceType,
      listenForSourceSelection,
      isBeingEdited,
      isExpanded,
      classes
    } = this.props;
    let label;
    let icon;
    let evidenceLinkSelectButtonClass = classes.evidenceLinkSelectButton;

    if (sourceLabel !== undefined) {
      label = sourceLabel;
      switch (sourceType) {
        case 'mech':
          if (label === '') label = 'unlabeled';
          evidenceLinkSelectButtonClass = classes.evidenceLinkSourceMechAvatarSelected;
          break;
        default:
        case 'prop':
          evidenceLinkSelectButtonClass = classes.evidenceLinkSourcePropAvatarSelected;
          break;
      }
    } else if (listenForSourceSelection) {
      label = 'Click on Target...';
      icon = <ArrowBackIcon />;
      evidenceLinkSelectButtonClass = classes.evidenceLinkSourceAvatarWaiting;
    } else if (isBeingEdited) {
      label = 'Set Target';
      icon = <CreateIcon />;
    } else {
      label = 'Target Not Set';
    }

    return (
      <Button
        onClick={this.OnClick}
        className={evidenceLinkSelectButtonClass}
        disabled={!isBeingEdited || listenForSourceSelection}
        size={isExpanded ? 'large' : 'small'}
      >
        {icon}
        <span className={classes.evidenceLinkSelectButtonLabel}>{label}</span>
      </Button>
    );
  }
}

LinkButton.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object,
  sourceLabel: PropTypes.string,
  sourceType: PropTypes.string,
  listenForSourceSelection: PropTypes.bool,
  isBeingEdited: PropTypes.bool,
  isExpanded: PropTypes.bool,
  OnLinkButtonClick: PropTypes.func
};

LinkButton.defaultProps = {
  classes: {},
  sourceLabel: undefined,
  sourceType: undefined,
  listenForSourceSelection: false,
  isBeingEdited: false,
  isExpanded: false,
  OnLinkButtonClick: () => {
    console.error('Missing OnLinkButtonClick Handler!');
  }
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(LinkButton);
