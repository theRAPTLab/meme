/*//////////////////////////////// NOTES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

REFACTORED VERSION
should be a child of RoutedView

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import '@svgdotjs/svg.draggable.js';
import PMCView from '../modules/pmc-view-refactor';
import DATA from '../modules/pmc-data';

import { cssreact, cssalert } from '../modules/console-styles';

const DBG = false;
console.log('%cWARN: using SVGView Refactor', cssalert);


/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SVGView extends React.Component {
  //
  constructor(props) {
    super(props);
    this.displayName = this.constructor.name;
    this.refContainer = React.createRef();
    // bindings
    this.DoAppLoop = this.DoAppLoop.bind(this);
    // LIFECYCLE: Initialize DataGraph
    DATA.LoadGraph();
  }

  componentDidMount() {
    // placeholder
    // LIFECYCLE: Initialize ViewGraph
    PMCView.InitializeViewgraph(this.refContainer.current);
    if (this.props.viewWidth && this.props.viewHeight) {
      this.DoAppLoop();
    } else if (DBG) console.log(`%ccomponentDidMount() skip draw`, cssalert);
  }

  componentDidUpdate(prevProps, prevState) {
    // placeholder to trap resizing
    let dimChanged = prevProps.viewWidth !== this.viewWidth;
    dimChanged = dimChanged || prevProps.viewHeight !== this.viewHeight;
    if (dimChanged) {
      const prompt = `componentDidUpdate()`;
      if (DBG)
        console.log(`%c${prompt} props ${this.props.viewWidth} ${this.props.viewHeight}`, cssreact);
      this.DoAppLoop();
      // DEBUG WINDOW UPDATE
      // PMCView.DrawTestScene(this.props.viewWidth, this.props.viewHeight);
    }
  }

  DoAppLoop() {
    // TEST DRAWING
    // PMCView.DrawSystemDiagram();
    // PMCView.DrawRects();

    // LIFECYCLE: handle changes to underlying data and queued user inputs
    PMCView.SyncPropsFromGraphData();
    PMCView.SyncMechsFromGraphData();
    PMCView.SyncBadgesFromEvLinkData();
    // LIFECYCLE: update critical lists, element states, data.
    // This is purely DATA related
    // PMCView.UpdateModel();

    // LIFECYCLE: Update the underlying viewmodel by setting modes
    // of all properties, which is used by the layout module
    PMCView.UpdateViewModel();

    // LIFECYCLE: Handle visual updates
    // (1) calls LayoutComponents() to spread 'em out
    PMCView.UpdateView();
  }

  render() {
    // NOTE: on first render
    // this.props.viewWidth and this.props.viewHeight will be 0
    // because SystemInit needs to complete its entire rendering process
    // for dimensions to begin valid
    if (DBG) {
      const css = this.props.viewWidth && this.props.viewHeight ? cssreact : cssalert;
      console.log(`%crender() props ${this.props.viewWidth}x${this.props.viewHeight}`, css);
    }
    // returns a root svg that is the PARENT of the SVGJS-created draw surface
    return (
      <svg ref={this.refContainer} width={this.props.viewWidth} height={this.props.viewHeight} />
    );
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// define the property types in detail
SVGView.propTypes = {
  viewWidth: PropTypes.number,
  viewHeight: PropTypes.number
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// defaultProps are used to populate props if they aren't passed in
SVGView.defaultProps = {
  viewWidth: 300,
  viewHeight: 300
};

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SVGView;
