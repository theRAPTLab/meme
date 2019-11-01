/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Resource View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Chip from '@material-ui/core/Chip';
import Modal from '@material-ui/core/Modal';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
// Material UI Icons
import ImageIcon from '@material-ui/icons/Image';
import DescriptionIcon from '@material-ui/icons/Description';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import UR from '../../system/ursys';
import DATA from '../modules/data';
import ADM from '../modules/data';
import UTILS from '../modules/utils';
import EvidenceList from './EvidenceList';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'ResourceView:';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class ResourceView extends React.Component {
  constructor(props) {
    super(props);
    this.OnOpen = this.OnOpen.bind(this);
    this.OnClose = this.OnClose.bind(this);
    this.OnCreateEvidence = this.OnCreateEvidence.bind(this);

    this.state = {
      isOpen: false,
      resource: {}
    };

    UR.Subscribe('RESOURCEVIEW:OPEN', this.OnOpen);
    UR.Subscribe('RESOURCEVIEW:CLOSE', this.OnClose);
  }

  componentDidMount() {}

  componentWillUnmount() {
    UR.Unsubscribe('RESOURCEVIEW:OPEN', this.OnOpen);
    UR.Unsubscribe('RESOURCEVIEW:CLOSE', this.OnClose);
  }

  OnOpen(data) {
    if (DBG) console.log('ViewMain: clicked on ', data.rsrcId);
    // Look up resource
    let resource = ADM.Resource(data.rsrcId);
    if (resource) {
      this.setState({
        isOpen: true,
        resource
      });
      UTILS.RLog('ResourceOpen', resource.label);
    } else {
      console.error('ViewMain: Could not find selected resource id', data.rsrcId);
    }
  }

  OnCreateEvidence(rsrcId) {
    if (DBG) console.log(PKG, 'create new evidence:', rsrcId);
    DATA.PMC_AddEvidenceLink({ rsrcId }, id => UR.Publish('SHOW_EVIDENCE_LINK', { evId: id, rsrcId }));
  }

  OnClose() {
    this.setState({
      isOpen: false
    });
  }

  render() {
    const { isOpen, resource } = this.state;
    const { classes } = this.props;

    return (
      <Modal
        className={classes.resourceView}
        disableBackdropClick={false}
        hideBackdrop={false}
        open={isOpen}
        onClose={this.OnClose}
      >
        <Paper className={classes.resourceViewPaper}>
          <div className={classes.resourceViewTitle}>
            <div className={classes.resourceViewWindowLabel}>RESOURCE VIEW</div>
            <Avatar className={classes.resourceViewAvatar}>{resource.referenceLabel}</Avatar>
            &nbsp;
            <div style={{ flexGrow: 1 }}>{resource.label}</div>
            <Card className={classes.resourceViewCard}>
              <CardContent className={classes.resourceViewCardContent}>
                <Typography variant="overline">Notes:&nbsp;</Typography>
                <Typography variant="body2">{resource.notes}</Typography>
              </CardContent>
            </Card>
            <Card className={classes.resourceViewCard}>
              <CardContent className={classes.resourceViewCardContent}>
                <Typography variant="overline">Type:&nbsp;</Typography>
                <Typography variant="body2">
                  {resource.type}{' '}
                  {resource.type === 'simulation' ? <ImageIcon /> : <DescriptionIcon />}
                </Typography>
              </CardContent>
            </Card>
            <Card className={classes.resourceViewCard}>
              <CardContent className={classes.resourceViewCardContent}>
                <Typography variant="overline">Links:&nbsp;</Typography>
                <Chip
                  className={classes.resourceViewLinksBadge}
                  label={resource.links}
                  color="primary"
                />
              </CardContent>
            </Card>
            <Button className={classes.evidenceCloseBtn} onClick={this.OnClose} color="primary">
              Close
            </Button>
          </div>
          <div style={{ display: 'flex', height: 'inherit' }}>
            <iframe src={resource.url} style={{ height: '90%', flexGrow: '1' }} title="resource" />
            <div className={classes.resourceViewSidebar}>
              <TextField
                id="informationNote"
                label="Our Notes"
                placeholder="We noticed..."
                multiline
                rows="5"
                className={classes.resourceViewNote}
                margin="normal"
                variant="outlined"
              />
              <Typography variant="caption">OUR EVIDENCE LIST</Typography>
              <div className={classes.resourceViewSidebarEvidenceList}>
                <EvidenceList rsrcId={resource.id} />
              </div>
              <Button
                className={classes.resourceViewCreatebutton}
                variant="contained"
                onClick={() => this.OnCreateEvidence(resource.id)}
                color="primary"
                hidden={ADM.IsViewOnly()}
              >
                Create Evidence
              </Button>
            </div>
          </div>
        </Paper>
      </Modal>
    );
  }
}

ResourceView.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object
};

ResourceView.defaultProps = {
  classes: {}
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(ResourceView);
