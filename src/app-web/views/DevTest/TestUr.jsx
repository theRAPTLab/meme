/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  TestUR - rudimentary network tests

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// REACT STUFF ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

/// MODULES ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import UR from '../../../system/ursys';
import NETTEST from './network-tests';

/// CSS IMPORTS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import { cssinfo, cssalert } from '../../modules/console-styles';

/// DEBUG CONTROL /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

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
UR.Hook(__dirname, 'INITIALIZE', function() {
  console.log('Initialized');
});

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class TestUR extends React.Component {
  // constructor
  constructor(props) {
    super(props);
    UR.ReactPreflight(TestUR, module);

    this.cstrName = this.constructor.name;
    this.feature = undefined;
    this.AddTestResult = this.AddTestResult.bind(this);
    this.RegisterTest = this.RegisterTest.bind(this);
    this.state = {
      tests: []
    };
    this._mounted = false;
    // test data structures
    this.tests = [];
    this.passed = [];
    this.failed = [];
    this.queuedResults = [];
    // test
    this.Test(props.match.params.feature || '<no test selected>');
  }

  componentDidMount() {
    console.log(`<${this.cstrName}> mounted`);
    this._mounted = true;
    this.Test();
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  Test(feature) {
    // construction time
    if (!this.feature) {
      this.feature = feature;
      NETTEST.DoConstructionTests(this);
      return;
    }
    // after construction, this.feature is set
    NETTEST.DoMountTests(this);
  }

  AddTestResult(name, error) {
    const status = error === undefined ? 'OK' : error;
    this.queuedResults.push({ name, status });
    if (this._mounted) this.setState({ tests: this.queuedResults });
  }

  DidTestsComplete(numtests) {
    console.log(`tests initiated ${this.tests.length}`);
    console.log(`tests passed ${this.passed.length}`);
    console.log(`tests failed ${this.failed.length}`);
    let union = [...new Set([...this.passed, ...this.failed])];
    let difference = this.tests.filter(x => !union.includes(x));
    if (difference.length) console.log(`tests incomplete %c${difference.join(', ')}`, cssalert);
    if (this.failed.length) console.log(`tests failed %c${this.failed.join(', ')}`, cssalert);
    return this.tests.length - union.length + (numtests - this.tests.length) === 0;
  }

  RegisterTest(testname) {
    const dbg = true;
    if (dbg) console.log('registering test:', testname);
    let test = {
      name: testname,
      fail: function(status) {
        if (dbg) console.log(`%cfailed test: ${testname}`, cssinfo);
        this.AddTestResult(test.name, status);
        this.failed.push(test.name);
      },
      pass: function() {
        if (dbg) console.log(`%cpassed test: ${testname}`, cssinfo);
        this.AddTestResult(test.name);
        this.passed.push(test.name);
      }
    };
    test.pass = test.pass.bind(this);
    test.fail = test.fail.bind(this);
    //
    this.tests.push(testname);
    return test;
  }

  render() {
    const { classes } = this.props;
    NETTEST.DoRenderTests();
    return (
      <div className={classes.root}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper className={classes.paper}>Module:{this.cstrName}</Paper>
          </Grid>

          {this.state.tests.map((test, i) => {
            let bgcolor = test.status === 'OK' ? 'white' : 'red';
            if (test.status === 'PASS') bgcolor = 'limegreen';
            return (
              <Grid item xs={4} key={i}>
                <Paper className={classes.paper} style={{ backgroundColor: bgcolor }}>
                  {test.name} = {test.status}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </div>
    );
  }
} // TestUR component

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// default props are expect properties that we expect
/// and are declared for validation
TestUR.defaultProps = {
  classes: { isDefaultProps: true }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// propTypes are declared. Note "vague" propstypes are
/// disallowed by eslint, so use shape({prop: ProtType })
/// to describe them in more detail
TestUR.propTypes = {
  classes: PropTypes.shape({})
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// required for UR EXEC phase filtering by view path
TestUR.MOD_ID = __dirname;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(styles)(TestUR);
