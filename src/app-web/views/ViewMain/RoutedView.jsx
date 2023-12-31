// routed view is just a box holding the real view
import React from 'react';
import PropTypes from 'prop-types';
import Canvas from '../../components/Canvas';
import SVGView from '../../components/SVGView';
import SVGViewDev from '../../components/SVGViewDev';
import { cssalert } from '../../modules/console-styles';

const DBG = false;

class RoutedView extends React.Component {
  constructor(props) {
    super(props);
    this.cstrName = this.constructor.name;
    this.routedComponent = React.createRef();
    if (DBG)
      console.log(`${this.cstrName}.contructor() ${this.props.viewWidth}x${this.props.viewHeight}`);
  }

  render() {
    let { mode } = this.props.match.params;
    if (DBG)
      console.log(
        `${this.cstrName}.render() props ${this.props.viewWidth}x${this.props.viewHeight}`
      );
    // OVERRIDE UNDEFINED DEFAULT
    if (mode === undefined) mode = 'svg';
    //
    const routedProps = {
      mode,
      viewWidth: this.props.viewWidth,
      viewHeight: this.props.viewHeight
    };
    //
    switch (mode) {
      case 'canvas':
        return <Canvas {...routedProps} />;
      case 'svg':
        return <SVGView {...routedProps} />;
      case 'dev':
        return <SVGViewDev {...routedProps} />;
      default:
        return <div>unrecognized display mode:{mode}</div>;
    }
  }
}
RoutedView.propTypes = {
  match: PropTypes.shape({ params: PropTypes.shape({ mode: PropTypes.string }) }),
  viewHeight: PropTypes.number,
  viewWidth: PropTypes.number
};
RoutedView.defaultProps = {
  match: { params: '' },
  viewHeight: 64,
  viewWidth: 64
};

export default RoutedView;
