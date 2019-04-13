import React, { Component } from 'react';
import { fabric } from 'fabric';
import { view } from 'react-easy-state';

//https://stackoverflow.com/a/39186522/1103732
class Canvas extends Component {
  constructor() {
    super();
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    const canvas = new fabric.Canvas('c', {
      width: this.canvasRef.clientWidth,
      height: this.canvasRef.clientHeight,
      isDrawingMode: true
    });

    canvas.on('path:created', evt => {
      console.log(evt.path.toJSON());
    });

    this.fabric = canvas;
  }

  render() {
    return (
      <div>
        <canvas
          id="c"
          ref={node => {
            this.canvasRef = node;
          }}
        />
      </div>
    );
  }
}

export default view(Canvas);
