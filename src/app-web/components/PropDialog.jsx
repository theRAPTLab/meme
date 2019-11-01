/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Prop Dialog

Display a dialog for adding a new component or property

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
// Material UI Icons
import CloseIcon from '@material-ui/icons/Close';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import UR from '../../system/ursys';
import DATA from '../modules/data';
import ASET from '../modules/adm-settings';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'HelpView:';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class PropDialog extends React.Component {
  constructor(props) {
    super(props);
    this.DoOpen = this.DoOpen.bind(this);
    this.DoClose = this.DoClose.bind(this);
    this.OnLabelChange = this.OnLabelChange.bind(this);
    this.OnDescriptionChange = this.OnDescriptionChange.bind(this);
    this.OnClick = this.OnClick.bind(this);

    this.state = {
      isOpen: false,
      label: ``
    };

    UR.Subscribe('PROPDIALOG_OPEN', this.DoOpen);
  }

  componentDidMount() { }

  componentWillUnmount() {
    UR.Unsubscribe('PROPDIALOG_OPEN', this.DoOpen);
  }

  DoOpen(data) {
    const pmcDataId = ASET.selectedPMCDataId;
    const intPropId = Number(data.propId);
    UR.DBTryLock('pmcData.entities', [pmcDataId, intPropId])
      .then(rdata => {
        const { success, semaphore, uaddr, lockedBy } = rdata;
        status += success ? `${semaphore} lock acquired by ${uaddr} ` : `failed to acquired ${semaphore} lock `;
        if (rdata.success) {
          console.log('do something here because u-locked!');
          this.setState({
            isOpen: true,
            propId: data.propId || '', // new prop, so clear propId
            label: data.label || '', // clear the old property name
            description: data.description || '',
            isProperty: data.isProperty
          });
        } else {
          console.log('aw, locked by', rdata.lockedBy);
          alert(`Sorry, someone else (${rdata.lockedBy}) is editing this Component / Property right now.  Please try again later.`)
        }
      });
  }

  DoClose() {
    this.setState({ isOpen: false });
    const pmcDataId = ASET.selectedPMCDataId;
    const intPropId = Number(this.state.propId);
    UR.DBTryRelease('pmcData.entities', [pmcDataId, intPropId]);
    UR.Publish('PROPDIALOG_CLOSE');
  }

  OnLabelChange(e) {
    this.setState({ label: e.target.value });
  }

  OnDescriptionChange(e) {
    this.setState({ description: e.target.value });
  }

  OnClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const { propId, label, description, isProperty } = this.state;

    if (DBG) console.log('create prop');
    if (isProperty) {
      // Add a property to the selected component
      let selectedPropIds = DATA.VM_SelectedPropsIds();
      if (selectedPropIds.length > 0) {
        let parentPropId = selectedPropIds[0];
        if (DBG) console.log('...setting parent of', label, 'to', parentPropId);
        // Create new prop
        const propObj = { name: label, description, parent: parentPropId };
        DATA.PMC_PropAdd(propObj);
      }
    } else if (propId !== '') {
      // Update existing prop
      const propObj = { name: label, description };
      DATA.PMC_PropUpdate(propId, propObj);
    } else {
      // Create new prop
      const propObj = { name: label, description };
      DATA.PMC_PropAdd(propObj);
    }
    this.DoClose();
  }

  render() {
    const { isOpen, propId, label, description, isProperty } = this.state;
    const { classes } = this.props;

    return (
      <Dialog open={isOpen} onClose={this.DoClose} aria-labelledby="form-dialog-title">
        <form onSubmit={this.OnClick}>
          <DialogTitle id="form-dialog-title">Add Component/Property</DialogTitle>
          <DialogContent>
            <DialogContentText>Type a name for your component or property.</DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="propLabel"
              label="Label"
              fullWidth
              onChange={this.OnLabelChange}
              value={label}
            />
            <DialogContentText>Add a description.</DialogContentText>
            <TextField
              margin="dense"
              id="propDescription"
              label="Description"
              fullWidth
              multiline
              rowsMax="2"
              onChange={this.OnDescriptionChange}
              value={description}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.DoClose} color="primary">
              Cancel
            </Button>
            <Button type="submit" color="primary">
              {propId === '' ? 'Create' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }
}

PropDialog.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object
};

PropDialog.defaultProps = {
  classes: {}
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(PropDialog);
