import * as React from 'react';
import { view, store } from 'react-easy-state';
import { Seq } from './crdt/sequence/Seq';
import { Op } from './crdt/sequence/op/Op';
import { diff, TextOp } from './Combobulator';

const textStore = store({
  selection: {
    start: 0,
    end: 0
  },
  seq: new Seq<string>('alice'),
  get content(): string {
    return textStore.seq.toArray().join('');
  },
  applyOps(ops: TextOp[]): Op[] {
    const opsToReplicate = ops.map(op => op.applyTo(textStore.seq));
    return opsToReplicate;
  }
});

interface Props {}

// interface State {
//   content: string;
//   selection: {
//     startOffset: number;
//     endOffset: number;
//   };
// }

class ReplicatedTextInput extends React.Component<Props, {}> {
  private textAreaRef: React.RefObject<HTMLTextAreaElement>;

  // private readonly selectionUpdateEvents = ['select', 'click', 'focus', 'keyup'];

  constructor(props: Props) {
    super(props);
    // this.state = {
    //   content: '',
    //   selection: {
    //     startOffset: 0,
    //     endOffset: 0
    //   }
    // };
    this.textAreaRef = React.createRef();
  }

  componentDidMount() {
    // this.selectionUpdateEvents.forEach(eventType =>
    //   this.textAreaRef.current.addEventListener(eventType, this.selectionUpdateListener)
    // );
    // alice.remove(1);
    // alice.remove(1);
    // alice.remove(1);
  }

  // private selectionUpdateListener = () =>
  //   this.setState({
  //     selection: this.getSelection()
  //   });

  // private setSelectionToDOM = (selection: any) => {
  //   const currentRef = this.textAreaRef.current;
  //   currentRef.selectionStart = selection.startOffset;
  //   currentRef.selectionEnd = selection.endOffset;
  // };

  componentWillUnmount() {
    // this.selectionUpdateEvents.forEach(eventType =>
    //   this.textAreaRef.current.removeEventListener(eventType, this.selectionUpdateListener)
    // );
  }

  private onChange = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
    const eventTarget = ev.target;
    const newContent = eventTarget.value;

    const ops = diff(
      textStore.content,
      newContent,
      textStore.selection.start,
      textStore.selection.end
    );

    // const seqValue = textStore.seq.toArray().join('');
    // console.log(`BUFFER:${seqValue}`);

    // this.updateTextArea(this.getValue(), this.getSelection());

    // console.log(
    //   `'${oldContent}' -> '${newContent}' at ${textStore.selection.start}:${
    //     textStore.selection.end
    //   }`
    // );

    const opsToReplicate = textStore.applyOps(ops);
    console.log(JSON.stringify(opsToReplicate));
  };

  private onSelect = (ev: any) => {
    const start = ev.target.selectionStart;
    const end = ev.target.selectionEnd;
    textStore.selection.start = start;
    textStore.selection.end = end;
    console.log(`${start}:${end}`);
  };

  // private updateTextArea = (content: string, selection: any) => {
  //   const updatedContent = content;
  //   const updatedSelection = selection;
  //   this.setState(
  //     {
  //       content: updatedContent,
  //       selection: updatedSelection
  //     },
  //     () => this.setSelectionToDOM(updatedSelection)
  //   );
  // };

  // private getSelection = () => {
  //   const currentRef = this.textAreaRef.current;
  //   return {
  //     startOffset: currentRef.selectionStart,
  //     endOffset: currentRef.selectionEnd
  //   };
  // };

  // private getValue = () => {
  //   const currentRef = this.textAreaRef.current;
  //   return currentRef.value;
  // };

  render() {
    return (
      <textarea
        ref={this.textAreaRef}
        value={textStore.content}
        onSelect={this.onSelect}
        onChange={this.onChange}
      />
    );
  }
}

export default view(ReplicatedTextInput);
