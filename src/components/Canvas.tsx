import * as React from 'react';
import { fabric } from 'fabric';
import { view } from 'react-easy-state';
import { Seq } from '../crdt/sequence/Seq';

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

    // let alice = new Seq<string>('alice');
    // let bob = new Seq<string>('bob');
    // let op1 = alice.insert('h', 0);
    // let op2 = alice.insert('i', 1);
    // // Note that these operations may be applied out of order.
    // bob.apply(op2);
    // bob.apply(op1);
    // console.log(bob.get(0));
    // console.log(bob.get(1));
    // console.log(alice.toArray());
    // console.log(bob.toArray());
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
