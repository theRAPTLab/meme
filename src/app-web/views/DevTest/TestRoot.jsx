/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  TestRoot

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import UR from '../../../system/ursys';
import NETTEST from './network-tests';

/// CSS IMPORTS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// DEBUG CONTROL /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

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

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ViewBasic extends React.Component {
  // constructor
  constructor(props) {
    super(props);
    UR.ReloadOnViewChange();
    this.cstrName = this.constructor.name;
    this.feature = undefined;
    this.Test(props.match.params.feature || '<no test selected>');
  }

  componentDidMount() {
    console.log(`<${this.cstrName}> mounted`);
    this.Test();
  }

  Test(feature) {
    // construction time
    if (!this.feature) {
      if (!feature) {
        alert(`ERROR: test requires 'match.params.feature' passed to it on construct`);
        return;
      }
      this.feature = feature;
      switch (this.feature) {
        case 'ur':
          NETTEST.DoConstructionTests();
          break;
        default:
      }
      return;
    }
    // after construction
    switch (this.feature) {
      case 'ur':
        NETTEST.DoMountTests();
        break;
      default:
        console.log('no matching test run for', this.feature);
    }
  }

  render() {
    const { classes } = this.props;
    NETTEST.DoRenderTests();
    return (
      <div className={classes.root}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper className={classes.paper}>xs=12</Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper className={classes.paper}>xs=6</Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper className={classes.paper}>xs=6</Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper className={classes.paper}>xs=3</Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper className={classes.paper}>xs=3</Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper className={classes.paper}>xs=3</Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper className={classes.paper}>xs=3</Paper>
          </Grid>
        </Grid>
      </div>
    );
  }
} // ViewBasic component

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// default props are expect properties that we expect
/// and are declared for validation
ViewBasic.defaultProps = {
  classes: { isDefaultProps: true }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// propTypes are declared. Note "vague" propstypes are
/// disallowed by eslint, so use shape({ prop:ProtType })
/// to describe them in more detail
ViewBasic.propTypes = {
  classes: PropTypes.shape({})
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// required for UR EXEC phase filtering by view path
ViewBasic.URMOD = __dirname;
UR.EXEC.Hook(
  'INITIALIZE',
  () => {
    console.log('TestRoot Init');
  },
  __dirname
);

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(styles)(ViewBasic);
