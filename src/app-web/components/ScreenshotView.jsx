/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Screenshot Viewer

Display the screenshot and allow user to change it.

This uses react-draggable to make the help window draggable.
https://github.com/mzabriskie/react-draggable

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
// Material UI Theming
import { withStyles } from '@material-ui/core/styles';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import MEMEStyles from './MEMEStyles';
import UR from '../../system/ursys';
import DATA from '../modules/data';
import { Dropzone } from './Dropzone';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PKG = 'HelpView:';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class ScreenshotView extends React.Component {
  constructor(props) {
    super(props);
    this.DoOpen = this.DoOpen.bind(this);
    this.DoReplaceScreenshot = this.DoReplaceScreenshot.bind(this);
    this.OnDrop = this.OnDrop.bind(this);
    this.DoClose = this.DoClose.bind(this);

    this.state = {
      isOpen: false
    };

    UR.Subscribe('SCREENSHOT_OPEN', this.DoOpen);
  }

  componentDidMount() { }

  componentWillUnmount() {
    UR.Unsubscribe('SCREENSHOT_OPEN', this.DoOpen);
  }

  DoOpen(data) {
    this.setState({
      evId: data.evId,
      imageURL: data.imageURL,
      isOpen: true
    })
    this.setState({ });
  }

  DoReplaceScreenshot() {
    this.setState({
      imageURL: undefined
    });
  }
  
  OnDrop(href) {
    DATA.PMC_EvidenceUpdate(this.state.evId, { imageURL: href });
    this.setState({
      imageURL: href
    });
  }
  
  DoClose() {
    this.setState({ isOpen: false });
  }

  render() {
    const { imageURL, isOpen } = this.state;
    const { classes } = this.props;

    return (
      <Draggable>
        <Paper className={classes.screenshotViewPaper} hidden={!isOpen}>
          {imageURL === undefined
            ? <Dropzone onDrop={this.OnDrop} />
            : <div>
                <img
                  src={imageURL}
                  alt="screenshot"
                  className={classes.screenshotViewScreenshot}
                />
              </div> 
          }
          <Button
            style={{ alignSelf: 'flex-start' }}
            onClick={this.DoReplaceScreenshot}
            hidden={imageURL===undefined}
          >
            Replace Screenshot
          </Button>
          <Button
            onClick={this.DoClose}
          >
            Close
          </Button>
        </Paper>
      </Draggable>
    );
  }
}

ScreenshotView.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object
};

ScreenshotView.defaultProps = {
  classes: {}
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withStyles(MEMEStyles)(ScreenshotView);
