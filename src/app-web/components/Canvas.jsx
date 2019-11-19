/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.refCanvas = React.createRef();
    this.refImage = React.createRef();
    this.refContainer = React.createRef();
    this.imageURL = '';
    // assigned in componentDidMount()
    this.viewBox = null;
    this.canvas = null;
    this.image = null;
  }

  componentDidMount() {
    // save reference elements
    this.canvas = this.refCanvas.current;
    this.image = this.refImage.current;
    this.view = this.refContainer.current;
    // resize canvas to full width and set height
    const ww = this.view.clientWidth;
    this.canvas.width = ww;
    this.canvas.height = this.canvas.width * 0.75;
    // draw into context
    const ctx = this.canvas.getContext('2d');
    ctx.rect(0, 0, this.canvas.width / 2, this.canvas.height / 2);
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  render() {
    return (
      <div ref={this.refContainer}>
        <canvas ref={this.refCanvas} style={{ width: '100%', border: '1px solid black' }} />
        <img ref={this.refImage} src={this.imageURL} style={{ display: 'none' }} alt="" />
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Canvas;
