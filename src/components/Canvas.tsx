import * as React from 'react';
import { fabric } from 'fabric';
import { view } from 'react-easy-state';

interface Props {}

//https://stackoverflow.com/a/39186522/1103732
class Canvas extends React.Component<Props, {}> {
  private canvas: fabric.Canvas;
  private canvasRef: React.RefObject<HTMLCanvasElement>;

  constructor(props: Props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    const canvas = new fabric.Canvas('c', {
      isDrawingMode: true
    });

    canvas.on('path:created', (evt: any) => {
      console.log(evt.path.toJSON());
    });

    canvas.setWidth(400);
    canvas.setHeight(400);

    this.canvas = canvas;
  }

  render() {
    return (
      <div>
        <canvas id="c" ref={this.canvasRef} />
      </div>
    );
  }
}

export default view(Canvas);
