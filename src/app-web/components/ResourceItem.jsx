/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import ClassNames from 'classnames';
// Material UI Elements
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import DescriptionIcon from '@material-ui/icons/Description';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ImageIcon from '@material-ui/icons/Image';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import UR from '../../system/ursys';
import DATA from '../modules/pmc-data';
import EvidenceList from './EvidenceList';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'ResourceItem:';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class ResourceItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isExpanded: true
    };

    this.DoToggleExpanded = this.DoToggleExpanded.bind(this);
    this.DoEvidenceLinkOpen = this.DoEvidenceLinkOpen.bind(this);
    this.DoDataUpdate = this.DoDataUpdate.bind(this);
    this.OnResourceClick = this.OnResourceClick.bind(this);
    this.OnCreateEvidence = this.OnCreateEvidence.bind(this);
    this.DoCollapseAll = this.DoCollapseAll.bind(this);

    UR.Sub('SHOW_EVIDENCE_LINK', this.DoEvidenceLinkOpen);
    UR.Sub('DATA_UPDATED', this.DoDataUpdate);
    UR.Sub('RESOURCES:COLLAPSE_ALL', this.DoCollapseAll);
    // FIXME: Resource is getting closed before selection, force it open again
    UR.Sub('SET_EVIDENCE_LINK_WAIT_FOR_SOURCE_SELECT', this.DoEvidenceLinkOpen);
  }

  componentDidMount() { }

  componentWillUnmount() {
    UR.Unsub('SHOW_EVIDENCE_LINK', this.DoEvidenceLinkOpen);
    UR.Unsub('DATA_UPDATED', this.DoDataUpdate);
    UR.Unsub('RESOURCES:COLLAPSE_ALL', this.DoCollapseAll);
    UR.Unsub('SET_EVIDENCE_LINK_WAIT_FOR_SOURCE_SELECT', this.DoEvidenceLinkOpen);
  }

  DoToggleExpanded() {
    if (DBG) console.log(PKG, 'expansion clicked');
    this.setState(prevState => {
      return {
        isExpanded: !prevState.isExpanded
      };
    });
  }

  DoDataUpdate() {}

  DoEvidenceLinkOpen(data) {
    if (this.props.resource.rsrcId === data.rsrcId) {
      if (DBG) console.log(PKG, 'OPENING Resource', data.rsrcId, ' data.evId is', data);
      this.setState(
        {
          isExpanded: true
        },
        () => {
          // First open resource list, then open evidence Link
          UR.Publish('SHOW_EVIDENCE_LINK_SECONDARY', data);
        }
      );
    }
  }

  OnResourceClick(rsrcId) {
    if (DBG) console.log(PKG, 'Resource clicked', rsrcId);
    UR.Publish('SHOW_RESOURCE', { rsrcId });
  }

  OnCreateEvidence(rsrcId) {
    if (DBG) console.log(PKG, 'create new evidence:', rsrcId);
    let evId = DATA.PMC_AddEvidenceLink(rsrcId);
    UR.Publish('SHOW_EVIDENCE_LINK', { evId, rsrcId });
  }

  DoCollapseAll() {
    // FIXME: Why is `this` undefined?!?
    if (this) {
      this.setState({ isExpanded: false });
    }
  }

  render() {
    const { resource, classes } = this.props;
    const { isExpanded } = this.state;
    let evBadge = {};
    if (!isExpanded) {
      if (resource.links > 0) {
        evBadge = <Chip className={classes.evidenceBadge} label={resource.links} color="primary" />;
      } else {
        evBadge = <Chip className={classes.evidenceBadge} label="" />;
      }
    } else {
      evBadge = '';
    }
    return (
      <div>
        <ListItem button key={resource.id} onClick={() => this.OnResourceClick(resource.rsrcId)}>
          <ListItemAvatar>
            <Avatar className={classes.resourceViewAvatar}>{resource.referenceLabel}</Avatar>
          </ListItemAvatar>
          <ListItemText
            className={ClassNames(
              classes.resourceViewLabel,
              isExpanded ? classes.resourceViewLabelExpanded : ''
            )}
            primary={`${resource.label}`}
            secondary={`${resource.notes}`}
          />
          <ListItemSecondaryAction>
            {resource.type === 'simulation' ? <ImageIcon /> : <DescriptionIcon />}
            {evBadge}
            <Button className={classes.resourceExpandButton} onClick={this.DoToggleExpanded}>
              <ExpandMoreIcon className={isExpanded ? classes.iconExpanded : ''} />
            </Button>
          </ListItemSecondaryAction>
        </ListItem>
        {isExpanded ? (
          <div className={classes.resourceViewEvList}>
            <EvidenceList rsrcId={resource.rsrcId} key={`${resource.rsrcId}ev`} />
            <Button
              size="small"
              color="primary"
              onClick={() => this.OnCreateEvidence(resource.rsrcId)}
            >
              Create Evidence
            </Button>
          </div>
        ) : ''}
      </div>
    );
  }
}

ResourceItem.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  resource: PropTypes.object
};

ResourceItem.defaultProps = {
  classes: {},
  resource: {
    rsrcId: '',
    referenceLabel: '',
    label: '',
    notes: '',
    type: '',
    url: '',
    links: 0
  }
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(ResourceItem);
