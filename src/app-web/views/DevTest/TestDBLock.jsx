/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  TestDBLock - example of synchronizing via clients


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// REACT STUFF ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Fade from '@material-ui/core/Fade'

/// MODULES ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import UR from '../../../system/ursys';
import ADM from '../../modules/data';

/// CSS IMPORTS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import { cssinfo, cssalert } from '../../modules/console-styles';

/// DEBUG CONTROL /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const SEC = 10;

/// COMPUTED STYLES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const styles = theme => ({
  root: {
    flexGrow: 1
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary
  }
});

/// MODULE HOOKS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.Hook(__dirname, 'INITIALIZE', function () {
  console.log('Initialized');
});

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class TestDBLock extends React.Component {
  // constructor
  constructor(props) {
    super(props);
    UR.ReactPreflight(TestDBLock, module);
    this.cstrName = `${this.constructor.name} ${UR.SocketUADDR()}`;
    this._mounted = false;
    this.state = {
      status: 'loading'
    };
    //
    this.editingCommentId = undefined; // for comment lock
    //
    this.ULINK = UR.NewConnection('TestDBLock');
  }

  componentDidMount() {
    console.log(`<${this.cstrName}> mounted`);
    this._mounted = true;
    let status = '';
    // immediately-executed asynchronous function
    ADM.Login('bob-z4in').then(rdata => {
      if (rdata.success) status += `'${rdata.token.split('-')[0]}' ${rdata.status}! `;
      UR.DBTryLock('pmcData.entities', [1, 1])
        .then(rdata => {
          const { success, semaphore, uaddr, lockedBy } = rdata;
          status += success ? `${semaphore} lock acquired by ${uaddr} ` : `failed to acquired ${semaphore} lock `;
          this.setState({ status });
          if (rdata.success) {
            console.log('do something here because u-locked!');
          } else {
            console.log('aw, locked by', rdata.lockedBy);
          }
        });
    });
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper className={classes.paper}>Module:{this.cstrName}</Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <p>
                OPEN TWO or MORE instance of /#/test-dblock and observe console
                Try refreshing different instances
              </p>
            </Paper>
            <Fade in={true} timeout={1000}>
              <Paper className={classes.paper}>
                <p>{this.state.status}</p>
              </Paper>
            </Fade>
          </Grid>
        </Grid>
      </div >
    );
  }
} // TestDBLock component

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// default props are expect properties that we expect
/// and are declared for validation
TestDBLock.defaultProps = {
  classes: { isDefaultProps: true }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// propTypes are declared. Note "vague" propstypes are
/// disallowed by eslint, so use shape({prop: ProtType })
/// to describe them in more detail
TestDBLock.propTypes = {
  classes: PropTypes.shape({})
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// required for UR EXEC phase filtering by view path
TestDBLock.MOD_ID = __dirname;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(styles)(TestDBLock);
