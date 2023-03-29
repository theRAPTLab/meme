/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Resource View

Instead of creating yet another database table to hold Resource Notes, we just
the Comment system.

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

// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import UR from '../../system/ursys';
import DATA from '../modules/data';
import ADM from '../modules/data';
import ASET from '../modules/adm-settings';
import PMCObj from '../modules/pmc-objects';
import UTILS from '../modules/utils';
import EvidenceList from './EvidenceList';
import DEFAULTS from '../modules/defaults';

/// RESOURCE TYPES /////////////////////////////////////////////////////////////////
// Material UI Icons
// I want to move this somewhere centralized but wasn't sure the best way, so this is a teemporary shifting
// in how it is referenced to make it easier later
import ImageIcon from '@material-ui/icons/Image';
import DescriptionIcon from '@material-ui/icons/Description';
import EmojiObjectsIcon from '@material-ui/icons/EmojiObjects';
import ContactSupportIcon from '@material-ui/icons/ContactSupport';

const RESOURCE_TYPES = {
  simulation: <ImageIcon />,
  assumption: <EmojiObjectsIcon />,
  idea: <EmojiObjectsIcon />,
  report: <DescriptionIcon />,
  question: <ContactSupportIcon />,
  other: <DescriptionIcon />
};

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
    this.OnDataUpdate = this.OnDataUpdate.bind(this);
    this.ContinueOpen = this.ContinueOpen.bind(this);
    this.OnCreateEvidence = this.OnCreateEvidence.bind(this);
    this.OnNoteChange = this.OnNoteChange.bind(this);
    this.OnNoteSave = this.OnNoteSave.bind(this);
    this.OnClose = this.OnClose.bind(this);

    this.state = {
      isOpen: false,
      resource: {},
      noteRefId: '', // points comment to this resource
      note: 'blank',
      noteIsDisabled: true,
      commentId: -1 // id of the comment object used to hold the note data
    };

    UR.Subscribe('RESOURCEVIEW:OPEN', this.OnOpen);
    UR.Subscribe('RESOURCEVIEW:CLOSE', this.OnClose);
    UR.Subscribe('DATA_UPDATED', this.OnDataUpdate);
  }

  componentDidMount() {}

  componentWillUnmount() {
    UR.Unsubscribe('RESOURCEVIEW:OPEN', this.OnOpen);
    UR.Unsubscribe('RESOURCEVIEW:CLOSE', this.OnClose);
    UR.Unsubscribe('DATA_UPDATED', this.OnDataUpdate);
  }

  OnOpen(data) {
    if (DBG) console.log('ViewMain: clicked on ', data.rsrcId);
    // Look up resource
    const resource = ADM.Resource(data.rsrcId);
    const noteRefId = `res${data.rsrcId}`;
    if (resource) {
      const comments = DATA.GetComments(noteRefId);
      if (comments.length < 1) {
        // no comment defined yet, so create a new comment
        const comment = PMCObj.Comment({
          refId: noteRefId,
          author: ADM.GetAuthorId()
        });
        DATA.DB_CommentAdd(noteRefId, comment, () => this.ContinueOpen(resource, noteRefId));
      } else {
        // just open it
        this.ContinueOpen(resource, noteRefId);
      }
    } else {
      console.error('ViewMain: Could not find selected resource id', data.rsrcId);
    }
  }

  OnDataUpdate() {
    const comments = DATA.GetComments(this.state.noteRefId);
    if (comments.length > 0) {
      const comment = comments[0];
      if (this.state.note !== comment.text) {
        this.setState({ note: comment.text });
      }
    }
  }

  ContinueOpen(resource, noteRefId) {
    const comments = DATA.GetComments(noteRefId);
    if (comments.length < 1)
      throw Error('There should be at least one comment saved as a Resource note!');
    const note = comments[0].text;
    const commentId = comments[0].id;

    const pmcDataId = ASET.selectedPMCDataId;
    const intCommentId = Number(commentId);
    UR.DBTryLock('pmcData.comments', [pmcDataId, intCommentId]).then(rdata => {
      const { success, semaphore, uaddr, lockedBy } = rdata;
      status += success
        ? `${semaphore} lock acquired by ${uaddr} `
        : `failed to acquired ${semaphore} lock `;
      if (rdata.success) {
        this.setState({ noteIsDisabled: false });
      } else {
        alert(
          `Sorry, someone else (${rdata.lockedBy}) is editing this Resource Note right now.  Please try again later. (You can still ${DEFAULTS.TEXT.ADD_EVIDENCE}.)`
        );
      }
    });

    this.setState({
      isOpen: true,
      resource,
      noteRefId,
      note,
      commentId
    });
    UTILS.RLog('ResourceOpen', resource.label);
  }

  OnCreateEvidence(rsrcId) {
    if (DBG) console.log(PKG, 'create new evidence:', rsrcId);
    const resourceFrame = document.getElementById('resourceFrame');
    if (resourceFrame !== null) {
      const px = window.devicePixelRatio;
      const sx = resourceFrame.offsetLeft * px;
      const sy = resourceFrame.offsetTop * px;
      const sw = resourceFrame.clientWidth * px;
      const sh = resourceFrame.clientHeight * px;
      let opt = { sx, sy, sw, sh };
      UR.PromiseCaptureScreen(opt).then(rdata => {
        const { href, error } = rdata;
        if (error) console.log('PromiseCaptureScreen:', error);
        // Always create evidence link even if href is undefined
        DATA.PMC_AddEvidenceLink({ rsrcId, imageURL: href }, id =>
          UR.Publish('SHOW_EVIDENCE_LINK', { evId: id, rsrcId })
        );
      });
    }
  }

  // User has edited the note by typing
  OnNoteChange(e) {
    this.setState({ note: e.target.value });
  }

  OnNoteSave() {
    const note = PMCObj.Comment({
      id: this.state.commentId,
      text: this.state.note,
      refId: this.state.noteRefId,
      author: ADM.GetAuthorId()
    });
    DATA.DB_CommentUpdate(this.state.noteRefId, note);
  }

  OnClose() {
    const pmcDataId = ASET.selectedPMCDataId;
    const intCommentId = Number(this.state.commentId);
    if (intCommentId >= 0) {
      // If intCommentId is -1 then the ResourceView was never opened
      // so don't bother to release.  Otherwise this will generate a ur-link error
      // due to an invalid ID (-1 is invalid).
      UR.DBTryRelease('pmcData.comments', [pmcDataId, intCommentId]);
    }
    this.setState({
      isOpen: false,
      noteIsDisabled: true
    });
  }

  render() {
    const { isOpen, resource, note, noteIsDisabled } = this.state;
    const { classes } = this.props;

    // don't render if resource hasn't been defined yet
    if (resource === undefined || resource.id === undefined) return '';
    const links = resource.links || 0;

    return (
      <Paper className={classes.resourceViewPaper} hidden={!isOpen}>
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
                {RESOURCE_TYPES[resource.type]
                  ? RESOURCE_TYPES[resource.type]
                  : RESOURCE_TYPES.other}
              </Typography>
            </CardContent>
          </Card>
          <Card className={classes.resourceViewCard}>
            <CardContent className={classes.resourceViewCardContent}>
              <Typography variant="overline">Links:&nbsp;</Typography>
              <Chip className={classes.resourceViewLinksBadge} label={links} color="primary" />
            </CardContent>
          </Card>
          <Button className={classes.evidenceCloseBtn} onClick={this.OnClose} color="primary">
            Close
          </Button>
        </div>
        <div style={{ display: 'flex', height: 'inherit' }}>
          <iframe
            id="resourceFrame"
            src={resource.url}
            style={{ height: '90%', flexGrow: '1' }}
            title="resource"
          />
          <div className={classes.resourceViewSidebar}>
            <TextField
              id="informationNote"
              label="Our Notes"
              placeholder="We noticed..."
              multiline
              rows="10"
              className={classes.resourceViewNote}
              margin="normal"
              variant="outlined"
              value={note}
              disabled={noteIsDisabled}
              onChange={this.OnNoteChange}
              onBlur={this.OnNoteSave}
            />
            <Typography variant="caption">OUR EVIDENCE LINKS</Typography>
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
              {DEFAULTS.TEXT.ADD_EVIDENCE}
            </Button>
          </div>
        </div>
      </Paper>
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
