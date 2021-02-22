/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import DATA from '../modules/data';
import UR from '../../system/ursys';
import EvidenceLink from './EvidenceLink';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class EvidenceList extends React.Component {
  constructor(props) {
    super(props);
    this.HandleDataUpdate = this.HandleDataUpdate.bind(this);
    UR.Subscribe('DATA_UPDATED', this.HandleDataUpdate);
  }

  componentDidMount() {}

  componentWillUnmount() {
    UR.Unsubscribe('DATA_UPDATED', this.HandleDataUpdate);
  }

  HandleDataUpdate() {
    // If an EvidenceLink is added we need to update the list.
    this.forceUpdate();
  }

  render() {
    const { classes, rsrcId } = this.props;
    const evLinks = DATA.GetEvLinksByResourceId(rsrcId);
    if (evLinks === undefined) return '';
    // evLinks [ { id: <pmcid> propId: mechId: rsrcId: note: }, ... ]
    return (
      <div key={rsrcId}>
        {evLinks.map((evlink, index) => (
          <EvidenceLink evlink={evlink} key={index} />
        ))}
      </div>
    );
  }
}

EvidenceList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object,
  rsrcId: PropTypes.number
};

EvidenceList.defaultProps = {
  classes: {},
  rsrcId: ''
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(EvidenceList);
