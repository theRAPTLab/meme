/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Login

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import UR from '../../system/ursys';
import ADM from '../modules/data';

/// DEBUG /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -z
const AUTOBOB = false;

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.DoADMDataUpdate = this.DoADMDataUpdate.bind(this);
    this.OnLoginIdChange = this.OnLoginIdChange.bind(this);
    this.OnLoginDialogClose = this.OnLoginDialogClose.bind(this);
    this.OnLogin = this.OnLogin.bind(this);

    // wedge-in an indicator in case we need one
    if (props.memo) {
      this.memo = <p style={{ color: 'maroon' }}>{props.memo}</p>;
    }

    UR.Subscribe('ADM_DATA_UPDATED', this.DoADMDataUpdate);

    this.state = {
      loginId: '',
      loginDialogOpen: true,
      isValidLogin: true
    };
  }

  componentDidMount() {
    this.DoADMDataUpdate();
    if (AUTOBOB) {
      this.setState({ loginId: 'bob-z4in' }, () => {
        this.OnLogin({ preventDefault() {} });
      });
    }
  }

  componentWillUnmount() {}

  DoADMDataUpdate() {
    if (ADM.IsLoggedOut()) {
      this.setState({
        loginId: '',
        loginDialogOpen: true
      });
    }
  }

  OnLoginIdChange(e) {
    const loginId = e.target.value;
    let isValidLogin = ADM.IsValidLogin(loginId);
    this.setState({
      loginId,
      isValidLogin
    });
  }

  OnLogin(e) {
    e.preventDefault();
    if (ADM.IsValidLogin(this.state.loginId)) {
      this.setState({ isValidLogin: true });
      ADM.Login(this.state.loginId);
      this.OnLoginDialogClose();
    } else {
      // invalid login
      this.setState({
        isValidLogin: false
      });
    }
  }

  OnLoginDialogClose(event, reason) {
    if (reason !== 'backdropClick') {
      this.setState({ loginDialogOpen: false });
    }
  }

  render() {
    const { classes } = this.props;
    const { loginId, loginDialogOpen, isValidLogin } = this.state;
    const loginTitle = ADM.IsDBReadOnly() ? 'MEME Login (READ ONLY)' : 'MEME Login';

    return (
      <Dialog
        disableEscapeKeyDown
        open={loginDialogOpen}
        onClose={this.OnLoginDialogClose}
        BackdropProps={{
          classes: {
            root: classes.loginBackdrop
          }
        }}
      >
        <form onSubmit={this.OnLogin}>
          <DialogTitle>{loginTitle}</DialogTitle>
          <DialogContent>
            {this.memo}
            <DialogContentText>Please enter your login token:</DialogContentText>
            <TextField
              autoFocus
              error={!isValidLogin}
              id="loginId"
              label="Token"
              placeholder="NAME-XXXX"
              fullWidth
              value={loginId}
              onChange={this.OnLoginIdChange}
            />
          </DialogContent>
          <DialogActions>
            <Button color="primary" disabled={!isValidLogin} type="submit">
              Login
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }
}

Login.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object
};

Login.defaultProps = {
  classes: {}
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(Login);
