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
    /*/ evLinks
          is an array of evidence Link objects related to the resource, e.g.
          [
            {evId: "ev1", propId: "food", mechId: "fish:ammonia", rsrcId: "rs1", note: "fish need food", comments: []},
            {evId: "ev3", propId: "rotting-food", mechId: "fish:ammonia", rsrcId: "rs1", note: "fish food rots"},
            {evId: "ev4", propId: "ammonia", mechId: "fish:ammonia", rsrcId: "rs1", note: "ammonia causes fish to die"}
          ]
    /*/
    if (evLinks === undefined) return '';

    return (
      <div key={this.props.rsrcId}>
        {evLinks.map(evlink => (
          <EvidenceLink evlink={evlink} key={evlink.evId} />
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
  rsrcId: -1
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(EvidenceList);
